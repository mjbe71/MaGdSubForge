"""Applies the admin's rules, groups and patches to the configs the panel returned.

Order of work:  patches(stage "source")  ->  rules  ->  groups  ->  patches(stage "output")

Nothing here is specific to any naming scheme or provider. With an empty configuration the input comes
back unchanged.
"""
import copy
import re
import sys

from .matching import NON_PROXY, fields_of, get_value, main_index, match

SHOWN = ("protocol", "address", "port", "network", "security", "sni", "flag")


def _log(msg):
    print("[engine] " + msg, file=sys.stderr, flush=True)


def deep_merge(dst, src):
    """Merge dict `src` into `dst`. A null value deletes the key; lists and scalars are replaced."""
    for k, v in src.items():
        if v is None:
            dst.pop(k, None)
        elif isinstance(v, dict):
            if not isinstance(dst.get(k), dict):
                dst[k] = {}
            deep_merge(dst[k], v)
        else:
            dst[k] = copy.deepcopy(v)
    return dst


def slug(text):
    return re.sub(r"[^A-Za-z0-9]+", "-", str(text)).strip("-") or "g"


def render(template, **values):
    for k, v in values.items():
        template = template.replace("{" + k + "}", str(v))
    return template


def apply_patch(cfg, patch):
    merge = patch.get("merge") or {}
    if patch.get("target", "config") == "outbound":
        for ob in cfg.get("outbounds") or []:
            if isinstance(ob, dict) and ob.get("protocol") not in NON_PROXY:
                deep_merge(ob, merge)
    else:
        deep_merge(cfg, merge)
    pre, post = patch.get("routing_prepend"), patch.get("routing_append")
    if pre or post:
        routing = cfg.get("routing") if isinstance(cfg.get("routing"), dict) else {}
        rules = routing.get("rules") if isinstance(routing.get("rules"), list) else []
        routing["rules"] = copy.deepcopy(pre or []) + rules + copy.deepcopy(post or [])
        cfg["routing"] = routing


def build_group(group, key, members, work, index):
    """One output config: the members' main outbounds + a balancer over them. Everything else
    (inbounds, dns, other outbounds, routing) comes from the first member."""
    members = [m for m in members if main_index(work[m["i"]]) is not None]
    if not members:
        return None
    out = copy.deepcopy(work[members[0]["i"]])
    ti = main_index(out)
    old_tag = out["outbounds"][ti].get("tag")
    gid = slug(group["id"])
    prefix = "%s-%d-" % (gid, index)
    balancer_tag = "%s-%d-lb" % (gid, index)

    outbounds, costs = [], []
    for n, m in enumerate(members, 1):
        src = work[m["i"]]
        ob = copy.deepcopy(src["outbounds"][main_index(src)])
        ob["tag"] = "%s%d" % (prefix, n)
        outbounds.append(ob)
        for mc in group.get("member_cost") or []:
            if match(mc.get("when"), src, m["fields"]):
                costs.append({"regexp": True, "match": "^%s$" % re.escape(ob["tag"]), "value": mc["value"]})
                break
    out["outbounds"] = outbounds + [o for i, o in enumerate(out["outbounds"]) if i != ti]

    routing = out.get("routing") if isinstance(out.get("routing"), dict) else {}
    rules = routing.get("rules") if isinstance(routing.get("rules"), list) else []
    for r in rules:  # rules that pointed at the old single outbound now point at the balancer
        if isinstance(r, dict) and old_tag and r.get("outboundTag") == old_tag:
            r.pop("outboundTag")
            r["balancerTag"] = balancer_tag
    rules.append({"type": "field", "network": "tcp,udp", "balancerTag": balancer_tag})
    strategy = {"type": group["type"]}
    if group.get("params"):
        strategy["settings"] = copy.deepcopy(group["params"])
    if costs:
        strategy.setdefault("settings", {})
        strategy["settings"]["costs"] = list(strategy["settings"].get("costs") or []) + costs
    routing["rules"] = rules
    routing["balancers"] = [{"tag": balancer_tag, "selector": [prefix], "strategy": strategy}]
    out["routing"] = routing

    out.pop("observatory", None)  # these pointed at the old single outbound
    out.pop("burstObservatory", None)
    probe = group.get("probe")
    if probe:
        kind = group.get("probe_kind") or ("burst" if group["type"] == "leastLoad" else "observatory")
        if kind == "burst":
            out["burstObservatory"] = {"subjectSelector": [prefix], "pingConfig": copy.deepcopy(probe)}
        else:
            out["observatory"] = dict({"subjectSelector": [prefix]}, **copy.deepcopy(probe))

    default_name = "{split}" if group.get("split_by") else group["id"]
    out["remarks"] = render(group.get("name") or default_name, split=key, n=len(members), group=group["id"])
    return out, members


