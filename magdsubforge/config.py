"""Loading, checking and hot-reloading config.json.

Every behaviour of the service comes from this file; with an empty file the service passes subscriptions
through unchanged. A broken value is ignored (and reported), a broken file keeps the previous settings.
Keys starting with an underscore are comments and are ignored anywhere.
"""
import copy
import json
import os
import re
import sys
import threading

from .matching import check_when

CONFIG_ENV = "MAGDSUBFORGE_CONFIG"

DEFAULTS = {
    "server": {
        "host": "127.0.0.1", "port": 8080,
        "route": "/sub/",                        # public path; the subscription id is appended
        "subid_regex": r"^[A-Za-z0-9_-]{4,64}$",  # ids that don't match get a 404 without asking the panel
        "workers": 2, "threads": 4,              # used by gunicorn.conf.py
    },
    "panel": {
        "url": "",                               # JSON-subscription URL of your panel, the id is appended
        "page_url": "",                          # optional: browsers (Accept: text/html) are redirected here
        "timeout": 10, "verify_tls": True, "headers": {},
        "pass_headers": ["Profile-Title", "Profile-Update-Interval", "Subscription-Userinfo",
                         "Profile-Web-Page-Url", "Support-Url", "Announce", "Content-Disposition"],
    },
    "admin": {
        "path": "/admin",                        # web admin panel; it stays OFF until a password is set
        "password": "", "password_hash": "",      # use password_hash (python -m magdsubforge hash-password)
        "session_hours": 12,
        "max_failed_logins": 5, "lockout_seconds": 300,
    },
    "accounts": {
        "file": "",                              # JSON file with account values for {account.*} placeholders
        "default": {},                           # ...or put a shared account right here
    },
    "rules": [],
    "groups": [],
    "chains": [],
    "patches": [],
}

RULE_ACTIONS = ("keep", "drop", "pin_top", "pin_bottom")


def _log(msg):
    print("[config] " + msg, file=sys.stderr, flush=True)


def _is_int(v):
    return isinstance(v, int) and not isinstance(v, bool)


def _is_num(v):
    return isinstance(v, (int, float)) and not isinstance(v, bool)


def _regex_ok(v):
    try:
        re.compile(v)
        return isinstance(v, str)
    except (re.error, TypeError):
        return False


def _url_ok(v):
    return isinstance(v, str) and (v == "" or v.startswith(("http://", "https://")))


SECTION_CHECKS = {
    "server": {
        "host": (lambda v: isinstance(v, str) and v != "", "a non-empty string"),
        "port": (lambda v: _is_int(v) and 1 <= v <= 65535, "an integer 1-65535"),
        "route": (lambda v: isinstance(v, str) and v.startswith("/"), "a string starting with /"),
        "subid_regex": (_regex_ok, "a valid regular expression"),
        "workers": (lambda v: _is_int(v) and v >= 1, "an integer >= 1"),
        "threads": (lambda v: _is_int(v) and v >= 1, "an integer >= 1"),
    },
    "panel": {
        "url": (_url_ok, "an http(s) URL or an empty string"),
        "page_url": (_url_ok, "an http(s) URL or an empty string"),
        "timeout": (lambda v: _is_num(v) and v > 0, "a number > 0"),
        "verify_tls": (lambda v: isinstance(v, bool), "true or false"),
        "headers": (lambda v: isinstance(v, dict) and all(isinstance(a, str) and isinstance(b, str) for a, b in v.items()),
                    "an object of strings"),
        "pass_headers": (lambda v: isinstance(v, list) and all(isinstance(a, str) for a in v), "a list of strings"),
    },
    "admin": {
        "path": (lambda v: isinstance(v, str) and v.startswith("/") and len(v) > 1, "a string starting with /"),
        "password": (lambda v: isinstance(v, str), "a string"),
        "password_hash": (lambda v: isinstance(v, str), "a string"),
        "session_hours": (lambda v: _is_num(v) and v > 0, "a number > 0"),
        "max_failed_logins": (lambda v: _is_int(v) and v >= 1, "an integer >= 1"),
        "lockout_seconds": (lambda v: _is_num(v) and v > 0, "a number > 0"),
    },
    "accounts": {
        "file": (lambda v: isinstance(v, str), "a file path (string)"),
        "default": (lambda v: isinstance(v, dict), "an object"),
    },
}

