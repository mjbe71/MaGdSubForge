"""Command line:

    python -m magdsubforge serve                       development server (use gunicorn in production)
    python -m magdsubforge check [config.json]         validate a configuration
    python -m magdsubforge preview panel.json [config.json] [--full]
                                                      run the rules on a saved panel response, no network
"""
import argparse
import json
import logging
import os
import sys

from .config import ConfigStore
from .engine import process
from .server import create_app


def main(argv=None):
    ap = argparse.ArgumentParser(prog="magdsubforge")
    sub = ap.add_subparsers(dest="cmd", required=True)
    s = sub.add_parser("serve")
    s.add_argument("config", nargs="?")
    c = sub.add_parser("check")
    c.add_argument("config", nargs="?")
    p = sub.add_parser("preview")
    p.add_argument("panel_json")
    p.add_argument("config", nargs="?")
    p.add_argument("--full", action="store_true", help="print the resulting configs too")
    a = ap.parse_args(argv)

    store = ConfigStore(a.config)
    if a.cmd == "check":
        print("OK" if not store.problems else "%d problem(s) listed above" % len(store.problems))
        return 1 if store.problems else 0
    if a.cmd == "serve":
        logging.getLogger("werkzeug").setLevel(logging.ERROR)   # the URL contains the secret id: no request log
        srv = store.get()["server"]
        create_app(store).run(host=os.environ.get("MAGDSUBFORGE_HOST") or srv["host"], port=srv["port"], threaded=True)
        return 0

    with open(a.panel_json, encoding="utf-8") as f:
        data = json.load(f)
    out, report = process(data if isinstance(data, list) else [data], store.get())
    for c in report["configs"]:
        where = ("-> " + ", ".join(c["groups"])) if c["groups"] else ""
        print("%2d  %-9s %-28s %s %s" % (c["index"], c["action"] + ("*" if c["rule"] else ""),
                                         c["remark"], c["fields"].get("network", ""), where))
    print("\n(* = decided by rule; drop = removed; groups listed after ->)\n")
    for o in report["outputs"]:
        print("group %-14s -> %s  (%d members)" % (o["group"], o["remark"], o["members"]))
    print("\noutput order:")
    for i, cfg in enumerate(out):
        print("  %2d  %s" % (i, cfg.get("remarks")))
    for e in report["errors"]:
        print("ERROR:", e, file=sys.stderr)
    if a.full:
        print(json.dumps(out, indent=2, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    sys.exit(main())
