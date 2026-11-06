"""WSGI entry point:  gunicorn app:app   (settings come from config.json, see README)."""
import logging
import os

from magdsubforge.server import create_app

app = create_app()

if __name__ == "__main__":      # development server
    logging.getLogger("werkzeug").setLevel(logging.ERROR)   # URLs contain secret ids: no request log
    server = app.store.get()["server"]
    app.run(host=os.environ.get("MAGDSUBFORGE_HOST") or server["host"], port=server["port"], threaded=True)
