"use strict";
(() => {
  const BASE = document.documentElement.dataset.base;
  const FIELDS = ["remark", "protocol", "tag", "address", "port", "network", "security", "sni", "host", "path", "flag"];
  const OPS = ["equals", "not_equals", "contains", "icontains", "not_contains", "startswith", "endswith", "regex", "iregex",
    "in", "not_in", "exists", "gt", "gte", "lt", "lte"];
  const COMBINATORS = ["all", "any", "not"];

  const STR = {
    en: {
      title: "MaGdSubForge admin", password: "Password", login: "Log in", logout: "Log out", save: "Save", saved: "Saved. Changes apply on the next request.",
      unsaved: "Unsaved changes", disabled: "The admin panel is disabled. Set admin.password_hash in config.json.",
      rules: "Rules", groups: "Groups", patches: "Patches", settings: "Server & panel", raw: "JSON",
      add: "+ Add", remove: "Delete", up: "Up", down: "Down", enabled: "Enabled", id: "Name (id)",
      when: "When (conditions)", whenHint: "All conditions must hold. Leave empty to match every config.",
      addCond: "+ Condition", jsonMode: "Edit as JSON", rowsMode: "Edit as rows", notSimple: "This condition is too complex for rows; use JSON.",
      field: "field", op: "operator", value: "value",
      do: "Action", keep: "keep (leave alone)", drop: "drop (remove)", pin_top: "pin to top", pin_bottom: "pin to bottom",
      rulesHint: "Evaluated in order; the first matching rule decides. Configs matching no rule are kept.",
      groupsHint: "Each group merges matching configs into one balancer config (per bucket when split by a value).",
      patchesHint: "Merge your own JSON into matching configs. A null value deletes a key.",
      splitField: "Split by field", splitRegex: "Split regex (first capture group = bucket)", name: "Output name ({split} {n} {group})",
      type: "Balancer type", params: "Strategy settings (JSON)", probe: "Probe / observatory (JSON)", probeKind: "Probe kind",
      auto: "automatic", memberCost: "Member costs (JSON list)", minMembers: "Minimum members", removeMembers: "Remove the single configs from the output",
      position: "Position", default: "where the first member was", top: "top", bottom: "bottom",
      stage: "Stage", source: "source (before rules/groups)", output: "output (after groups)", target: "Target", config: "whole config", outbound: "each proxy outbound",
      merge: "Merge (JSON)", routingPre: "Routing rules to add first (JSON list)", routingPost: "Routing rules to add last (JSON list)",
      server: "Server", panel: "Panel", restartNote: "Changing the route needs a restart of the service.", adminNote: "Login settings (admin.*) are edited in config.json only.",
      host: "Listen address", port: "Port", route: "Public path", subidRegex: "Allowed id (regex)", workers: "Workers", threads: "Threads",
      panelUrl: "Panel JSON-subscription URL", pageUrl: "Browser redirect URL (optional)", timeout: "Timeout (s)", verifyTls: "Verify TLS certificate",
      headers: "Extra request headers (JSON)", passHeaders: "Response headers passed to clients (JSON list)",
      apply: "Apply", jsonBad: "Invalid JSON", preview: "Preview", subid: "Subscription id", fetch: "Fetch from panel", pasteJson: "…or paste a panel response",
      useJson: "Use pasted JSON", sampleN: "Sample: {n} config(s)", noSample: "Load a sample to see what your rules do.",
      cfgTable: "What happens to each config", outputs: "Result", errors: "Problems", warnings: "Notes", inOut: "in output",
      members: "members", showJson: "click to show JSON", wrongPw: "Wrong password", fetching: "Fetching…", hint_split: "Empty regex = one balancer for all",
      newItem: "new", confirmDel: "Delete this item?",
      chains: "Chains", chainsHint: "Build a config whose own outbound (yours, e.g. WARP) is dialed through an exit config from the panel. Use {account.x}, {exit.address}, {split}, {n} inside the entry.",
      exitWhen: "Exit configs (conditions)", entry: "Entry outbound (JSON)", entryHint: "Placeholders: {account.key} from the accounts source, {exit.address} (any field), {split}, {n}.",
      throughExit: "Dial the entry through the exit config", removeExit: "Remove the exit config from the output", hint_chain_split: "Empty regex = one chain from the first match",
      accounts: "Accounts (values for {account.*})", accountFile: "Accounts file", accountHint: "JSON file next to config.json; keep it private.", accountDefault: "Shared account (JSON, optional; the file wins)",
    },
    fa: {
      title: "مدیریت MaGdSubForge", password: "رمز عبور", login: "ورود", logout: "خروج", save: "ذخیره", saved: "ذخیره شد. تغییرات از درخواست بعدی اعمال می‌شود.",
      unsaved: "تغییرات ذخیره‌نشده", disabled: "پنل ادمین غیرفعال است. در config.json مقدار admin.password_hash را بگذارید.",
      rules: "قوانین", groups: "گروه‌ها", patches: "پچ‌ها", settings: "سرور و پنل", raw: "JSON",
      add: "+ افزودن", remove: "حذف", up: "بالا", down: "پایین", enabled: "فعال", id: "نام (id)",
      when: "شرط‌ها", whenHint: "همهٔ شرط‌ها باید برقرار باشند. خالی = همهٔ کانفیگ‌ها.",
      addCond: "+ شرط", jsonMode: "ویرایش با JSON", rowsMode: "ویرایش با ردیف", notSimple: "این شرط برای ردیف‌ها پیچیده است؛ از JSON استفاده کنید.",
      field: "فیلد", op: "عملگر", value: "مقدار",
      do: "کار", keep: "keep (دست نزن)", drop: "drop (حذف)", pin_top: "بالای لیست", pin_bottom: "پایین لیست",
      rulesHint: "به ترتیب بررسی می‌شوند و اولین قانونِ مطابق تصمیم می‌گیرد. کانفیگی که هیچ قانونی نخورد نگه داشته می‌شود.",
      groupsHint: "هر گروه کانفیگ‌های مطابق را در یک کانفیگ بالانسر ادغام می‌کند (اگر بر اساس مقدار تقسیم شود، برای هر دسته یکی).",
      patchesHint: "JSON خودتان را در کانفیگ‌های مطابق ادغام کنید. مقدار null کلید را حذف می‌کند.",
      splitField: "تقسیم بر اساس فیلد", splitRegex: "regex تقسیم (گروه اول = دسته)", name: "اسم خروجی ({split} {n} {group})",
      type: "نوع بالانسر", params: "تنظیمات strategy (JSON)", probe: "probe / observatory (JSON)", probeKind: "نوع probe",
      auto: "خودکار", memberCost: "هزینهٔ اعضا (لیست JSON)", minMembers: "حداقل تعداد عضو", removeMembers: "کانفیگ‌های تکی از خروجی حذف شوند",
      position: "جایگاه", default: "جای اولین عضو", top: "بالا", bottom: "پایین",
      stage: "مرحله", source: "source (قبل از قوانین و گروه‌ها)", output: "output (بعد از گروه‌ها)", target: "هدف", config: "کل کانفیگ", outbound: "هر outbound پروکسی",
      merge: "ادغام (JSON)", routingPre: "قوانین مسیریابی برای اول لیست (لیست JSON)", routingPost: "قوانین مسیریابی برای آخر لیست (لیست JSON)",
      server: "سرور", panel: "پنل", restartNote: "تغییر مسیر (route) به ری‌استارت سرویس نیاز دارد.", adminNote: "تنظیمات ورود (admin.*) فقط در config.json ویرایش می‌شوند.",
      host: "آدرس شنود", port: "پورت", route: "مسیر عمومی", subidRegex: "شناسهٔ مجاز (regex)", workers: "Worker", threads: "Thread",
      panelUrl: "آدرس ساب JSON پنل", pageUrl: "آدرس ریدایرکت مرورگر (اختیاری)", timeout: "Timeout (ثانیه)", verifyTls: "بررسی گواهی TLS",
      headers: "هدرهای اضافهٔ درخواست (JSON)", passHeaders: "هدرهای پاسخ که به کلاینت می‌روند (لیست JSON)",
      apply: "اعمال", jsonBad: "JSON نامعتبر", preview: "پیش‌نمایش", subid: "شناسهٔ ساب", fetch: "گرفتن از پنل", pasteJson: "…یا پاسخ پنل را اینجا بچسبانید",
      useJson: "استفاده از JSON چسبانده‌شده", sampleN: "نمونه: {n} کانفیگ", noSample: "برای دیدن اثر قوانین، یک نمونه بگیرید.",
      cfgTable: "سرنوشت هر کانفیگ", outputs: "نتیجه", errors: "مشکلات", warnings: "توجه", inOut: "در خروجی",
      members: "عضو", showJson: "برای دیدن JSON کلیک کنید", wrongPw: "رمز اشتباه است", fetching: "در حال گرفتن…", hint_split: "regex خالی = یک بالانسر برای همه",
      newItem: "جدید", confirmDel: "این مورد حذف شود؟",
      chains: "زنجیره‌ها", chainsHint: "کانفیگی بسازید که outbound خودتان (مثلاً WARP) از داخل یک کانفیگ خروجی پنل عبور می‌کند. داخل entry می‌توانید از {account.x}، {exit.address}، {split} و {n} استفاده کنید.",
      exitWhen: "کانفیگ‌های خروجی (شرط‌ها)", entry: "outbound ورودی (JSON)", entryHint: "جاگذارها: {account.key} از منبع حساب‌ها، {exit.address} (هر فیلد)، {split} و {n}.",
      throughExit: "ورودی از داخل کانفیگ خروجی عبور کند", removeExit: "کانفیگ خروجی از نتیجه حذف شود", hint_chain_split: "regex خالی = یک زنجیره از اولین مطابق",
      accounts: "حساب‌ها (مقدار {account.*})", accountFile: "فایل حساب‌ها", accountHint: "فایل JSON کنار config.json؛ محرمانه نگه دارید.", accountDefault: "حساب مشترک (JSON، اختیاری؛ فایل اولویت دارد)",
    },
  };
  let lang = (navigator.language || "").startsWith("fa") ? "fa" : "en";
  try { const saved = localStorage.getItem("magd_lang"); if (saved === "fa" || saved === "en") lang = saved; } catch (e) { /* ignore */ }
  const t = (k, vars) => {
    let s = (STR[lang] && STR[lang][k]) || STR.en[k] || k;
    for (const [a, b] of Object.entries(vars || {})) s = s.replace("{" + a + "}", b);
    return s;
  };

  // ---------- tiny DOM helper ----------
  function h(tag, attrs, ...kids) {
    const e = document.createElement(tag);
    let later;
    for (const [k, v] of Object.entries(attrs || {})) {
      if (k === "class") e.className = v;
      else if (k.startsWith("on")) e.addEventListener(k.slice(2), v);
      else if (k === "value") later = v;
      else if (k === "checked") e.checked = !!v;
      else if (v === true) e.setAttribute(k, "");
      else if (v !== false && v != null) e.setAttribute(k, v);
    }
    for (const kid of kids.flat(Infinity)) {
      if (kid == null || kid === false) continue;
      e.append(kid.nodeType ? kid : document.createTextNode(String(kid)));
    }
    if (later !== undefined) e.value = later;
    return e;
  }

  // ---------- state ----------
  let csrf = "";
  let cfg = {};
  let savedSnapshot = "{}";
  let loadedRoute = "/sub/";
  let sample = null;
  let tab = "rules";
  let previewTimer = null;
  let lastPreview = null;
  let lastSubid = "";
  const root = document.getElementById("app");

  async function api(path, body) {
    const opt = { method: body === undefined ? "GET" : "POST", headers: { "X-CSRF-Token": csrf }, credentials: "same-origin" };
    if (body !== undefined) { opt.headers["Content-Type"] = "application/json"; opt.body = JSON.stringify(body); }
    const r = await fetch(BASE + "/api/" + path, opt);
    let data = {};
    try { data = await r.json(); } catch (e) { /* not json */ }
    return { status: r.status, ok: r.ok, data };
  }

  // ---------- bound inputs ----------
  function setOrDelete(obj, key, val, empty) {
    if (empty) delete obj[key]; else obj[key] = val;
    changed();
  }
  function bindText(obj, key, opts = {}) {
    const i = h("input", { type: opts.num ? "number" : "text", value: obj[key] ?? "", placeholder: opts.placeholder || "",
      list: opts.list || null, step: opts.num ? "any" : null,
      oninput: () => {
        const v = i.value;
        setOrDelete(obj, key, opts.num ? Number(v) : v, v === "" && opts.optional !== false);
      } });
    return i;
  }
  function bindBool(obj, key, def) {
    const c = h("input", { type: "checkbox", checked: obj[key] ?? def,
      onchange: () => setOrDelete(obj, key, c.checked, c.checked === def) });
    return c;
  }
  function bindSelect(obj, key, options) {
    const s = h("select", { value: obj[key] ?? "", onchange: () => setOrDelete(obj, key, s.value, s.value === "") },
      options.map(([v, label]) => h("option", { value: v }, label)));
    s.value = obj[key] ?? "";
    return s;
  }
  function bindJSON(obj, key, rows = 4) {
    const ta = h("textarea", { rows, spellcheck: "false" });
    ta.value = obj[key] === undefined ? "" : JSON.stringify(obj[key], null, 2);
    ta.addEventListener("input", () => {
      const txt = ta.value.trim();
      if (txt === "") { ta.classList.remove("bad"); delete obj[key]; changed(); return; }
      try { obj[key] = JSON.parse(txt); ta.classList.remove("bad"); changed(); } catch (e) { ta.classList.add("bad"); }
    });
    return ta;
  }
  function field(label, input, hint, wide) {
    return h("label", { class: "f" + (wide ? " wide" : "") }, label, input, hint ? h("span", { class: "hint" }, hint) : null);
  }

  // ---------- conditions (`when`) ----------
  function isSimple(w) {
    if (w === undefined || w === null) return true;
    if (typeof w !== "object" || Array.isArray(w)) return false;
    for (const [k, v] of Object.entries(w)) {
      if (k.startsWith("_") || COMBINATORS.includes(k)) return false;
      if (v !== null && typeof v === "object") {
        if (Array.isArray(v)) return false;
        for (const [op, arg] of Object.entries(v)) {
          if (!OPS.includes(op)) return false;
          if (typeof arg === "object" && !(Array.isArray(arg) && (op === "in" || op === "not_in"))) return false;
        }
      }
    }
    return true;
  }
  function toRows(w) {
    const rows = [];
    for (const [f, v] of Object.entries(w || {})) {
      if (v !== null && typeof v === "object") for (const [op, arg] of Object.entries(v)) rows.push({ f, op, v: Array.isArray(arg) ? arg.join(", ") : String(arg) });
      else rows.push({ f, op: "equals", v: String(v) });
    }
    return rows;
  }
  function fromRows(rows) {
    const w = {};
    for (const r of rows) {
      if (!r.f) continue;
      let val = r.v;
      if (r.op === "in" || r.op === "not_in") val = r.v.split(",").map((x) => x.trim()).filter(Boolean);
      else if (r.op === "exists") val = r.v !== "false";
      else if (["gt", "gte", "lt", "lte"].includes(r.op)) val = r.v === "" || isNaN(Number(r.v)) ? 0 : Number(r.v);
      (w[r.f] = w[r.f] || {})[r.op] = val;
    }
    for (const f of Object.keys(w)) { const ops = Object.keys(w[f]); if (ops.length === 1 && ops[0] === "equals") w[f] = w[f].equals; }
    return w;
  }
  function whenEditor(obj, key = "when", label = "when") {
    const box = h("div", { class: "when" });
    let mode = isSimple(obj[key]) ? "rows" : "json";
    function draw() {
      box.replaceChildren();
      const head = h("div", { class: "row" }, h("h4", {}, t(label)));
      const toggle = h("button", { type: "button", onclick: () => {
        if (mode === "rows") { mode = "json"; draw(); } else if (isSimple(obj[key])) { mode = "rows"; draw(); } else alert(t("notSimple"));
      } }, mode === "rows" ? t("jsonMode") : t("rowsMode"));
      head.append(toggle);
      box.append(head);
      if (mode === "json") {
        box.append(bindJSON(obj, key, 4));
        return;
      }
      const rows = toRows(obj[key]);
      const sync = () => { const w = fromRows(rows); if (Object.keys(w).length) obj[key] = w; else delete obj[key]; changed(); };
      const list = h("div");
      const render = () => {
        list.replaceChildren();
        rows.forEach((r, idx) => {
          const val = r.op === "exists"
            ? h("select", { onchange: (ev) => { r.v = ev.target.value; sync(); } }, h("option", { value: "true" }, "true"), h("option", { value: "false" }, "false"))
            : h("input", { type: "text", value: r.v, placeholder: t("value"), oninput: (ev) => { r.v = ev.target.value; sync(); } });
          if (r.op === "exists") val.value = r.v === "false" ? "false" : "true";
          list.append(h("div", { class: "cond" },
            h("input", { type: "text", value: r.f, list: "dl-fields", placeholder: t("field"), oninput: (ev) => { r.f = ev.target.value; sync(); } }),
            h("select", { value: r.op, onchange: (ev) => { r.op = ev.target.value; if (r.op === "exists") r.v = "true"; sync(); render(); } },
              OPS.map((o) => h("option", { value: o }, o))),
            val,
            h("button", { type: "button", class: "danger", onclick: () => { rows.splice(idx, 1); sync(); render(); } }, "×")));
          list.lastChild.children[1].value = r.op;
        });
      };
      render();
      box.append(list, h("div", { class: "row" },
        h("button", { type: "button", onclick: () => { rows.push({ f: "remark", op: "contains", v: "" }); render(); } }, t("addCond")),
        h("span", { class: "hint" }, t("whenHint"))));
    }
    draw();
    return box;
  }

  // ---------- item lists ----------
  function listEditor(kind, hintKey, newItem, body) {
    const wrap = h("div");
    const items = (cfg[kind] = cfg[kind] || []);
    function draw() {
      wrap.replaceChildren(h("p", { class: "hint" }, t(hintKey)));
      items.forEach((it, idx) => {
        const move = (d) => { const j = idx + d; if (j < 0 || j >= items.length) return; [items[idx], items[j]] = [items[j], items[idx]]; changed(); draw(); };
        wrap.append(h("div", { class: "item" },
          h("div", { class: "item-head" },
            h("input", { type: "text", value: it.id ?? "", placeholder: t("id"), "aria-label": t("id"), oninput: (e) => { it.id = e.target.value; changed(); } }),
            h("label", { class: "check" }, bindBool(it, "enabled", true), t("enabled")),
            h("button", { type: "button", onclick: () => move(-1) }, "↑"),
            h("button", { type: "button", onclick: () => move(1) }, "↓"),
            h("button", { type: "button", class: "danger", onclick: () => { if (confirm(t("confirmDel"))) { items.splice(idx, 1); changed(); draw(); } } }, t("remove"))),
          body(it)));
      });
      wrap.append(h("button", { type: "button", onclick: () => { items.push(newItem(items)); changed(); draw(); } }, t("add")));
    }
    draw();
    return wrap;
  }
  const nextId = (prefix, items) => { let n = items.length + 1; while (items.some((x) => x.id === prefix + n)) n++; return prefix + n; };

  const ruleBody = (r) => h("div", {}, whenEditor(r),
    h("div", { class: "row" }, field(t("do"), bindSelect(r, "do", [["keep", t("keep")], ["drop", t("drop")], ["pin_top", t("pin_top")], ["pin_bottom", t("pin_bottom")]]))));

  const groupBody = (g) => {
    g.split_by = g.split_by && typeof g.split_by === "object" ? g.split_by : undefined;
    const sb = g.split_by || {};
    const upd = () => {
      if (sb.regex) { g.split_by = { field: sb.field || "remark", regex: sb.regex }; } else delete g.split_by;
      changed();
    };
    return h("div", {}, whenEditor(g),
      h("div", { class: "grid" },
        field(t("splitField"), h("input", { type: "text", list: "dl-fields", value: sb.field ?? "remark", oninput: (e) => { sb.field = e.target.value; upd(); } })),
        field(t("splitRegex"), h("input", { type: "text", value: sb.regex ?? "", oninput: (e) => { sb.regex = e.target.value; upd(); } }), t("hint_split")),
        field(t("name"), bindText(g, "name")),
        field(t("type"), bindText(g, "type", { list: "dl-types", optional: false })),
        field(t("probeKind"), bindSelect(g, "probe_kind", [["", t("auto")], ["burst", "burst"], ["observatory", "observatory"]])),
        field(t("minMembers"), bindText(g, "min_members", { num: true })),
        field(t("position"), bindSelect(g, "position", [["", t("default")], ["top", t("top")], ["bottom", t("bottom")]]))),
      h("div", { class: "row" }, h("label", { class: "check" }, bindBool(g, "remove_members_from_output", true), t("removeMembers"))),
      field(t("params"), bindJSON(g, "params"), null, true),
      field(t("probe"), bindJSON(g, "probe"), null, true),
      field(t("memberCost"), bindJSON(g, "member_cost"), null, true));
  };

  const chainBody = (c) => {
    c.split_by = c.split_by && typeof c.split_by === "object" ? c.split_by : undefined;
    const sb = c.split_by || {};
    const upd = () => { if (sb.regex) c.split_by = { field: sb.field || "remark", regex: sb.regex }; else delete c.split_by; changed(); };
    return h("div", {}, whenEditor(c, "exit_when", "exitWhen"),
      h("div", { class: "grid" },
        field(t("splitField"), h("input", { type: "text", list: "dl-fields", value: sb.field ?? "remark", oninput: (e) => { sb.field = e.target.value; upd(); } })),
        field(t("splitRegex"), h("input", { type: "text", value: sb.regex ?? "", oninput: (e) => { sb.regex = e.target.value; upd(); } }), t("hint_chain_split")),
        field(t("name"), bindText(c, "name")),
        field(t("position"), bindSelect(c, "position", [["", t("default")], ["top", t("top")], ["bottom", t("bottom")]]))),
      h("div", { class: "row" },
        h("label", { class: "check" }, bindBool(c, "through_exit", true), t("throughExit")),
        h("label", { class: "check" }, bindBool(c, "remove_exit_from_output", false), t("removeExit"))),
      field(t("entry"), bindJSON(c, "entry", 10), t("entryHint"), true));
  };

  const patchBody = (p) => h("div", {}, whenEditor(p),
    h("div", { class: "grid" },
      field(t("stage"), bindSelect(p, "stage", [["", t("source")], ["output", t("output")]])),
      field(t("target"), bindSelect(p, "target", [["", t("config")], ["outbound", t("outbound")]]))),
    field(t("merge"), bindJSON(p, "merge", 6), null, true),
    field(t("routingPre"), bindJSON(p, "routing_prepend"), null, true),
    field(t("routingPost"), bindJSON(p, "routing_append"), null, true));

  function settingsEditor() {
    const s = (cfg.server = cfg.server || {});
    const p = (cfg.panel = cfg.panel || {});
    const a = (cfg.accounts = cfg.accounts || {});
    return h("div", {},
      h("h3", {}, t("server")),
      h("div", { class: "grid" },
        field(t("host"), bindText(s, "host", { placeholder: "127.0.0.1" })),
        field(t("port"), bindText(s, "port", { num: true, placeholder: "8080" })),
        field(t("route"), bindText(s, "route", { placeholder: "/sub/" })),
        field(t("subidRegex"), bindText(s, "subid_regex")),
        field(t("workers"), bindText(s, "workers", { num: true })),
        field(t("threads"), bindText(s, "threads", { num: true }))),
      h("p", { class: "hint" }, t("restartNote")),
      h("h3", {}, t("panel")),
      h("div", { class: "grid" },
        field(t("panelUrl"), bindText(p, "url", { placeholder: "https://panel.example.com:2096/json/" }), null, true),
        field(t("pageUrl"), bindText(p, "page_url"), null, true),
        field(t("timeout"), bindText(p, "timeout", { num: true, placeholder: "10" })),
        h("label", { class: "check" }, bindBool(p, "verify_tls", true), t("verifyTls"))),
      field(t("headers"), bindJSON(p, "headers"), null, true),
      field(t("passHeaders"), bindJSON(p, "pass_headers"), null, true),
      h("h3", {}, t("accounts")),
      h("div", { class: "grid" }, field(t("accountFile"), bindText(a, "file", { placeholder: "accounts.json" }), t("accountHint"), true)),
      field(t("accountDefault"), bindJSON(a, "default"), null, true),
      h("p", { class: "hint" }, t("adminNote")));
  }

  function rawEditor() {
    const ta = h("textarea", { rows: 24, spellcheck: "false" });
    ta.value = JSON.stringify(cfg, null, 2);
    const msg = h("span", { class: "hint" });
    return h("div", {}, ta, h("div", { class: "row" },
      h("button", { type: "button", class: "primary", onclick: () => {
        try { const v = JSON.parse(ta.value); if (!v || typeof v !== "object" || Array.isArray(v)) throw new Error(); cfg = v; msg.textContent = ""; changed(); drawEditor(); }
        catch (e) { msg.textContent = t("jsonBad"); ta.classList.add("bad"); }
      } }, t("apply")), msg));
  }

  // ---------- main layout ----------
  const statusEl = h("span", { class: "status" });
  const editorEl = h("section", { class: "card" });
  const previewEl = h("section", { class: "card" });

  function setStatus(text, cls) { statusEl.textContent = text; statusEl.className = "status " + (cls || ""); }
  function isDirty() { return JSON.stringify(cfg) !== savedSnapshot; }
  function changed() {
    if (isDirty()) setStatus(t("unsaved"), "dirty"); else setStatus("", "");
    schedulePreview();
  }

  function drawEditor() {
    const tabs = [["rules", t("rules")], ["groups", t("groups")], ["chains", t("chains")], ["patches", t("patches")], ["settings", t("settings")], ["raw", t("raw")]];
    let body;
    if (tab === "rules") body = listEditor("rules", "rulesHint", (items) => ({ id: nextId("rule", items), when: {}, do: "drop" }), ruleBody);
    else if (tab === "groups") body = listEditor("groups", "groupsHint", (items) => ({ id: nextId("group", items), type: "leastLoad", when: {} }), groupBody);
    else if (tab === "chains") body = listEditor("chains", "chainsHint", (items) => ({ id: nextId("chain", items), exit_when: {}, entry: {} }), chainBody);
    else if (tab === "patches") body = listEditor("patches", "patchesHint", (items) => ({ id: nextId("patch", items), merge: {} }), patchBody);
    else if (tab === "settings") body = settingsEditor();
    else body = rawEditor();
    editorEl.replaceChildren(
      h("div", { class: "tabs" }, tabs.map(([k, label]) => h("button", { type: "button", class: tab === k ? "on" : "", onclick: () => { tab = k; drawEditor(); } }, label))),
      body);
  }

  // ---------- preview ----------
  function schedulePreview() {
    clearTimeout(previewTimer);
    previewTimer = setTimeout(runPreview, 450);
  }
  async function runPreview() {
    const r = await api("preview", { config: cfg, configs: sample || [], subid: lastSubid });
    if (!r.ok) return;
    lastPreview = r.data;
    drawPreviewResult();
  }
  const resultEl = h("div");
  const sampleInfo = h("p", { class: "hint" });
  function drawSampleInfo() { sampleInfo.textContent = sample ? t("sampleN", { n: sample.length }) : t("noSample"); }

  function drawPreviewResult() {
    const d = lastPreview;
    resultEl.replaceChildren();
    if (!d) return;
    (d.errors || []).forEach((m) => resultEl.append(h("div", { class: "msg err" }, m)));
    (d.warnings || []).forEach((m) => resultEl.append(h("div", { class: "msg warn" }, m)));
    if (!sample) return;
    (d.report.errors || []).forEach((m) => resultEl.append(h("div", { class: "msg err" }, m)));
    resultEl.append(h("h3", {}, t("cfgTable")), h("table", {},
      h("thead", {}, h("tr", {}, h("th", {}, "#"), h("th", {}, "remark"), h("th", {}, "network"), h("th", {}, t("do")), h("th", {}, t("groups")))),
      h("tbody", {}, d.report.configs.map((c) => h("tr", { class: c.action === "drop" ? "drop" : "" },
        h("td", {}, c.index), h("td", {}, c.remark), h("td", { class: "dim" }, c.fields.network || ""),
        h("td", {}, c.action, c.rule ? h("span", { class: "chip" }, c.rule) : null),
        h("td", {}, c.groups.concat(c.chains || []).map((g) => h("span", { class: "chip" }, g))))))));
    const pre = h("pre", { hidden: true });
    resultEl.append(h("h3", {}, t("outputs") + " (" + d.output.length + ")"),
      h("div", {}, d.output.map((o, i) => h("div", { class: "out-item", title: t("showJson"), onclick: () => {
        pre.hidden = false; pre.textContent = JSON.stringify(o, null, 2);
      } }, (i + 1) + ". ", o.remarks ?? "(no remark)"))), pre);
  }

  function drawPreview() {
    const subid = h("input", { type: "text", placeholder: t("subid"), "aria-label": t("subid"), autocomplete: "off" });
    const note = h("span", { class: "hint" });
    const paste = h("textarea", { rows: 4, spellcheck: "false", placeholder: t("pasteJson") });
    previewEl.replaceChildren(
      h("h3", {}, t("preview")),
      h("div", { class: "row" }, subid, h("button", { type: "button", onclick: async () => {
        note.textContent = t("fetching");
        lastSubid = subid.value.trim();
        const r = await api("sample", { subid: lastSubid, config: cfg });
        if (r.ok) { sample = r.data.configs; note.textContent = ""; drawSampleInfo(); runPreview(); } else note.textContent = r.data.error || "error";
      } }, t("fetch")), note),
      paste,
      h("div", { class: "row" }, h("button", { type: "button", onclick: () => {
        try { const v = JSON.parse(paste.value); sample = Array.isArray(v) ? v : [v]; note.textContent = ""; drawSampleInfo(); runPreview(); }
        catch (e) { note.textContent = t("jsonBad"); }
      } }, t("useJson"))),
      sampleInfo, resultEl);
    drawSampleInfo();
    drawPreviewResult();
  }

  async function save() {
    const r = await api("save", { config: cfg });
    if (r.ok) {
      savedSnapshot = JSON.stringify(cfg);
      const routeNow = (cfg.server && cfg.server.route) || "/sub/";
      setStatus(t("saved") + (routeNow !== loadedRoute ? " " + t("restartNote") : ""), "ok");
      lastPreview = Object.assign(lastPreview || {}, { errors: [], warnings: r.data.warnings || [] });
      runPreview();
    } else {
      setStatus((r.data.errors || [r.data.error || "error"]).length + " ✗", "err");
      lastPreview = Object.assign(lastPreview || {}, { errors: r.data.errors || [r.data.error || "error"], warnings: r.data.warnings || [] });
      drawPreviewResult();
    }
  }

  function datalists() {
    return [
      h("datalist", { id: "dl-fields" }, FIELDS.map((f) => h("option", { value: f }))),
      h("datalist", { id: "dl-types" }, ["leastLoad", "leastPing", "random", "roundRobin"].map((f) => h("option", { value: f }))),
    ];
  }

  function langToggle() {
    return h("button", { type: "button", onclick: () => {
      lang = lang === "fa" ? "en" : "fa";
      try { localStorage.setItem("magd_lang", lang); } catch (e) { /* ignore */ }
      applyLang(); drawMain();
    } }, lang === "fa" ? "English" : "فارسی");
  }
  function applyLang() { document.documentElement.lang = lang; document.documentElement.dir = lang === "fa" ? "rtl" : "ltr"; }

  function drawMain() {
    const saveBtn = h("button", { type: "button", class: "primary", onclick: save }, t("save"));
    root.replaceChildren(
      h("header", {}, h("h1", {}, t("title")), statusEl, langToggle(), saveBtn,
        h("button", { type: "button", onclick: async () => { await api("logout", {}); drawLogin(); } }, t("logout"))),
      h("main", {}, editorEl, previewEl), ...datalists());
    drawEditor();
    drawPreview();
    changed();
  }

  function drawLogin(message) {
    applyLang();
    const pw = h("input", { type: "password", autocomplete: "current-password", "aria-label": t("password"), placeholder: t("password") });
    const msg = h("div", { class: "msg err", hidden: !message }, message || "");
    const go = async () => {
      const r = await api("login", { password: pw.value });
      if (r.ok) { csrf = r.data.csrf; start(); } else { msg.hidden = false; msg.textContent = r.status === 401 ? t("wrongPw") : (r.data.error || "error"); }
    };
    pw.addEventListener("keydown", (e) => { if (e.key === "Enter") go(); });
    root.replaceChildren(h("div", { class: "card login" }, h("h1", {}, t("title")), pw, msg,
      h("div", { class: "row" }, h("button", { type: "button", class: "primary", onclick: go }, t("login")), langToggle())));
    pw.focus();
  }

  async function start() {
    const r = await api("state");
    if (r.status === 401) return drawLogin();
    if (!r.ok) { root.replaceChildren(h("div", { class: "card login" }, h("p", {}, t("disabled")))); return; }
    cfg = r.data.config || {};
    savedSnapshot = JSON.stringify(cfg);
    loadedRoute = r.data.route;
    lastPreview = { errors: r.data.errors, warnings: r.data.warnings };
    applyLang();
    drawMain();
  }

  async function boot() {
    applyLang();
    const me = await api("me");
    if (me.status === 404) { root.replaceChildren(h("div", { class: "card login" }, h("p", {}, t("disabled")))); return; }
    if (me.ok) { csrf = me.data.csrf; start(); } else drawLogin();
  }
  boot();
})();
