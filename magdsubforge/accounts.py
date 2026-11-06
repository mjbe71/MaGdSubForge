"""Values for the {account.*} placeholders of `chains` (for example the keys of a WARP account).

Source: the file named by `accounts.file` and/or the inline `accounts.default`; the file wins on conflicts.
The file is JSON, in one of two shapes:

    {"privateKey": "...", "address": ["172.16.0.2"]}                       one account for everybody
    {"default": {...}, "users": {"<subscription id>": {...}, ...}}         plus a personal account per user

The file is re-read when it changes. Account values are secrets: keep the file out of git (accounts*.json is in .gitignore). The web admin panel
never lists the file's contents, but a preview of a chain shows the filled-in outbound.
"""
import json
import os
import sys
import threading


def _log(msg):
    print("[accounts] " + msg, file=sys.stderr, flush=True)


def parse(raw):
    """-> {"default": dict, "users": {id: dict}} from either file shape."""
    if not isinstance(raw, dict):
        return {"default": {}, "users": {}}
    if "default" in raw or "users" in raw:
        default = raw.get("default") if isinstance(raw.get("default"), dict) else {}
        users = raw.get("users") if isinstance(raw.get("users"), dict) else {}
        return {"default": default, "users": {k: v for k, v in users.items() if isinstance(v, dict)}}
    return {"default": {k: v for k, v in raw.items() if not k.startswith("_")}, "users": {}}


class AccountStore:
    def __init__(self, config_store):
        self.config_store = config_store
        self._lock = threading.Lock()
        self._sig = None
        self._file_data = {"default": {}, "users": {}}

    def _file_path(self, file):
        if not file:
            return ""
        base = os.path.dirname(os.path.abspath(self.config_store.path))
        return file if os.path.isabs(file) else os.path.join(base, file)      # relative to config.json

    def get(self):
        conf = self.config_store.get()["accounts"]
        path = self._file_path(conf["file"])
        with self._lock:
            if path:
                try:
                    st = os.stat(path)
                    sig = (path, st.st_mtime_ns, st.st_size)
                    if sig != self._sig:
                        self._sig = sig
                        try:
                            with open(path, encoding="utf-8") as f:
                                self._file_data = parse(json.load(f))
                            _log("loaded %s" % os.path.basename(path))
                        except (OSError, ValueError) as e:
                            _log("cannot read %s (%s); keeping the previous values" % (os.path.basename(path), e))
                except OSError:
                    if self._sig != (path, None, None):
                        _log("%s not found" % os.path.basename(path))
                    self._sig, self._file_data = (path, None, None), {"default": {}, "users": {}}
            else:
                self._sig, self._file_data = None, {"default": {}, "users": {}}
            data = self._file_data
        default = dict(conf["default"])
        default.update(data["default"])
        return {"default": default, "users": data["users"]}
