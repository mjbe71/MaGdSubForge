"""Best-effort detection of a 3x-ui panel installed on the same machine (used by install.sh).

It only READS 3x-ui's settings database (opened read-only) to suggest values: the certificate paths the panel
uses, and its JSON-subscription address. The setting names below come from memory of 3x-ui and are NOT verified
against every version; anything missing is simply reported as absent and the installer asks the user instead.
"""
import glob
import json
import os
import sqlite3

DB_CANDIDATES = ("/etc/x-ui/x-ui.db",)
ACME_GLOB = "/root/cert/*/fullchain.pem"       # where the `x-ui` menu's certificate option usually puts them
WANTED = ("webCertFile", "webKeyFile", "webPort", "webBasePath", "webDomain", "subEnable", "subJsonEnable",
          "subPort", "subPath", "subJsonPath", "subDomain", "subCertFile", "subKeyFile")


def find_db(explicit=None):
    cands = [explicit] if explicit else []
    folder = os.environ.get("XUI_DB_FOLDER")
    if folder:
        cands.append(os.path.join(folder, "x-ui.db"))
    cands.extend(DB_CANDIDATES)
    return next((c for c in cands if c and os.path.isfile(c)), None)


def read_settings(db):
    """{lower-case setting name: value} from every table that has `key` and `value` columns."""
    out = {}
    con = sqlite3.connect("file:%s?mode=ro" % db, uri=True)
    try:
        tables = [r[0] for r in con.execute("select name from sqlite_master where type='table'")]
        for t in tables:
            cols = [r[1].lower() for r in con.execute('pragma table_info("%s")' % t.replace('"', ""))]
            if "key" in cols and "value" in cols:
                for k, v in con.execute('select "key", "value" from "%s"' % t.replace('"', "")):
                    if isinstance(k, str):
                        out[k.lower()] = v
    finally:
        con.close()
    return out


def _s(settings, name):
    v = settings.get(name.lower())
    v = "" if v is None else str(v).strip()
    return v or None


def _slash(path):
    path = path or ""
    return "/" + path.strip("/") + "/" if path.strip("/") else "/"


def detect(db_path=None):
    """-> dict describing what was found. Never raises for a missing or unreadable database."""
    res = {"found": False, "db": None, "web": {}, "sub": {}, "certs": [], "suggest": None}
    db = find_db(db_path)
    settings = {}
    if db:
        try:
            settings = read_settings(db)
            res["found"], res["db"] = True, db
        except (sqlite3.Error, OSError):
            pass
    g = lambda n: _s(settings, n)
    res["web"] = {"cert": g("webCertFile"), "key": g("webKeyFile"), "port": g("webPort"),
                  "base_path": g("webBasePath"), "domain": g("webDomain")}
    res["sub"] = {"cert": g("subCertFile"), "key": g("subKeyFile"), "port": g("subPort"), "path": g("subPath"),
                  "json_path": g("subJsonPath"), "domain": g("subDomain"),
                  "enabled": g("subEnable"), "json_enabled": g("subJsonEnable")}

    pairs = [("3x-ui panel certificate", res["web"]["cert"], res["web"]["key"]),
             ("3x-ui subscription certificate", res["sub"]["cert"], res["sub"]["key"])]
    for cert in sorted(glob.glob(ACME_GLOB)):
        pairs.append(("certificate for %s (from the x-ui menu)" % os.path.basename(os.path.dirname(cert)),
                      cert, os.path.join(os.path.dirname(cert), "privkey.pem")))
    seen = set()
    for label, cert, key in pairs:
        if cert and key and (cert, key) not in seen and os.path.isfile(cert) and os.path.isfile(key):
            seen.add((cert, key))
            res["certs"].append({"label": label, "cert": cert, "key": key})

    sub = res["sub"]
    if sub["port"] and sub["json_path"]:
        tls = bool(sub["cert"] and sub["key"])
        host = sub["domain"] or res["web"]["domain"]
        if tls and host:
            res["suggest"] = {"url": "https://%s:%s%s" % (host, sub["port"], _slash(sub["json_path"])), "verify_tls": True}
        elif tls:
            res["suggest"] = {"url": "https://127.0.0.1:%s%s" % (sub["port"], _slash(sub["json_path"])), "verify_tls": False}
        else:
            res["suggest"] = {"url": "http://127.0.0.1:%s%s" % (sub["port"], _slash(sub["json_path"])), "verify_tls": True}
    return res


def main(argv):
    """python -m magdsubforge detect-xui [--db PATH] [--certs | --suggest]"""
    db = argv[argv.index("--db") + 1] if "--db" in argv else None
    res = detect(db)
    if "--certs" in argv:          # tab-separated: label, certificate path, key path
        for c in res["certs"]:
            print("%s\t%s\t%s" % (c["label"], c["cert"], c["key"]))
    elif "--suggest" in argv:      # tab-separated: url, verify_tls
        if res["suggest"]:
            print("%s\t%s" % (res["suggest"]["url"], "true" if res["suggest"]["verify_tls"] else "false"))
    else:
        print(json.dumps(res, indent=2))
    return 0
