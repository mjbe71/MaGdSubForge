"""The web admin panel (single admin). It stays switched off until `admin.password` / `admin.password_hash`
is set in config.json. The panel edits config.json itself; the service picks the changes up on its own.

Security model: one password; signed, HttpOnly, SameSite=Strict session cookie whose key is derived from the
password (changing the password logs everyone out, and all gunicorn workers agree); a CSRF token on every
state-changing call; failed-login lockout; strict CSP; nothing from the `admin` section is ever sent to the browser.
"""
import copy
import hashlib
import hmac
import html
import json
import os
import re
import secrets
import tempfile
import threading
import time

from flask import Response, jsonify, request
from itsdangerous import BadSignature, URLSafeTimedSerializer
from werkzeug.security import check_password_hash

from .config import normalize, split_problems
from .engine import process
from .panel import PanelError, fetch_panel

STATIC = os.path.join(os.path.dirname(os.path.abspath(__file__)), "admin_static")
COOKIE = "magdsubforge_admin"
CSP = ("default-src 'none'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self' data:; "
       "base-uri 'none'; form-action 'self'; frame-ancestors 'none'")


def enabled(conf):
    a = conf["admin"]
    return bool(a["password"] or a["password_hash"])


def _serializer(conf):
    a = conf["admin"]
    key = hashlib.sha256(b"magdsubforge-admin-v1" + (a["password_hash"] or a["password"]).encode()).digest()
    return URLSafeTimedSerializer(key, salt="session")


def _password_ok(conf, given):
    a = conf["admin"]
    if a["password_hash"]:
        try:
            return check_password_hash(a["password_hash"], given)
        except ValueError:
            return False
    return hmac.compare_digest(given.encode(), a["password"].encode())


class Lockout:
    """Failed-login limiter, per client address (per worker process)."""

    def __init__(self):
        self.lock = threading.Lock()
        self.fails = {}

    def blocked(self, who, conf):
        with self.lock:
            n, until = self.fails.get(who, (0, 0))
            return until > time.time()

    def failed(self, who, conf):
        a = conf["admin"]
        with self.lock:
            n, until = self.fails.get(who, (0, 0))
            n = 1 if until and until <= time.time() else n + 1
            until = time.time() + a["lockout_seconds"] if n >= a["max_failed_logins"] else 0
            self.fails[who] = (n, until)
            if len(self.fails) > 1000:
                self.fails = {k: v for k, v in self.fails.items() if v[1] > time.time()}

    def ok(self, who):
        with self.lock:
            self.fails.pop(who, None)


def _read_raw(path):
    try:
        with open(path, encoding="utf-8") as f:
            raw = json.load(f)
        return raw if isinstance(raw, dict) else {}
    except (OSError, ValueError):
        return {}


def _write_atomic(path, data):
    d = os.path.dirname(os.path.abspath(path))
    fd, tmp = tempfile.mkstemp(prefix=".config-", dir=d)
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
            f.write("\n")
        if os.path.exists(path):
            st = os.stat(path)
            os.chmod(tmp, st.st_mode & 0o777)
            try:                                   # run as root (installer), the service user must still own the file
                os.chown(tmp, st.st_uid, st.st_gid)
            except (PermissionError, AttributeError):
                pass
        else:
            os.chmod(tmp, 0o600)
        os.replace(tmp, path)
    except BaseException:
        try:
            os.unlink(tmp)
        except OSError:
            pass
        raise


def _accounts_for(app, clean):
    """Account values for the preview: the saved ones, with the candidate's inline `accounts.default` on top."""
    data = app.accounts.get()
    default = dict(data["default"])
    default.update(clean["accounts"]["default"])
    return {"default": default, "users": data["users"]}