ITEM_KEYS = {
    "rules": {"id", "enabled", "when", "do"},
    "groups": {"id", "enabled", "when", "split_by", "name", "type", "params", "probe", "probe_kind",
               "member_cost", "min_members", "remove_members_from_output", "position"},
    "chains": {"id", "enabled", "exit_when", "split_by", "name", "entry", "through_exit", "remove_exit_from_output",
               "position"},
    "patches": {"id", "enabled", "stage", "target", "when", "merge", "routing_prepend", "routing_append"},
}


def _section(name, raw, conf, problems):
    if raw is None:
        return
    if not isinstance(raw, dict):
        problems.append("%s: must be an object; ignored" % name)
        return
    for k, v in raw.items():
        if k.startswith("_"):
            continue
        check = SECTION_CHECKS[name].get(k)
        if check is None:
            problems.append("%s.%s: unknown key; ignored" % (name, k))
        elif not check[0](v):
            problems.append("%s.%s: must be %s; ignored" % (name, k, check[1]))
        else:
            conf[name][k] = copy.deepcopy(v)


def _check_item(kind, item, where):
    p = []
    for k in item:
        if k not in ITEM_KEYS[kind] and not k.startswith("_"):
            p.append("%s: unknown key %r" % (where, k))
    if "enabled" in item and not isinstance(item["enabled"], bool):
        p.append("%s.enabled: must be true or false" % where)
    p += check_when(item.get("when"), where + ".when")
    if kind == "chains":
        p += check_when(item.get("exit_when"), where + ".exit_when")
    if kind == "rules":
        if item.get("do") not in RULE_ACTIONS:
            p.append("%s.do: must be one of %s" % (where, ", ".join(RULE_ACTIONS)))
    elif kind == "groups":
        if not isinstance(item.get("type"), str) or not item.get("type"):
            p.append("%s.type: required (e.g. leastLoad, leastPing, random, roundRobin)" % where)
        sb = item.get("split_by")
        if sb is not None:
            if not (isinstance(sb, dict) and isinstance(sb.get("field"), str) and _regex_ok(sb.get("regex"))):
                p.append('%s.split_by: must be {"field": "...", "regex": "..."} with a valid regex' % where)
        for k in ("params", "probe"):
            if k in item and not isinstance(item[k], dict):
                p.append("%s.%s: must be an object" % (where, k))
        if "name" in item and not isinstance(item["name"], str):
            p.append("%s.name: must be a string" % where)
        if item.get("probe_kind") not in (None, "burst", "observatory"):
            p.append('%s.probe_kind: must be "burst" or "observatory"' % where)
        if "min_members" in item and not (_is_int(item["min_members"]) and item["min_members"] >= 1):
            p.append("%s.min_members: must be an integer >= 1" % where)
        if "remove_members_from_output" in item and not isinstance(item["remove_members_from_output"], bool):
            p.append("%s.remove_members_from_output: must be true or false" % where)
        if item.get("position") not in (None, "top", "bottom"):
            p.append('%s.position: must be "top" or "bottom"' % where)
        mc = item.get("member_cost")
        if mc is not None:
            if not isinstance(mc, list):
                p.append("%s.member_cost: must be a list" % where)
            else:
                for i, e in enumerate(mc):
                    if not (isinstance(e, dict) and _is_num(e.get("value"))):
                        p.append('%s.member_cost[%d]: needs {"when": {...}, "value": number}' % (where, i))
                    else:
                        p += check_when(e.get("when"), "%s.member_cost[%d].when" % (where, i))
    elif kind == "chains":
        if not isinstance(item.get("entry"), dict) or not item.get("entry"):
            p.append("%s.entry: required; the outbound (JSON object) to dial through the exit" % where)
        sb = item.get("split_by")
        if sb is not None and not (isinstance(sb, dict) and isinstance(sb.get("field"), str) and _regex_ok(sb.get("regex"))):
            p.append('%s.split_by: must be {"field": "...", "regex": "..."} with a valid regex' % where)
        if "name" in item and not isinstance(item["name"], str):
            p.append("%s.name: must be a string" % where)
        for k in ("through_exit", "remove_exit_from_output"):
            if k in item and not isinstance(item[k], bool):
                p.append("%s.%s: must be true or false" % (where, k))
        if item.get("position") not in (None, "top", "bottom"):
            p.append('%s.position: must be "top" or "bottom"' % where)
    elif kind == "patches":
        if item.get("stage", "source") not in ("source", "output"):
            p.append('%s.stage: must be "source" or "output"' % where)
        if item.get("target", "config") not in ("config", "outbound"):
            p.append('%s.target: must be "config" or "outbound"' % where)
        if "merge" in item and not isinstance(item["merge"], dict):
            p.append("%s.merge: must be an object" % where)
        for k in ("routing_prepend", "routing_append"):
            if k in item and not (isinstance(item[k], list) and all(isinstance(r, dict) for r in item[k])):
                p.append("%s.%s: must be a list of objects" % (where, k))
    return p


