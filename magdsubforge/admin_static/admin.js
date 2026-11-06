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
      tlsCert: "HTTPS certificate file (optional)", tlsKey: "HTTPS key file (optional)",
      chains: "Chains", chainsHint: "Build a config whose own outbound (yours, e.g. WARP) is dialed through an exit config from the panel. Use {account.x}, {exit.address}, {split}, {n} inside the entry.",
      exitWhen: "Exit configs (conditions)", entry: "Entry outbound (JSON)", entryHint: "Placeholders: {account.key} from the accounts source, {exit.address} (any field), {choice.name} (see below), {split}, {n}.",
      choices: "Choices per user (JSON, optional)", choicesHint: "For example {\"endpoint\": [\"1.2.3.4\", \"5.6.7.8\"]}: each user gets one value, always the same one, available as {choice.endpoint}.",
      throughExit: "Dial the entry through the exit config", removeExit: "Remove the exit config from the output", hint_chain_split: "Empty regex = one chain from the first match",
      accounts: "Accounts (values for {account.*})", accountFile: "Accounts file", accountHint: "JSON file next to config.json; keep it private.", accountDefault: "Shared account (JSON, optional; the file wins)",
      regTitle: "Automatic WARP accounts", regEnabled: "Create a WARP account for each new user automatically (needs the accounts file; uses Cloudflare's unofficial API)", regRetry: "Wait after a failure (s)", regApi: "API address (optional)", regVersion: "Client version (optional)",
      regNow: "Create account now", regSubid: "Subscription id (empty = the shared account)", regSaveFirst: "Save the settings first (the accounts file must be saved).", regOk: "Account created.", regExists: "That user already has an account.",
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
      tlsCert: "فایل گواهی HTTPS (اختیاری)", tlsKey: "فایل کلید HTTPS (اختیاری)",
      chains: "زنجیره‌ها", chainsHint: "کانفیگی بسازید که outbound خودتان (مثلاً WARP) از داخل یک کانفیگ خروجی پنل عبور می‌کند. داخل entry می‌توانید از {account.x}، {exit.address}، {split} و {n} استفاده کنید.",
      exitWhen: "کانفیگ‌های خروجی (شرط‌ها)", entry: "outbound ورودی (JSON)", entryHint: "جاگذارها: {account.key} از منبع حساب‌ها، {exit.address} (هر فیلد)، {choice.name} (پایین را ببینید)، {split} و {n}.",
      choices: "انتخاب برای هر کاربر (JSON، اختیاری)", choicesHint: "مثلاً {\"endpoint\": [\"1.2.3.4\", \"5.6.7.8\"]}: هر کاربر یکی از مقادیر را می‌گیرد (همیشه همان یکی) و با {choice.endpoint} در دسترس است.",
      throughExit: "ورودی از داخل کانفیگ خروجی عبور کند", removeExit: "کانفیگ خروجی از نتیجه حذف شود", hint_chain_split: "regex خالی = یک زنجیره از اولین مطابق",
      accounts: "حساب‌ها (مقدار {account.*})", accountFile: "فایل حساب‌ها", accountHint: "فایل JSON کنار config.json؛ محرمانه نگه دارید.", accountDefault: "حساب مشترک (JSON، اختیاری؛ فایل اولویت دارد)",
      regTitle: "حساب WARP خودکار", regEnabled: "برای هر کاربر جدید خودکار حساب WARP بساز (به فایل حساب‌ها نیاز دارد؛ از API غیررسمی Cloudflare استفاده می‌کند)", regRetry: "صبر پس از شکست (ثانیه)", regApi: "آدرس API (اختیاری)", regVersion: "نسخهٔ کلاینت (اختیاری)",
      regNow: "همین الان حساب بساز", regSubid: "شناسهٔ ساب (خالی = حساب مشترک)", regSaveFirst: "ابتدا تنظیمات را ذخیره کنید (فایل حساب‌ها باید ذخیره شده باشد).", regOk: "حساب ساخته شد.", regExists: "این کاربر از قبل حساب دارد.",
    },
  };

  Object.assign(STR.en, {
    start: "Start", rules: "Filter & order", groups: "Balancers", chains: "Via another route (WARP)", patches: "Advanced edits", settings: "Settings",
    rulesHint: "Decide which configs your users get. Rules run from top to bottom and the first one that matches decides. Example: if the name contains \"test\" → remove it.",
    groupsHint: "Merge several configs into one smart config that picks the best server by itself (load balancing). Example: every config named \"Germany-…\" becomes a single \"Germany\" config.",
    chainsHint: "Send traffic through a second hop such as WARP: your own outbound is dialed through one of the panel's configs. The Start page has an easy setup for WARP.",
    patchesHint: "For experts: merge your own JSON into the configs (DNS, routing, fragment, ...). A null value deletes a key.",
    do: "Then", keep: "Keep it (and skip the later rules)", drop: "Remove it", pin_top: "Move it to the top", pin_bottom: "Move it to the bottom",
    revert: "Discard changes", whenIf: "If", fieldCustom: "other (JSON path)", andWord: "and", everyConfig: "every config",
    wizTitle: "Setup guide", wizIntro: "Follow the steps. Each one checks that things work. You can leave and come back at any time; nothing changes until you save.",
    step1: "Connect to your panel", step2: "Try a subscription", step3: "Choose what to change", step4: "Review and save",
    s1help: "Enter the JSON-subscription address of your 3x-ui panel, without the user's id at the end. In 3x-ui: Panel settings → Subscription → JSON.",
    checkConn: "Check connection", next: "Next", back: "Back", skip: "Skip",
    s2help: "Enter the subscription id of any real user (the last part of their link). We fetch it from the panel and show what it contains.",
    found: "Found {n} config(s):", more: "… and {n} more",
    s3help: "Pick what you want. Nothing here is required: with nothing selected, users get the panel's subscription unchanged. Everything created here can be edited later in the other tabs.",
    goalHide: "Hide some configs", goalHideHelp: "Remove configs whose name contains any of these:",
    goalBalance: "Balance configs automatically", goalBalanceHelp: "Merge configs whose name contains any of these into one smart config:",
    balSplit: "One balancer per … (optional pattern; the first (group) is the name, e.g. ^[^-]+-([^-]+) )", balType: "Balancer type",
    balNote: "A health probe with common defaults is added; you can change it in the Balancers tab.",
    goalWarp: "Send traffic through WARP (over MASQUE)", goalWarpHelp: "Use configs whose name contains any of these as the exit:",
    warpEndpoint: "WARP endpoint addresses (one per line)", warpEndpointHint: "Each user gets one of these (always the same one for the same user).", warpAuto: "Create a WARP account for each user automatically",
    warpNote: "The outbound is a working WARP-over-MASQUE example; you can edit every field in the \"Via another route\" tab. Automatic accounts use Cloudflare's unofficial API.",
    matches: "matches {n} of {m} in your sample", noMatchSample: "Try a subscription in step 2 to see how many match.",
    s4help: "This is what your users will get. Look at the list on the right, run the checks, then save.",
    checksTitle: "Checks", runChecks: "Run the checks again", running: "Checking…",
    beforeAfter: "{a} config(s) from the panel → {b} for the user",
    saveFinish: "Save and finish", doneTitle: "Saved. You're done!", doneLink: "Link for your users (add the user's subscription id at the end):",
    copy: "Copy", copied: "Copied", goTabs: "You can fine-tune everything in the other tabs.",
    exp_drop_rule: "Removed by rule \"{rule}\"", exp_drop: "Removed", exp_top: "Moved to the top (\"{rule}\")", exp_bottom: "Moved to the bottom (\"{rule}\")",
    exp_keep_rule: "Kept by rule \"{rule}\"", exp_kept: "Kept as it is", exp_group: "Merged into balancer \"{g}\"", exp_chain: "Exit of \"{c}\"",
    colWhat: "What happens", chipsHint: "Type a word, press Enter. Add as many as you like.", noAccountYet: "The WARP chain \"{id}\" cannot be shown here yet: it needs a WARP account. With automatic accounts on, each user's account is created the first time they fetch their subscription.",
    c_panel_url_ok: "Panel address is set", c_panel_url_fail: "The panel address is not set",
    c_panel_reach_ok: "The panel is reachable", c_panel_reach_warn: "The panel answered with an error (HTTP {code})",
    c_panel_reach_fail_connect: "Cannot connect to the panel: wrong address or port, or a firewall is blocking it",
    c_panel_reach_fail_tls: "The panel's TLS certificate is not trusted: fix it or turn off \"Verify TLS certificate\" in Settings",
    c_panel_reach_fail_timeout: "The panel did not answer in time",
    c_sample_ok: "The panel gave {n} config(s) for your test id", c_sample_fail: "The panel refused the test id: {reason}", c_sample_skip: "Test id not tried (go back to step 2 to try one)",
    c_https_ok: "HTTPS is on (certificate valid for {days} more days)", c_https_ok_proxy: "You are connected over HTTPS",
    c_https_warn: "The HTTPS certificate expires in {days} day(s)", c_https_warn_off: "Users would reach the subscription over plain HTTP: run \"sudo magdsubforge tls\" on the server",
    c_https_fail_unreadable: "HTTPS is on but the certificate file cannot be read",
    c_admin_pw_ok: "The admin password is stored safely", c_admin_pw_warn: "The admin password is stored as plain text: run \"sudo magdsubforge set-admin-password\"",
    c_config_ok: "The settings are valid", c_config_warn: "{n} note(s) about the settings", c_config_fail: "{n} problem(s) in the settings",
    c_accounts_ok: "WARP accounts are ready", c_accounts_fail_none: "The WARP chain has no account values: turn on automatic accounts",
    c_accounts_fail_unwritable: "Automatic accounts need a folder the service can write to for the accounts file",
  });
  Object.assign(STR.fa, {
    start: "شروع", rules: "فیلتر و ترتیب", groups: "بالانسر", chains: "عبور از مسیر دیگر (مثل WARP)", patches: "ویرایش پیشرفته", settings: "تنظیمات",
    rulesHint: "مشخص می‌کند کاربران کدام کانفیگ‌ها را بگیرند. قانون‌ها از بالا به پایین بررسی می‌شوند و اولین قانونِ مطابق تصمیم می‌گیرد. مثال: اگر نام شامل «test» بود ← حذف شود.",
    groupsHint: "چند کانفیگ را در یک کانفیگ هوشمند ادغام می‌کند که خودش بهترین سرور را انتخاب می‌کند (بالانس بار). مثال: همهٔ کانفیگ‌هایی که نامشان «Germany-…» است تبدیل به یک کانفیگ «Germany» می‌شوند.",
    chainsHint: "ترافیک را از یک پرش دوم مثل WARP عبور می‌دهد: outbound خودتان از داخل یکی از کانفیگ‌های پنل ساخته می‌شود. در صفحهٔ «شروع» برای WARP یک راه‌اندازی آسان هست.",
    patchesHint: "برای کاربران حرفه‌ای: JSON خودتان را در کانفیگ‌ها ادغام کنید (DNS، مسیریابی، fragment و ...). مقدار null کلید را حذف می‌کند.",
    do: "آنگاه", keep: "نگهش دار (و قوانین بعدی را نادیده بگیر)", drop: "حذفش کن", pin_top: "ببرش بالای لیست", pin_bottom: "ببرش پایین لیست",
    revert: "لغو تغییرات", whenIf: "اگر", fieldCustom: "دیگر (مسیر JSON)", andWord: "و", everyConfig: "همهٔ کانفیگ‌ها",
    wizTitle: "راهنمای راه‌اندازی", wizIntro: "مرحله‌به‌مرحله جلو بروید. هر مرحله بررسی می‌کند که همه‌چیز درست کار کند. هر وقت خواستید می‌توانید خارج شوید و برگردید؛ تا ذخیره نکنید چیزی عوض نمی‌شود.",
    step1: "اتصال به پنل", step2: "امتحان یک اشتراک", step3: "انتخاب تغییرات", step4: "بررسی و ذخیره",
    s1help: "آدرس ساب JSON پنل 3x-ui را وارد کنید، بدون شناسهٔ کاربر در انتها. در 3x-ui: تنظیمات پنل ← اشتراک ← JSON.",
    checkConn: "بررسی اتصال", next: "بعدی", back: "قبلی", skip: "رد کردن",
    s2help: "شناسهٔ ساب یک کاربر واقعی را وارد کنید (بخش آخر لینک او). آن را از پنل می‌گیریم و محتوایش را نشان می‌دهیم.",
    found: "{n} کانفیگ پیدا شد:", more: "… و {n} مورد دیگر",
    s3help: "هر چه می‌خواهید انتخاب کنید. هیچ‌کدام اجباری نیست: اگر چیزی انتخاب نکنید، کاربران همان ساب پنل را بدون تغییر می‌گیرند. هر چه اینجا ساخته شود بعداً در تب‌های دیگر قابل ویرایش است.",
    goalHide: "پنهان کردن بعضی کانفیگ‌ها", goalHideHelp: "کانفیگ‌هایی که نامشان شامل هر یک از این‌ها باشد حذف شوند:",
    goalBalance: "بالانس خودکار کانفیگ‌ها", goalBalanceHelp: "کانفیگ‌هایی که نامشان شامل هر یک از این‌ها باشد در یک کانفیگ هوشمند ادغام شوند:",
    balSplit: "برای هر … یک بالانسر (الگوی اختیاری؛ (گروه) اول = نام، مثلاً ^[^-]+-([^-]+) )", balType: "نوع بالانسر",
    balNote: "یک probe سلامت با مقادیر رایج اضافه می‌شود؛ در تب «بالانسر» می‌توانید تغییرش دهید.",
    goalWarp: "عبور ترافیک از WARP (روی MASQUE)", goalWarpHelp: "کانفیگ‌هایی که نامشان شامل هر یک از این‌ها باشد به‌عنوان خروجی استفاده شوند:",
    warpEndpoint: "آدرس‌های endpoint وارپ (هر خط یکی)", warpEndpointHint: "هر کاربر یکی از این‌ها را می‌گیرد (برای یک کاربر همیشه همان یکی).", warpAuto: "برای هر کاربر خودکار حساب WARP بساز",
    warpNote: "این outbound یک نمونهٔ کارکنِ WARP روی MASQUE است؛ همهٔ فیلدهایش را در تب «عبور از مسیر دیگر» می‌توانید ویرایش کنید. حساب خودکار از API غیررسمی Cloudflare استفاده می‌کند.",
    matches: "{n} مورد از {m} کانفیگ نمونهٔ شما مطابقت دارد", noMatchSample: "در مرحلهٔ ۲ یک اشتراک را امتحان کنید تا تعداد مطابقت‌ها را ببینید.",
    s4help: "این همان چیزی است که کاربران می‌گیرند. فهرست سمت دیگر را ببینید، بررسی‌ها را اجرا کنید و ذخیره کنید.",
    checksTitle: "بررسی‌ها", runChecks: "اجرای دوبارهٔ بررسی‌ها", running: "در حال بررسی…",
    beforeAfter: "{a} کانفیگ از پنل ← {b} کانفیگ برای کاربر",
    saveFinish: "ذخیره و پایان", doneTitle: "ذخیره شد. کار تمام است!", doneLink: "لینک برای کاربران (شناسهٔ ساب هر کاربر را به انتها اضافه کنید):",
    copy: "کپی", copied: "کپی شد", goTabs: "همه‌چیز را در تب‌های دیگر می‌توانید دقیق‌تر تنظیم کنید.",
    exp_drop_rule: "با قانون «{rule}» حذف شد", exp_drop: "حذف شد", exp_top: "به بالای لیست رفت («{rule}»)", exp_bottom: "به پایین لیست رفت («{rule}»)",
    exp_keep_rule: "با قانون «{rule}» نگه داشته شد", exp_kept: "همان‌طور که هست می‌ماند", exp_group: "در بالانسر «{g}» ادغام شد", exp_chain: "خروجی «{c}»",
    colWhat: "چه می‌شود", chipsHint: "یک کلمه بنویسید و Enter بزنید. هر تعداد می‌توانید اضافه کنید.", noAccountYet: "زنجیرهٔ WARP با نام «{id}» هنوز در اینجا قابل نمایش نیست: به حساب WARP نیاز دارد. اگر حساب خودکار روشن باشد، حساب هر کاربر هنگام اولین دریافت ساب او ساخته می‌شود.",
    c_panel_url_ok: "آدرس پنل تنظیم شده است", c_panel_url_fail: "آدرس پنل تنظیم نشده است",
    c_panel_reach_ok: "پنل در دسترس است", c_panel_reach_warn: "پنل با خطا پاسخ داد (HTTP {code})",
    c_panel_reach_fail_connect: "اتصال به پنل ممکن نیست: آدرس یا پورت اشتباه است یا فایروال جلویش را گرفته",
    c_panel_reach_fail_tls: "گواهی TLS پنل معتبر نیست: درستش کنید یا در تنظیمات «بررسی گواهی TLS» را خاموش کنید",
    c_panel_reach_fail_timeout: "پنل به‌موقع پاسخ نداد",
    c_sample_ok: "پنل برای شناسهٔ آزمایشی {n} کانفیگ داد", c_sample_fail: "پنل شناسهٔ آزمایشی را نپذیرفت: {reason}", c_sample_skip: "شناسهٔ آزمایشی امتحان نشد (برای امتحان به مرحلهٔ ۲ برگردید)",
    c_https_ok: "HTTPS روشن است (گواهی {days} روز دیگر معتبر است)", c_https_ok_proxy: "با HTTPS متصل هستید",
    c_https_warn: "گواهی HTTPS تا {days} روز دیگر منقضی می‌شود", c_https_warn_off: "کاربران ساب را با HTTP ساده می‌گیرند: روی سرور «sudo magdsubforge tls» را بزنید",
    c_https_fail_unreadable: "HTTPS روشن است ولی فایل گواهی خوانده نمی‌شود",
    c_admin_pw_ok: "رمز ادمین امن ذخیره شده است", c_admin_pw_warn: "رمز ادمین به‌صورت متن ساده ذخیره شده: «sudo magdsubforge set-admin-password» را بزنید",
    c_config_ok: "تنظیمات معتبر است", c_config_warn: "{n} نکته دربارهٔ تنظیمات", c_config_fail: "{n} مشکل در تنظیمات",
    c_accounts_ok: "حساب‌های WARP آماده‌اند", c_accounts_fail_none: "زنجیرهٔ WARP مقدار حساب ندارد: حساب خودکار را روشن کنید",
    c_accounts_fail_unwritable: "حساب خودکار به پوشه‌ای نیاز دارد که سرویس بتواند فایل حساب‌ها را در آن بنویسد",
  });
  const OPLABEL = {
    en: { equals: "is exactly", not_equals: "is not", contains: "contains", icontains: "contains (any case)", not_contains: "does not contain",
      startswith: "starts with", endswith: "ends with", regex: "matches pattern", iregex: "matches pattern (any case)", in: "is one of", not_in: "is none of",
      exists: "exists", gt: ">", gte: "≥", lt: "<", lte: "≤" },
    fa: { equals: "دقیقاً برابر است با", not_equals: "برابر نیست با", contains: "شامل", icontains: "شامل (بدون حساسیت به حروف)", not_contains: "شامل نیست",
      startswith: "شروع می‌شود با", endswith: "تمام می‌شود با", regex: "با الگو می‌خواند", iregex: "با الگو می‌خواند (بدون حساسیت)", in: "یکی از", not_in: "هیچ‌کدام از",
      exists: "وجود دارد", gt: ">", gte: "≥", lt: "<", lte: "≤" },
  };
  const FIELDLABEL = {
    en: { remark: "name", protocol: "protocol", tag: "tag", address: "server address", port: "port", network: "transport", security: "security", sni: "SNI", host: "host", path: "path", flag: "flag" },
    fa: { remark: "نام", protocol: "پروتکل", tag: "تگ", address: "آدرس سرور", port: "پورت", network: "ترنسپورت", security: "امنیت", sni: "SNI", host: "host", path: "مسیر", flag: "پرچم" },
  };
  const opLabel = (op) => (OPLABEL[lang] && OPLABEL[lang][op]) || op;
  const fieldLabel = (f) => (FIELDLABEL[lang] && FIELDLABEL[lang][f]) || f;
  let lang = (navigator.language || "").startsWith("en") ? "en" : "fa";
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
  let tab = "start";
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
  function fieldPicker(r, sync, render) {
    const custom = r.f && !FIELDS.includes(r.f);
    const sel = h("select", { onchange: (ev) => {
      if (ev.target.value === "__custom") { r.f = ""; sync(); render(); } else { r.f = ev.target.value; sync(); render(); }
    } }, FIELDS.map((f) => h("option", { value: f }, fieldLabel(f))), h("option", { value: "__custom" }, t("fieldCustom")));
    sel.value = custom || r.f === "" ? "__custom" : r.f;
    if (sel.value !== "__custom") return sel;
    return h("div", { class: "fpick" }, sel, h("input", { type: "text", value: r.f, placeholder: "streamSettings.network", oninput: (ev) => { r.f = ev.target.value; sync(); } }));
  }
  function describeWhen(w) {
    if (!isSimple(w)) return "{…}";
    const rows = toRows(w);
    if (!rows.length) return t("everyConfig");
    return rows.map((r) => fieldLabel(r.f) + " " + opLabel(r.op) + (r.op === "exists" ? "" : " \"" + r.v + "\"")).join(" " + t("andWord") + " ");
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
            fieldPicker(r, sync, render),
            h("select", { value: r.op, onchange: (ev) => { r.op = ev.target.value; if (r.op === "exists") r.v = "true"; sync(); render(); } },
              OPS.map((o) => h("option", { value: o }, opLabel(o)))),
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
          summaryLine(kind, it),
          body(it)));
      });
      wrap.append(h("button", { type: "button", onclick: () => { items.push(newItem(items)); changed(); draw(); } }, t("add")));
    }
    draw();
    return wrap;
  }
  function summaryLine(kind, it) {
    let txt = "";
    if (kind === "rules") txt = t("whenIf") + " " + describeWhen(it.when) + " → " + t(it.do || "keep");
    else if (kind === "groups") txt = describeWhen(it.when) + " → " + t("groups") + " (" + (it.type || "?") + ")";
    else if (kind === "chains") txt = t("exitWhen") + ": " + describeWhen(it.exit_when);
    else txt = describeWhen(it.when);
    return h("p", { class: "summary" }, txt);
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
      field(t("entry"), bindJSON(c, "entry", 10), t("entryHint"), true),
      field(t("choices"), bindJSON(c, "choices", 4), t("choicesHint"), true));
  };

  const patchBody = (p) => h("div", {}, whenEditor(p),
    h("div", { class: "grid" },
      field(t("stage"), bindSelect(p, "stage", [["", t("source")], ["output", t("output")]])),
      field(t("target"), bindSelect(p, "target", [["", t("config")], ["outbound", t("outbound")]]))),
    field(t("merge"), bindJSON(p, "merge", 6), null, true),
    field(t("routingPre"), bindJSON(p, "routing_prepend"), null, true),
    field(t("routingPost"), bindJSON(p, "routing_append"), null, true));

  function registerEditor(a) {
    const r = (a.register = a.register || {});
    const subid = h("input", { type: "text", placeholder: "" });
    const msg = h("span", { class: "hint" });
    const btn = h("button", { type: "button", onclick: async () => {
      if (isDirty()) { msg.textContent = t("regSaveFirst"); return; }
      btn.disabled = true; msg.textContent = "…";
      const res = await api("register-account", { subid: subid.value.trim() });
      btn.disabled = false;
      msg.textContent = res.ok ? (res.data.created ? t("regOk") : t("regExists")) : (res.data.error || "error");
    } }, t("regNow"));
    return h("div", {},
      h("h3", {}, t("regTitle")),
      h("label", { class: "check" }, bindBool(r, "enabled", false), t("regEnabled")),
      h("div", { class: "grid" },
        field(t("regRetry"), bindText(r, "retry_seconds", { num: true, placeholder: "600" })),
        field(t("regApi"), bindText(r, "api")),
        field(t("regVersion"), bindText(r, "client_version"))),
      field(t("regSubid"), subid),
      h("div", {}, btn, " ", msg));
  }

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
        field(t("threads"), bindText(s, "threads", { num: true })),
        field(t("tlsCert"), bindText(s, "tls_cert", { placeholder: "/etc/magdsubforge/certs/fullchain.pem" })),
        field(t("tlsKey"), bindText(s, "tls_key", { placeholder: "/etc/magdsubforge/certs/privkey.pem" }))),
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
      registerEditor(a),
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


  // ---------- setup wizard ----------
  const WARP_ENDPOINTS = ["162.159.198.114", "162.159.198.206", "162.159.198.186", "162.159.198.135", "162.159.198.219", "162.159.198.64", "162.159.198.231", "162.159.198.250", "162.159.198.184", "162.159.198.197", "162.159.198.48", "162.159.198.203", "162.159.198.230", "162.159.199.87", "162.159.199.127", "162.159.199.188", "162.159.199.163", "162.159.199.193", "162.159.199.102", "162.159.199.76", "162.159.199.192", "162.159.199.111", "162.159.199.113", "162.159.199.46", "162.159.199.109", "162.159.199.106", "162.159.199.101", "162.159.199.190", "162.159.199.235", "162.159.199.100", "162.159.199.83", "162.159.199.37", "162.159.199.149"];
  const WARP_ENTRY = {
  "protocol": "masque",
  "settings": {
    "address": "{choice.endpoint}",
    "port": 443
  },
  "targetStrategy": "UseIPv4v6",
  "streamSettings": {
    "sockopt": {
      "domainStrategy": "UseIP",
      "happyEyeballs": {
        "tryDelayMs": 250,
        "prioritizeIPv6": false,
        "interleave": 2,
        "maxConcurrentTry": 20
      }
    },
    "method": "masque",
    "security": "tls",
    "tlsSettings": {
      "serverName": "www.cloudflare.com",
      "fingerprint": "ios",
      "alpn": [
        "h2"
      ]
    },
    "masqueSettings": {
      "warp": {
        "privateKey": "{account.privateKey}",
        "publicKey": "{account.publicKey}",
        "address": "{account.address}"
      }
    }
  }
};
  const wiz = { step: 0, hide: { on: false, items: [] }, bal: { on: false, items: [], split: "", type: "leastLoad" },
    warp: { on: false, items: [], endpoints: WARP_ENDPOINTS.join("\n"), auto: true }, checks: null, running: false, done: false, connMsg: null };

  function upsert(kind, item) {
    const l = (cfg[kind] = cfg[kind] || []);
    const i = l.findIndex((x) => x.id === item.id);
    if (i >= 0) l[i] = item; else l.push(item);
  }
  function dropWiz(kind, id) { if (cfg[kind]) cfg[kind] = cfg[kind].filter((x) => x.id !== id); }
  const escapeRegex = (x) => x.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  // one text -> "contains"; several -> one case-insensitive pattern that matches any of them
  const nameCond = (items) => ({ remark: items.length === 1 ? { icontains: items[0] } : { iregex: items.map(escapeRegex).join("|") } });
  function applyGoals() {
    const hide = wiz.hide.items, bal = wiz.bal.items, warp = wiz.warp.items;
    if (wiz.hide.on && hide.length) upsert("rules", { id: "hide-configs", when: nameCond(hide), do: "drop" }); else dropWiz("rules", "hide-configs");
    if (wiz.bal.on && bal.length) {
      const g = { id: "balance-configs", when: nameCond(bal), type: wiz.bal.type, name: bal.join(" + ") };
      if (wiz.bal.split.trim()) { g.split_by = { field: "remark", regex: wiz.bal.split.trim() }; g.name = "{split}"; }
      if (g.type === "leastLoad" || g.type === "leastPing") g.probe = { destination: "https://www.gstatic.com/generate_204", interval: "30s", timeout: "5s", sampling: 2 };
      upsert("groups", g);
    } else dropWiz("groups", "balance-configs");
    if (wiz.warp.on && warp.length) {
      const eps = wiz.warp.endpoints.split(/[\s,]+/).filter(Boolean);
      const chain = { id: "warp-chain", exit_when: nameCond(warp), entry: JSON.parse(JSON.stringify(WARP_ENTRY)) };
      if (eps.length) chain.choices = { endpoint: eps }; else chain.entry.settings.address = "";
      upsert("chains", chain);
      if (wiz.warp.auto) {
        const a = (cfg.accounts = cfg.accounts || {});
        if (!a.file) a.file = "accounts.json";
        a.register = Object.assign({}, a.register, { enabled: true });
      }
    } else dropWiz("chains", "warp-chain");
    changed();
  }
  const matchCount = (items) => {
    if (!sample || !items.length) return null;
    const needles = items.map((x) => x.toLowerCase());
    return sample.filter((c) => { const r = String(c.remarks ?? "").toLowerCase(); return needles.some((n) => r.includes(n)); }).length;
  };
  // a box where each typed text becomes a chip (Enter or comma adds it, Backspace on an empty box removes the last one)
  function chipsInput(items, onChange, placeholder) {
    const box = h("div", { class: "chips" });
    const input = h("input", { type: "text", placeholder });
    const add = (raw) => {
      raw.split(/[,\n]/).map((x) => x.trim()).filter(Boolean).forEach((x) => { if (!items.includes(x)) items.push(x); });
      input.value = ""; draw(); onChange();
    };
    function draw() {
      box.replaceChildren(...items.map((x, i) => h("span", { class: "chip big" }, x,
        h("button", { type: "button", "aria-label": "×", onclick: () => { items.splice(i, 1); draw(); onChange(); } }, "×"))), input);
    }
    input.addEventListener("keydown", (e) => {
      if ((e.key === "Enter" || e.key === ",") && input.value.trim()) { e.preventDefault(); add(input.value); input.focus(); }
      else if (e.key === "Backspace" && !input.value && items.length) { items.pop(); draw(); onChange(); input.focus(); }
    });
    input.addEventListener("blur", () => { if (input.value.trim()) add(input.value); });
    input.addEventListener("paste", (e) => { const t = (e.clipboardData || window.clipboardData).getData("text"); if (/[,\n]/.test(t)) { e.preventDefault(); add(t); } });
    draw();
    return box;
  }

  function checkText(c) {
    const a = Object.assign({}, c.args || {});
    const kind = a.kind;
    for (const key of [kind ? "c_" + c.id + "_" + c.status + "_" + kind : null, "c_" + c.id + "_" + c.status]) {
      if (key && (STR[lang][key] || STR.en[key])) return t(key, a);
    }
    return c.text;
  }
  function checksView() {
    const box = h("div", { class: "checks" });
    if (wiz.running) { box.append(h("p", { class: "hint" }, t("running"))); return box; }
    (wiz.checks || []).forEach((c) => {
      const icon = { ok: "✓", warn: "!", fail: "✗", skip: "–" }[c.status] || "?";
      box.append(h("div", { class: "check-row " + c.status }, h("span", { class: "ci" }, icon), h("div", {}, checkText(c),
        c.args && c.args.problems ? h("ul", {}, c.args.problems.map((m) => h("li", {}, m))) : null)));
    });
    return box;
  }
  async function runChecks() {
    wiz.running = true; drawEditor();
    const r = await api("checks", { config: cfg, subid: lastSubid });
    wiz.running = false; wiz.checks = r.ok ? r.data.checks : [];
    drawEditor();
  }

  function wizardView() {
    const names = [t("step1"), t("step2"), t("step3"), t("step4")];
    const nav = h("div", { class: "steps" }, names.map((n, i) => h("button", { type: "button", class: "step" + (i === wiz.step ? " on" : i < wiz.step ? " past" : ""),
      onclick: () => goStep(i) }, h("b", {}, i + 1), " ", n)));
    const body = h("div", { class: "wiz" });
    const buttons = (nextLabel, onNext, canBack = true) => h("div", { class: "row" },
      canBack && wiz.step > 0 ? h("button", { type: "button", onclick: () => goStep(wiz.step - 1) }, t("back")) : null,
      h("button", { type: "button", class: "primary", onclick: onNext || (() => goStep(wiz.step + 1)) }, nextLabel || t("next")));

    if (wiz.done) {
      const route = ((cfg.server && cfg.server.route) || loadedRoute || "/sub/");
      const link = location.origin + route.replace(/\/?$/, "/") + "<id>";
      body.append(h("h2", {}, t("doneTitle")), h("p", {}, t("doneLink")), h("pre", {}, link),
        h("div", { class: "row" }, h("button", { type: "button", onclick: async (ev) => {
          try { await navigator.clipboard.writeText(link); ev.target.textContent = t("copied"); } catch (e) { /* ignore */ }
        } }, t("copy"))), h("p", { class: "hint" }, t("goTabs")),
        h("div", { class: "row" }, h("button", { type: "button", onclick: () => { wiz.done = false; wiz.step = 0; drawEditor(); } }, t("wizTitle"))));
      return h("div", {}, nav, body);
    }

    if (wiz.step === 0) {
      const p = (cfg.panel = cfg.panel || {});
      const out = h("div", {}, wiz.connMsg || null);
      body.append(h("p", {}, t("s1help")),
        field(t("panelUrl"), bindText(p, "url", { placeholder: "https://panel.example.com:2096/json/" }), null, true),
        h("label", { class: "check" }, bindBool(p, "verify_tls", true), t("verifyTls")),
        h("div", { class: "row" }, h("button", { type: "button", onclick: async () => {
          out.replaceChildren(h("p", { class: "hint" }, t("running")));
          const r = await api("checks", { config: cfg });
          const rows = (r.data.checks || []).filter((c) => c.id.startsWith("panel"));
          wiz.connMsg = h("div", { class: "checks" }, rows.map((c) => h("div", { class: "check-row " + c.status }, h("span", { class: "ci" }, { ok: "✓", warn: "!", fail: "✗", skip: "–" }[c.status]), h("div", {}, checkText(c)))));
          out.replaceChildren(wiz.connMsg);
        } }, t("checkConn"))), out, buttons());
    } else if (wiz.step === 1) {
      const subid = h("input", { type: "text", value: lastSubid, placeholder: t("subid"), "aria-label": t("subid"), autocomplete: "off" });
      const note = h("div", {});
      const showSample = () => {
        if (!sample) return;
        const first = sample.slice(0, 12);
        note.replaceChildren(h("div", { class: "msg ok" }, t("found", { n: sample.length })),
          h("ul", { class: "plain" }, first.map((c) => h("li", {}, String(c.remarks ?? "(no name)")))),
          sample.length > 12 ? h("p", { class: "hint" }, t("more", { n: sample.length - 12 })) : null);
      };
      body.append(h("p", {}, t("s2help")), h("div", { class: "row" }, subid, h("button", { type: "button", onclick: async () => {
        note.replaceChildren(h("p", { class: "hint" }, t("fetching")));
        lastSubid = subid.value.trim();
        const r = await api("sample", { subid: lastSubid, config: cfg });
        if (r.ok) { sample = r.data.configs; drawSampleInfo(); runPreview(); showSample(); }
        else note.replaceChildren(h("div", { class: "msg err" }, r.data.error || "error"));
      } }, t("fetch"))), note, buttons(sample ? t("next") : t("skip")));
      showSample();
    } else if (wiz.step === 2) {
      const goal = (key, title, help, extra) => {
        const g = wiz[key];
        const box = h("div", { class: "goal" + (g.on ? " on" : "") });
        const matchNote = h("p", { class: "hint" });
        const upd = () => {
          const n = matchCount(g.items);
          matchNote.textContent = g.items.length ? (n === null ? t("noMatchSample") : t("matches", { n, m: sample.length })) : "";
        };
        box.append(h("label", { class: "check big" }, h("input", { type: "checkbox", checked: g.on, onchange: (e) => { g.on = e.target.checked; box.classList.toggle("on", g.on); } }), title),
          h("div", { class: "goal-body" }, h("p", { class: "hint" }, help), chipsInput(g.items, upd, t("chipsHint")), matchNote, extra ? extra() : null));
        upd();
        return box;
      };
      body.append(h("p", {}, t("s3help")),
        goal("hide", t("goalHide"), t("goalHideHelp")),
        goal("bal", t("goalBalance"), t("goalBalanceHelp"), () => h("div", {},
          field(t("balSplit"), h("input", { type: "text", value: wiz.bal.split, oninput: (e) => { wiz.bal.split = e.target.value; } })),
          field(t("balType"), (() => { const sel = h("select", { onchange: (e) => { wiz.bal.type = e.target.value; } },
            ["leastLoad", "leastPing", "random", "roundRobin"].map((x) => h("option", { value: x }, x))); sel.value = wiz.bal.type; return sel; })()),
          h("p", { class: "hint" }, t("balNote")))),
        goal("warp", t("goalWarp"), t("goalWarpHelp"), () => h("div", {},
          field(t("warpEndpoint"), (() => { const ta = h("textarea", { rows: 4, spellcheck: "false" }); ta.value = wiz.warp.endpoints;
            ta.addEventListener("input", () => { wiz.warp.endpoints = ta.value; }); return ta; })(), t("warpEndpointHint"), true),
          h("label", { class: "check" }, h("input", { type: "checkbox", checked: wiz.warp.auto, onchange: (e) => { wiz.warp.auto = e.target.checked; } }), t("warpAuto")),
          h("p", { class: "hint" }, t("warpNote")))),
        buttons());
    } else {
      body.append(h("p", {}, t("s4help")));
      if (lastPreview && sample) {
        const o = lastPreview.output ? lastPreview.output.length : 0;
        body.append(h("p", { class: "big-note" }, t("beforeAfter", { a: sample.length, b: o })));
      }
      body.append(h("h3", {}, t("checksTitle")), checksView(),
        h("div", { class: "row" }, h("button", { type: "button", onclick: runChecks }, t("runChecks"))),
        h("div", { class: "row" }, h("button", { type: "button", onclick: () => goStep(2) }, t("back")),
          h("button", { type: "button", class: "primary", onclick: save }, t("saveFinish"))));
    }
    return h("div", {}, nav, body);
  }
  function goStep(i) {
    wiz.step = Math.max(0, Math.min(3, i));
    if (wiz.step === 3) { applyGoals(); wiz.checks = null; runChecks(); return; }
    drawEditor();
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
    const tabs = [["start", t("start")], ["rules", t("rules")], ["groups", t("groups")], ["chains", t("chains")], ["patches", t("patches")], ["settings", t("settings")], ["raw", t("raw")]];
    let body;
    if (tab === "start") body = wizardView();
    else if (tab === "rules") body = listEditor("rules", "rulesHint", (items) => ({ id: nextId("rule", items), when: {}, do: "drop" }), ruleBody);
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

  function explain(c) {
    const bits = [];
    const rule = c.rule || "";
    if (c.action === "drop") bits.push(rule ? t("exp_drop_rule", { rule }) : t("exp_drop"));
    else if (c.action === "pin_top") bits.push(t("exp_top", { rule }));
    else if (c.action === "pin_bottom") bits.push(t("exp_bottom", { rule }));
    else if (c.action === "keep" && rule) bits.push(t("exp_keep_rule", { rule }));
    (c.groups || []).forEach((g) => bits.push(t("exp_group", { g })));
    (c.chains || []).forEach((x) => bits.push(t("exp_chain", { c: x })));
    return bits.length ? bits.join(" · ") : t("exp_kept");
  }

  function drawPreviewResult() {
    const d = lastPreview;
    resultEl.replaceChildren();
    if (!d) return;
    (d.errors || []).forEach((m) => resultEl.append(h("div", { class: "msg err" }, m)));
    (d.warnings || []).forEach((m) => resultEl.append(h("div", { class: "msg warn" }, m)));
    if (!sample) return;
    (d.report.errors || []).forEach((m) => {
      const mm = /^chain ([^ ]+) failed: .*no value for \{account\./.exec(m);
      const auto = cfg.accounts && cfg.accounts.register && cfg.accounts.register.enabled;
      resultEl.append(mm && auto ? h("div", { class: "msg warn" }, t("noAccountYet", { id: mm[1] })) : h("div", { class: "msg err" }, m));
    });
    resultEl.append(h("h3", {}, t("cfgTable")), h("table", {},
      h("thead", {}, h("tr", {}, h("th", {}, "#"), h("th", {}, "remark"), h("th", {}, "network"), h("th", {}, t("colWhat")))),
      h("tbody", {}, d.report.configs.map((c) => h("tr", { class: c.action === "drop" ? "drop" : "" },
        h("td", {}, c.index), h("td", {}, c.remark), h("td", { class: "dim" }, c.fields.network || ""),
        h("td", {}, explain(c)))))));
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
      if (tab === "start" && wiz.step === 3) { wiz.done = true; drawEditor(); }
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
      h("header", {}, h("h1", {}, t("title")), statusEl, langToggle(),
        h("button", { type: "button", onclick: () => { if (!isDirty() || confirm(t("revert") + "?")) start(); } }, t("revert")), saveBtn,
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
    const hasWork = ["rules", "groups", "chains", "patches"].some((k) => (cfg[k] || []).length);
    tab = (cfg.panel && cfg.panel.url && hasWork) ? "rules" : "start";
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
