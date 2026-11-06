"""The HTTP service: fetch the panel's JSON subscription, apply the rules, return the result."""
import json
import re
import sys

import requests
from flask import Flask, Response, redirect, request

from .config import ConfigStore
from .engine import process


def create_app(store=None):
    store = store or ConfigStore()
    app = Flask(__name__)
    app.config["JSON_AS_ASCII"] = False
    route = store.get()["server"]["route"]          # the route is fixed at startup (restart to change it)

    def text(msg, code):
        return Response(msg + "\n", status=code, mimetype="text/plain")

    @app.get("/healthz")
    def healthz():
        return text("ok", 200)

    def sub(subid):
        conf = store.get()
        if not re.search(conf["server"]["subid_regex"], subid):
            return text("not found", 404)
        panel = conf["panel"]
        if not panel["url"]:
            return text("panel.url is not set in config.json", 503)
        if panel["page_url"] and "text/html" in request.headers.get("Accept", ""):
            return redirect(panel["page_url"].rstrip("/") + "/" + subid, code=302)
        base = panel["url"] if panel["url"].endswith("/") else panel["url"] + "/"
        try:
            r = requests.get(base + subid, headers=panel["headers"], timeout=panel["timeout"],
                             verify=panel["verify_tls"])
        except requests.RequestException as e:   # never print the URL: it contains the secret id
            print("[server] panel unreachable: %s" % type(e).__name__, file=sys.stderr, flush=True)
            return text("panel unreachable", 502)
        if r.status_code == 404:
            return text("not found", 404)
        if r.status_code != 200:
            return text("panel returned %d" % r.status_code, 502)
        try:
            data = r.json()
        except ValueError:
            return text("panel did not return JSON", 502)
        configs = data if isinstance(data, list) else [data] if isinstance(data, dict) else None
        if configs is None:
            return text("unexpected panel response", 502)
        try:
            out, _ = process(configs, conf)
        except Exception as e:   # better to hand out the panel's own configs than nothing
            print("[server] processing failed (%s: %s); passing the panel's response through"
                  % (type(e).__name__, e), file=sys.stderr, flush=True)
            out = configs
        body = out[0] if isinstance(data, dict) and len(out) == 1 else out
        resp = Response(json.dumps(body, ensure_ascii=False), mimetype="application/json")
        for name in panel["pass_headers"]:
            if name in r.headers:
                resp.headers[name] = r.headers[name]
        return resp

    app.add_url_rule(route.rstrip("/") + "/<subid>", "sub", sub)
    app.store = store
    return app
