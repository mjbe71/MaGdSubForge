# Configuration reference

Everything MaGdSubForge does comes from one JSON file, `config.json` (path: environment variable
`MAGDSUBFORGE_CONFIG`, default `./config.json`). The file is re-read automatically when it changes (only
`server.route` needs a restart). An empty or missing file means: **subscriptions pass through unchanged**.

* A wrong value is ignored and reported on stderr; a broken file keeps the previous settings.
* Any key starting with `_` is a comment and is ignored (anywhere in the file).
* Check a file without starting the service: `python -m magdsubforge check config.json`
* See what your rules do to a saved panel response: `python -m magdsubforge preview panel.json config.json`

Nothing below is assumed by the program: it never looks for special words in names. You decide what each config is.

## How a subscription is processed

```
panel response ──► patches (stage "source") ──► rules ──► groups ──► patches (stage "output") ──► client
```

## `server`

| Key | Default | Meaning |
|---|---|---|
| `host` | `"127.0.0.1"` | Address to listen on (`0.0.0.0` for all). The Docker image overrides it with the env var `MAGDSUBFORGE_HOST`. |
| `port` | `8080` | Port. |
| `route` | `"/sub/"` | Public path; the subscription id is appended. Needs a restart to change. |
| `subid_regex` | `"^[A-Za-z0-9_-]{4,64}$"` | Ids not matching this get a 404 without contacting the panel. |
| `workers`, `threads` | `2`, `4` | Used by gunicorn (`gunicorn.conf.py`). |

## `panel`

| Key | Default | Meaning |
|---|---|---|
| `url` | `""` | The panel's JSON-subscription URL; the id is appended. **Required** (without it the service answers 503). |
| `page_url` | `""` | Optional. If set, browsers (`Accept: text/html`) are redirected to `page_url` + id. |
| `timeout` | `10` | Seconds. |
| `verify_tls` | `true` | Check the panel's TLS certificate. |
| `headers` | `{}` | Extra request headers sent to the panel. |
| `pass_headers` | `Profile-Title`, `Profile-Update-Interval`, `Subscription-Userinfo`, `Profile-Web-Page-Url`, `Support-Url`, `Announce`, `Content-Disposition` | Panel response headers copied to the client. |

## Conditions (`when`)

Used by rules, groups, patches and `member_cost`. A `when` is an object; **all** its entries must hold. A missing or
empty `when` matches every config.

```json
{ "remark": { "contains": "fast" }, "network": "xhttp" }
{ "any": [ { "port": 443 }, { "port": 8443 } ] }
{ "not": { "protocol": "socks" } }
```

A plain value means "equals": `{ "network": "ws" }`.

**Fields.** They are read from the config's *main outbound* (the first outbound that is not `freedom`, `blackhole`,
`dns` or `loopback`):
`remark`, `protocol`, `tag`, `address`, `port`, `network`, `security`, `sni`, `host`, `path`, `flag` (the first flag
emoji in the remark, if any). Anything else can be reached with a dotted path into the whole config, e.g.
`"outbounds.0.settings.vnext.0.users.0.flow"`.

**Operators.** `equals`, `not_equals`, `contains`, `icontains`, `not_contains`, `startswith`, `endswith`, `regex`,
`iregex` (regular expression, searched anywhere in the value), `in`, `not_in` (lists), `exists` (true/false),
`gt`, `gte`, `lt`, `lte` (numbers). **Combinators:** `all` (list), `any` (list), `not` (object).

## `rules`: keep, drop, reorder

A list, evaluated in order. For each config the **first matching rule decides**; configs matching no rule are kept.

```json
{ "id": "hide-tests", "when": { "remark": { "startswith": "test" } }, "do": "drop" }
```

| Key | Meaning |
|---|---|
| `id` | Name (unique). Optional. |
| `enabled` | `false` switches the rule off without deleting it. |
| `when` | Condition. |
| `do` | `keep` (stop here, leave it alone), `drop` (remove it), `pin_top`, `pin_bottom`. |