def _items(kind, raw, conf, problems):
    if raw is None:
        return
    if not isinstance(raw, list):
        problems.append("%s: must be a list; ignored" % kind)
        return
    seen = set()
    for n, item in enumerate(raw, 1):
        if not isinstance(item, dict):
            problems.append("%s[%d]: must be an object; skipped" % (kind, n))
            continue
        item = copy.deepcopy(item)
        item.setdefault("id", "%s%d" % (kind[:-1], n))
        where = "%s[%s]" % (kind, item["id"])
        if not isinstance(item["id"], str) or not item["id"]:
            problems.append("%s[%d].id: must be a non-empty string; skipped" % (kind, n))
            continue
        if item["id"] in seen:
            problems.append("%s: duplicate id; skipped" % where)
            continue
        found = _check_item(kind, item, where)
        fatal = [x for x in found if "unknown key" not in x]
        problems += found
        if fatal:
            problems.append("%s: skipped" % where)
            continue
        seen.add(item["id"])
        conf[kind].append(item)


def normalize(raw):
    """raw JSON value -> (clean configuration, list of problem messages)."""
    conf, problems = copy.deepcopy(DEFAULTS), []
    if not isinstance(raw, dict):
        return conf, ["the top level must be a JSON object; using defaults"]
    for k in raw:
        if k not in DEFAULTS and not k.startswith("_"):
            problems.append("%s: unknown key; ignored" % k)
    _section("server", raw.get("server"), conf, problems)
    _section("panel", raw.get("panel"), conf, problems)
    _section("admin", raw.get("admin"), conf, problems)
    _section("accounts", raw.get("accounts"), conf, problems)
    if conf["admin"]["password"] and not conf["admin"]["password_hash"]:
        problems.append("admin.password: stored in plain text; consider admin.password_hash "
                        "(python -m magdsubforge hash-password)")
    for kind in ("rules", "groups", "chains", "patches"):
        _items(kind, raw.get(kind), conf, problems)
    for g in conf["groups"]:
        if g["type"] in ("leastLoad", "leastPing") and not g.get("probe"):
            problems.append("groups[%s]: type %s normally needs a `probe` (observatory); clients may reject it without"
                            % (g["id"], g["type"]))
    return conf, problems


def is_warning(problem):
    """Problems that do not stop anything from working (everything else means something was ignored/skipped)."""
    return "unknown key" in problem or "normally needs" in problem or "plain text" in problem


def split_problems(problems):
    return [p for p in problems if not is_warning(p)], [p for p in problems if is_warning(p)]


class ConfigStore:
    """Holds the current configuration and re-reads the file when it changes (checked on every get())."""

    def __init__(self, path=None):
        self.path = path or os.environ.get(CONFIG_ENV) or "config.json"
        self._lock = threading.Lock()
        self._sig = None
        self._conf, self.problems = normalize({})
        self.load(force=True)

    def get(self):
        self.load()
        return self._conf

    def load(self, force=False):
        with self._lock:
            try:
                st = os.stat(self.path)
            except OSError:
                if force:
                    _log("%s not found; using defaults (subscriptions pass through unchanged)" % self.path)
                return
            sig = (st.st_mtime_ns, st.st_size)
            if sig == self._sig and not force:
                return
            self._sig = sig
            try:
                with open(self.path, encoding="utf-8") as f:
                    raw = json.load(f)
            except (OSError, ValueError) as e:
                _log("cannot read %s (%s); keeping the previous settings" % (self.path, e))
                return
            conf, problems = normalize(raw)
            for p in problems:
                _log(p)
            self._conf, self.problems = conf, problems
            _log("loaded %s (%d rule(s), %d group(s), %d chain(s), %d patch(es))" % (
                self.path, len(conf["rules"]), len(conf["groups"]), len(conf["chains"]), len(conf["patches"])))