def process(configs, conf):
    """-> (output configs, report). `conf` is a normalized configuration (see config.normalize)."""
    work = [copy.deepcopy(c) for c in configs if isinstance(c, dict)]
    report = {"configs": [], "outputs": [], "errors": []}

    def guarded(label, fn):
        try:
            return fn()
        except Exception as e:  # one bad rule must not break everyone's subscription
            msg = "%s failed: %s: %s" % (label, type(e).__name__, e)
            report["errors"].append(msg)
            _log(msg)

    def run_patches(stage, targets):
        for p in conf["patches"]:
            if not p.get("enabled", True) or p.get("stage", "source") != stage:
                continue
            for c in targets:
                guarded("patch %s" % p.get("id"), lambda c=c, p=p: match(p.get("when"), c) and apply_patch(c, p))

    run_patches("source", work)

    # rules: the first matching rule decides what happens to a config
    state = []
    for i, c in enumerate(work):
        f = fields_of(c)
        st = {"i": i, "fields": f, "rule": None, "action": None, "groups": []}
        for r in conf["rules"]:
            if r.get("enabled", True) and guarded("rule %s" % r.get("id"), lambda: match(r.get("when"), c, f)):
                st["rule"], st["action"] = r.get("id"), r["do"]
                break
        state.append(st)
    alive = [st for st in state if st["action"] != "drop"]

    # groups
    removed, made = set(), []
    for g in conf["groups"]:
        if not g.get("enabled", True):
            continue

        def run_group(g=g):
            cands = [st for st in alive if match(g.get("when"), work[st["i"]], st["fields"])]
            buckets = {}
            sb = g.get("split_by")
            if sb:
                rx = re.compile(sb["regex"])
                for st in cands:
                    v = get_value(work[st["i"]], st["fields"], sb["field"])
                    mo = rx.search(str(v)) if v is not None else None
                    if mo:
                        key = (mo.group(1) if mo.re.groups else mo.group(0)) or ""
                        buckets.setdefault(key, []).append(st)
            elif cands:
                buckets[""] = cands
            for bi, (key, sts) in enumerate(buckets.items()):
                if len(sts) < g.get("min_members", 1):
                    continue
                built = build_group(g, key, sts, work, bi)
                if not built:
                    continue
                cfg, members = built
                for m in members:
                    m["groups"].append(g["id"])
                    if g.get("remove_members_from_output", True):
                        removed.add(m["i"])
                made.append((min(m["i"] for m in members), g.get("position"), cfg, g["id"], len(members)))

        guarded("group %s" % g.get("id"), run_group)

    # assemble the output list
    entries = []
    for st in alive:
        if st["i"] in removed:
            continue
        order = st["i"] + {"pin_top": -10 ** 6, "pin_bottom": 10 ** 6}.get(st["action"], 0)
        entries.append((order, 0, work[st["i"]]))
    for first, pos, cfg, gid, n in made:
        order = {"top": -10 ** 6, "bottom": 10 ** 6}.get(pos, first)
        entries.append((order, -1, cfg))
    entries.sort(key=lambda e: (e[0], e[1]))
    output = [e[2] for e in entries]

    run_patches("output", output)

    for st in state:
        action = st["action"] or "keep"
        report["configs"].append({
            "index": st["i"], "remark": st["fields"].get("remark"),
            "fields": {k: st["fields"].get(k) for k in SHOWN if st["fields"].get(k) is not None},
            "rule": st["rule"], "action": action, "groups": st["groups"],
            "in_output": action != "drop" and st["i"] not in removed,
        })
    for first, pos, cfg, gid, n in made:
        report["outputs"].append({"remark": cfg.get("remarks"), "group": gid, "members": n})
    return output, report
