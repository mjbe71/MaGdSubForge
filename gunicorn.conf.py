# gunicorn reads this file automatically from the working directory: address and size come from config.json.
import os

from magdsubforge.config import ConfigStore

_server = ConfigStore().get()["server"]
# MAGDSUBFORGE_HOST (if set) overrides server.host; the Docker image sets it to 0.0.0.0
bind = "%s:%d" % (os.environ.get("MAGDSUBFORGE_HOST") or _server["host"], _server["port"])
workers = _server["workers"]
threads = _server["threads"]
accesslog = None     # no access log on purpose: URLs contain each user's secret subscription id