## `groups`: combine configs into balancers

A list, evaluated in order. Each group collects the configs matching `when` (dropped ones are excluded) and builds
**one config per bucket** that contains all the members' outbounds and a balancer over them. Everything else
(inbounds, DNS, other outbounds, routing rules) is taken from the bucket's first member.

```json
{
  "id": "fast",
  "when": { "remark": { "regex": "^fast-" } },
  "split_by": { "field": "remark", "regex": "^fast-([^-]+)" },
  "name": "{split} ({n})",
  "type": "leastLoad",
  "params": { "expected": 2, "maxRTT": "1s" },
  "probe": { "destination": "https://www.gstatic.com/generate_204", "interval": "30s", "sampling": 2 },
  "member_cost": [ { "when": { "address": { "startswith": "b1." } }, "value": 5 } ]
}
```

| Key | Default | Meaning |
|---|---|---|
| `id` | auto | Unique name. Also used to build outbound tags (`<id>-<bucket>-<n>`). |
| `enabled` | `true` | Switch off without deleting. |
| `when` | everything | Which configs are candidates. |
| `split_by` | none | `{"field": ..., "regex": ...}`: one balancer **per distinct value** of the regex's first capture group (or the whole match). Configs where it does not match are not grouped. Without `split_by` all candidates form one balancer. |
| `name` | `{split}` with `split_by`, else the group id | Remark of the resulting config. `{split}` = the bucket value, `{n}` = member count, `{group}` = group id. |
| `type` | **required** | The Xray balancer strategy, as you would write it by hand: `leastLoad`, `leastPing`, `random`, `roundRobin`, ... |
| `params` | none | Copied as-is to the strategy's `settings` (for `leastLoad`: `expected`, `maxRTT`, `tolerance`, `baselines`, `costs`, ...). |
| `probe` | none | The observatory settings, copied as-is. For `leastLoad` they become `burstObservatory.pingConfig`; for other types the `observatory` object. Without it no observatory is written. |
| `probe_kind` | by type | Force `"burst"` or `"observatory"`. |
| `member_cost` | none | List of `{"when": ..., "value": number}`; the first matching entry gives that member a `costs` entry (added to any `costs` you put in `params`). |
| `min_members` | `1` | Buckets with fewer members are not built (their configs stay as they were). |
| `remove_members_from_output` | `true` | `false` keeps the original single configs next to the balancer. |
| `position` | where the first member was | `"top"` or `"bottom"`. |

Notes: routing rules that pointed at the first member's outbound are re-pointed to the balancer, and a final
"all traffic → balancer" rule is added. The old `observatory`/`burstObservatory` of the template are removed
because they referred to the old tags.

## `patches`: change anything

Merge JSON of your own into matching configs. This is how you add DNS, routing rules, fragment/mux settings, etc.
The program ships none of these.

```json
{
  "id": "mux-off",
  "stage": "source",
  "target": "outbound",
  "when": { "network": "xhttp" },
  "merge": { "mux": { "enabled": false }, "streamSettings": { "xhttpSettings": { "mode": "auto" } } },
  "routing_prepend": [ { "type": "field", "domain": ["example.org"], "outboundTag": "direct" } ]
}
```

| Key | Default | Meaning |
|---|---|---|
| `stage` | `"source"` | `source`: before rules/groups, on the panel's original configs (so `when` sees the original names, and the changes carry into groups). `output`: on the final configs. |
| `target` | `"config"` | `config`: merge into the whole config. `outbound`: merge into every non-`freedom`/`blackhole`/`dns` outbound of it. |
| `when` | everything | Condition on the config. |
| `merge` | none | Deep-merged: objects are merged, lists and values replaced, **`null` deletes** the key. |
| `routing_prepend`, `routing_append` | none | Lists of routing rules added before / after the existing ones. |
