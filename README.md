# MaGdSubForge

[فارسی](README.fa.md) · English

A small Flask service that sits between your **3x-ui** panel and your users' VPN apps. It fetches the panel's JSON
subscription and rewrites it **by rules you define**: drop configs, reorder them, merge many configs into
load-balanced ones (Xray `leastLoad`, `leastPing`, `random`, ...), chain your own outbound (WARP, ...) through an exit, and patch any JSON you like.

It knows no naming scheme and no provider. You decide what each config is, what is removed and what is combined.
With no rules it returns the panel's subscription unchanged.

```
client app ──► MaGdSubForge ──► your 3x-ui panel (JSON subscription)
                    └─ applies your rules, returns the result
```

> Early release (v0.1). Covered by automated tests, but not yet used in production by many people. Not affiliated with 3x-ui.

## Install on a server (one command)

On a Linux server (Debian/Ubuntu: everything else is installed for you), as root:

```bash
curl -fsSL https://raw.githubusercontent.com/mjbe71/MaGdSubForge/main/install.sh | sudo bash
```

The installer asks what it needs and does the rest. In order:

1. **Panel address.** If a 3x-ui panel runs on the same server, it suggests the address of its JSON subscription.
2. **HTTPS.** Enter the domain users will connect to. Then, in this order:
   your own certificate files, if you give their paths; otherwise a certificate that already exists on the
   server (3x-ui's); otherwise it gets a **free Let's Encrypt certificate** for the domain (the domain must already
   point to this server, and port 80 must be free for a minute). Certificates are checked (valid, not expired,
   key matches, covers the domain) and renewals are picked up automatically. Press Enter at the domain question to
   skip HTTPS (plain HTTP on localhost only).
3. **Port**, and whether to enable the **web admin panel** (and its password).

Then it creates a service that starts at boot and prints your subscription link. Afterwards:

```bash
sudo magdsubforge help        # status, logs, restart, update, tls (change HTTPS), set-admin-password, ...
sudo magdsubforge update      # get the newest version, keeping your settings
```

Run `sudo magdsubforge` with no arguments for an **interactive terminal menu** (English): service status/logs/restart/update, panel URL, port and HTTPS, the admin password, adding/editing/reordering rules, groups, chains and patches with guided questions (or as JSON in your editor), a live preview for a subscription id, and WARP accounts. Every change is validated before it is written.

Everything can also be given as options for unattended installs (`--panel-url`, `--domain`, `--cert`/`--key`,
`--letsencrypt`, `--port`, `--admin`, `--yes`, ...): run `install.sh --help`. Settings live in
`/etc/magdsubforge/config.json`, the program in `/opt/magdsubforge`. To remove it: `sudo magdsubforge uninstall`.

> The installer has been tested with simulated servers (fake 3x-ui database, test certificates, a stand-in for
> certbot), but not yet on a fresh real server, and the Let's Encrypt step has not been run against the real service.
> The 3x-ui detection reads setting names from memory of 3x-ui; if it finds nothing, it just asks you.
> Please report problems.

## Manual install

You need Python 3.9+ (or Docker) and a 3x-ui panel with the **JSON subscription** enabled.

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
gunicorn app:app        # address, port, workers and HTTPS (server.tls_cert / tls_key) come from config.json
```

or Docker: `mkdir -p data && cp config.json data/ && docker compose up -d --build` (the right-hand port in
`docker-compose.yml` must match `server.port`). The Docker files are not yet tested by the author; please report problems.

For HTTPS either set `server.tls_cert` and `server.tls_key` (what the installer does) or put a reverse proxy
with HTTPS in front and **turn its access log off**: the URL contains each user's secret id.

```nginx
server {
    listen 443 ssl;
    server_name sub.example.com;
    # ssl_certificate ...;
    access_log off;
    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## Web admin panel

Everything below can be edited in a browser instead of by hand. The panel is **off by default**; turn it on by
setting a password in `config.json`:

```bash
python -m magdsubforge hash-password        # asks for a password, prints a hash
```

```json
{ "admin": { "password_hash": "<paste the hash here>" } }
```

Then open `http://127.0.0.1:8080/admin` (path: `admin.path`) and log in. You get forms for rules, groups, patches and
the server/panel settings (plus a raw JSON editor), and a **live preview**: enter a subscription id, fetch the panel's
real response, and watch what every config becomes as you edit. **Save** writes `config.json`; changes apply at once.
English and Persian (right-to-left) are built in.

Use it only over HTTPS (or through an SSH tunnel): the password travels in the login request. Login settings
(`admin.*`) can only be changed in `config.json`, never from the panel.

## Configuring

Everything is in `config.json`, and changes apply without a restart. See **[docs/config-reference.md](docs/config-reference.md)**
for all options and `examples/` for ready examples:

| You want to | Use |
|---|---|
| remove or reorder configs | `rules` |
| merge configs into one balancer (per country, per name prefix, ...) | `groups` |
| put your own outbound (WARP, WireGuard, ...) in front of an exit config | `chains` + `accounts` |
| change anything else (DNS, routing, mux, fragment, ...) | `patches` |
| change address, port, URL path, timeouts | `server`, `panel` |

## Security notes

- The subscription id is checked (`server.subid_regex`) before it is sent to the panel.
- The public subscription route has no login and no rate limiting (the subscription id is the secret). Keep the port on localhost and use a reverse proxy. The admin panel has a password, signed session cookies, CSRF protection and a failed-login lockout.
- Never commit `config.json` (the `.gitignore` excludes it).
- The service never logs subscription ids or panel URLs.

## Not included (yet)

Automatic per-user WARP account registration (`accounts.register`, off by default, uses Cloudflare's unofficial API; tested against a simulated API only, not the real one).

## Similar projects (not affiliated)

Remnawave, Raven-subscribe, subscribe-middleware-go, Sub-Store.

## License

MIT, see [LICENSE](LICENSE).
