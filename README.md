# MaGdSubForge

[فارسی](README.fa.md) · English

A small Flask service that sits between your **3x-ui** panel and your users' VPN apps. It fetches the panel's JSON
subscription and rewrites it **by rules you define**: drop configs, reorder them, merge many configs into
load-balanced ones (Xray `leastLoad`, `leastPing`, `random`, ...), and patch any JSON you like.

It knows no naming scheme and no provider. You decide what each config is, what is removed and what is combined.
With no rules it returns the panel's subscription unchanged.

```
client app ──► MaGdSubForge ──► your 3x-ui panel (JSON subscription)
                    └─ applies your rules, returns the result
```

> Early release (v0.1). Covered by automated tests, but not yet used in production by many people. Not affiliated with 3x-ui.

## Quick start

You need Python 3 or Docker (gunicorn, used for production, runs on Linux and macOS), and a 3x-ui panel with the **JSON subscription** enabled.

```bash
git clone https://github.com/mjbe71/MaGdSubForge && cd MaGdSubForge
python3 -m venv venv && . venv/bin/activate
pip install -r requirements.txt
cp config.example.json config.json       # then put your panel's JSON-subscription URL in it
python app.py                            # development server (see below for production)
```

Open `http://127.0.0.1:8080/sub/<a user's subscription id>`: you get the panel's subscription (unchanged, since there
are no rules yet).

**Your panel's URL.** Find the JSON-subscription address in your panel's settings (3x-ui usually offers a path
like `/json/`; check yours). Put it in `config.json` as `panel.url`; the user's id is appended to it.

### Try the rules without any network

```bash
python -m magdsubforge preview examples/sample-panel.json examples/balancers.json
```

prints what each config in a saved panel response becomes under `examples/balancers.json`.
`python -m magdsubforge check config.json` validates a file.

### Production

```bash
gunicorn app:app        # address, port and workers are read from config.json ("server")
```

or Docker: `mkdir -p data && cp config.json data/ && docker compose up -d --build` (the right-hand port in
`docker-compose.yml` must match `server.port`). The Docker files are not yet tested by the author; please report problems.

Put a reverse proxy with HTTPS in front and **turn its access log off**: the URL contains each user's secret id.

```nginx
server {
    listen 443 ssl;
    server_name sub.example.com;
    # ssl_certificate ...;
    access_log off;
    location / { proxy_pass http://127.0.0.1:8080; proxy_set_header Host $host; }
}
```

## Configuring

Everything is in `config.json`, and changes apply without a restart. See **[docs/config-reference.md](docs/config-reference.md)**
for all options and `examples/` for ready examples:

| You want to | Use |
|---|---|
| remove or reorder configs | `rules` |
| merge configs into one balancer (per country, per name prefix, ...) | `groups` |
| change anything else (DNS, routing, mux, fragment, ...) | `patches` |
| change address, port, URL path, timeouts | `server`, `panel` |

## Security notes

- The subscription id is checked (`server.subid_regex`) before it is sent to the panel.
- There is no login and no rate limiting. Keep the port on localhost and use a reverse proxy.
- Never commit `config.json` (the `.gitignore` excludes it).
- The service never logs subscription ids or panel URLs.

## Not included (yet)

A web admin panel, and WARP integration. Planned.

## Similar projects (not affiliated)

Remnawave, Raven-subscribe, subscribe-middleware-go, Sub-Store.

## License

MIT, see [LICENSE](LICENSE).