def register(app, store):
    base = store.get()["admin"]["path"].rstrip("/") or "/admin"
    lockout = Lockout()

    def secure(resp):
        resp.headers["Cache-Control"] = "no-store"
        resp.headers["Content-Security-Policy"] = CSP
        resp.headers["X-Content-Type-Options"] = "nosniff"
        resp.headers["X-Frame-Options"] = "DENY"
        resp.headers["Referrer-Policy"] = "no-referrer"
        return resp

    def reply(data, status=200):
        return secure(jsonify(data)), status

    def session(conf):
        raw = request.cookies.get(COOKIE)
        if not raw:
            return None
        try:
            return _serializer(conf).loads(raw, max_age=conf["admin"]["session_hours"] * 3600)
        except BadSignature:
            return None

    def guarded(fn):
        def wrapper(*a, **kw):
            conf = store.get()
            if not enabled(conf):
                return reply({"error": "admin panel is disabled"}, 404)
            sess = session(conf)
            if sess is None:
                return reply({"error": "login required"}, 401)
            if request.method != "GET" and not hmac.compare_digest(
                    request.headers.get("X-CSRF-Token", ""), str(sess.get("csrf", ""))):
                return reply({"error": "bad CSRF token"}, 403)
            return fn(conf, sess)
        wrapper.__name__ = fn.__name__
        return wrapper

    def body():
        data = request.get_json(silent=True)
        return data if isinstance(data, dict) else {}

    def candidate(data):
        cand = data.get("config")
        if not isinstance(cand, dict):
            return None
        cand = copy.deepcopy(cand)
        cand.pop("admin", None)
        return cand

    # ---- pages ----
    def page():
        if not enabled(store.get()):
            return secure(Response("Admin panel is disabled: set admin.password_hash in config.json.\n",
                                   status=404, mimetype="text/plain"))
        with open(os.path.join(STATIC, "admin.html"), encoding="utf-8") as f:
            text = f.read().replace("__BASE__", html.escape(base, quote=True))
        return secure(Response(text, mimetype="text/html"))

    def asset(name, mime):
        def view():
            if not enabled(store.get()):
                return secure(Response("not found\n", status=404, mimetype="text/plain"))
            with open(os.path.join(STATIC, name), "rb") as f:
                return secure(Response(f.read(), mimetype=mime))
        view.__name__ = "admin_asset_" + name.replace(".", "_")
        return view

    app.add_url_rule(base, "admin_page", page, strict_slashes=False)
    app.add_url_rule(base + "/admin.js", "admin_js", asset("admin.js", "application/javascript"))
    app.add_url_rule(base + "/admin.css", "admin_css", asset("admin.css", "text/css"))

    # ---- API ----
    def login():
        conf = store.get()
        if not enabled(conf):
            return reply({"error": "admin panel is disabled"}, 404)
        who = request.remote_addr or "?"
        if lockout.blocked(who, conf):
            return reply({"error": "too many failed attempts; try again later"}, 429)
        given = body().get("password")
        if not isinstance(given, str) or not _password_ok(conf, given):
            lockout.failed(who, conf)
            return reply({"error": "wrong password"}, 401)
        lockout.ok(who)
        csrf = secrets.token_urlsafe(24)
        resp, status = reply({"csrf": csrf})
        resp.set_cookie(COOKIE, _serializer(conf).dumps({"csrf": csrf}), max_age=int(conf["admin"]["session_hours"] * 3600),
                        httponly=True, samesite="Strict", path=base,
                        secure=request.is_secure or request.headers.get("X-Forwarded-Proto") == "https")
        return resp, status

    def logout():
        resp, status = reply({"ok": True})
        resp.delete_cookie(COOKIE, path=base)
        return resp, status

    @guarded
    def me(conf, sess):
        return reply({"csrf": sess.get("csrf")})

    @guarded
    def state(conf, sess):
        raw = _read_raw(store.path)
        raw.pop("admin", None)
        _, problems = normalize(raw)
        errors, warnings = split_problems(problems)
        return reply({"config": raw, "errors": errors, "warnings": warnings, "file": os.path.basename(store.path),
                      "route": conf["server"]["route"]})

    @guarded
    def preview(conf, sess):
        data = body()
        cand = candidate(data)
        if cand is None:
            return reply({"error": "config must be an object"}, 400)
        clean, problems = normalize(cand)
        errors, warnings = split_problems(problems)
        sample = data.get("configs")
        sample = [c for c in sample if isinstance(c, dict)] if isinstance(sample, list) else []
        subid = data.get("subid") if isinstance(data.get("subid"), str) else None
        out, report = process(sample, clean, subid=subid, accounts=_accounts_for(app, clean))
        return reply({"errors": errors, "warnings": warnings, "report": report, "output": out})

    @guarded
    def sample(conf, sess):
        data = body()
        subid = data.get("subid")
        if not isinstance(subid, str) or not subid:
            return reply({"error": "enter a subscription id"}, 400)
        panel = conf["panel"]
        cand = candidate(data)
        if cand is not None:
            panel = normalize(cand)[0]["panel"]
        import re
        if not re.search(conf["server"]["subid_regex"], subid):
            return reply({"error": "this id does not match server.subid_regex"}, 400)
        try:
            _, configs, _ = fetch_panel(panel, subid)
        except PanelError as e:
            return reply({"error": e.message}, 502 if e.status >= 500 else e.status)
        return reply({"configs": configs})

    @guarded
    def save(conf, sess):
        cand = candidate(body())
        if cand is None:
            return reply({"error": "config must be an object"}, 400)
        _, problems = normalize(cand)
        errors, warnings = split_problems(problems)
        if errors:
            return reply({"errors": errors, "warnings": warnings}, 400)
        merged = dict(cand)
        existing_admin = _read_raw(store.path).get("admin")
        if existing_admin is not None:
            merged["admin"] = existing_admin           # the panel never edits (or reveals) its own login settings
        try:
            _write_atomic(store.path, merged)
        except OSError as e:
            return reply({"error": "cannot write the config file: %s" % e.strerror}, 500)
        store.load(force=True)
        return reply({"ok": True, "warnings": warnings})

    @guarded
    def register_account(conf, sess):
        from .warp import ApiError
        data = body()
        subid = data.get("subid") if isinstance(data.get("subid"), str) and data.get("subid") else None
        if subid and not re.search(conf["server"]["subid_regex"], subid):
            return reply({"error": "this id does not match server.subid_regex"}, 400)
        try:
            new_id = app.accounts.register(subid, force=bool(data.get("force")))
        except (ApiError, ValueError, OSError) as e:
            return reply({"error": "could not create the account: %s" % e}, 502)
        return reply({"ok": True, "created": new_id is not None, "device": new_id or ""})

    for name, fn, methods in (("login", login, ["POST"]), ("logout", logout, ["POST"]), ("me", me, ["GET"]),
                              ("state", state, ["GET"]), ("preview", preview, ["POST"]),
                              ("sample", sample, ["POST"]), ("save", save, ["POST"]),
                              ("register-account", register_account, ["POST"])):
        app.add_url_rule("%s/api/%s" % (base, name), "admin_api_" + name, fn, methods=methods)
