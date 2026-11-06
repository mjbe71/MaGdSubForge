<div dir="rtl">

# MaGdSubForge

فارسی · [English](README.md)

یک سرویس کوچک Flask که بین پنل **3x-ui** و برنامهٔ VPN کاربران قرار می‌گیرد. ساب JSON پنل را می‌گیرد و **طبق قوانینی که خودتان می‌نویسید** بازنویسی می‌کند: حذف کانفیگ، تغییر ترتیب، ادغام چند کانفیگ در بالانسر (`leastLoad`، `leastPing`، `random` و ...) و تغییر هر بخش دلخواه از JSON.

این پروژه هیچ قرارداد نام‌گذاری و هیچ ارائه‌دهندهٔ خاصی را نمی‌شناسد. شما تعیین می‌کنید هر کانفیگ چیست، چی حذف شود و چی با چی ترکیب شود. بدون قانون، ساب پنل بدون تغییر برمی‌گردد.

> نسخهٔ اولیه (v0.1). تست خودکار دارد ولی هنوز کسی زیاد در محیط واقعی استفاده نکرده. وابسته به 3x-ui نیست.

## شروع سریع

پایتون ۳ (یا Docker) و پنل 3x-ui با **ساب JSON** فعال لازم است.

```bash
git clone https://github.com/mjbe71/MaGdSubForge && cd MaGdSubForge
python3 -m venv venv && . venv/bin/activate
pip install -r requirements.txt
cp config.example.json config.json       # آدرس ساب JSON پنل خودتان را در آن بگذارید
python app.py                            # سرور توسعه
```

آدرس `http://127.0.0.1:8080/sub/<شناسهٔ ساب کاربر>` را باز کنید: ساب پنل را می‌بینید (چون هنوز قانونی ندارید، بدون تغییر).

آدرس ساب JSON را از تنظیمات پنل خودتان پیدا کنید (در 3x-ui معمولاً مسیری مثل `/json/` هست؛ مال خودتان را چک کنید) و در `config.json` به‌عنوان `panel.url` بگذارید؛ شناسهٔ کاربر به انتهایش اضافه می‌شود.

### امتحان قوانین بدون شبکه

```bash
python -m magdsubforge preview examples/sample-panel.json examples/balancers.json
```

نشان می‌دهد هر کانفیگ یک پاسخ ذخیره‌شدهٔ پنل با قوانین `examples/balancers.json` چه می‌شود. با `python -m magdsubforge check config.json` یک فایل را اعتبارسنجی کنید.

### استفادهٔ واقعی

```bash
gunicorn app:app        # آدرس، پورت و تعداد worker از config.json ("server") خوانده می‌شود
```

یا Docker: `mkdir -p data && cp config.json data/ && docker compose up -d --build` (پورت سمت راست در `docker-compose.yml` باید با `server.port` یکی باشد). فایل‌های Docker هنوز توسط نویسنده تست نشده‌اند.

جلوی سرویس یک reverse proxy با HTTPS بگذارید و **لاگ دسترسی آن را خاموش کنید**، چون آدرس شامل شناسهٔ محرمانهٔ کاربر است (نمونهٔ nginx در README انگلیسی).

## تنظیمات

همه‌چیز در `config.json` است و تغییرات بدون ری‌استارت اعمال می‌شود. همهٔ گزینه‌ها در **[docs/config-reference.md](docs/config-reference.md)** (انگلیسی) و نمونه‌ها در `examples/`:

| می‌خواهید | استفاده کنید از |
|---|---|
| حذف یا جابه‌جایی کانفیگ‌ها | `rules` |
| ادغام کانفیگ‌ها در یک بالانسر (به‌ازای هر کشور، پیشوند اسم و ...) | `groups` |
| تغییر هر چیز دیگر (DNS، مسیریابی، mux، fragment و ...) | `patches` |
| تغییر آدرس، پورت، مسیر URL، timeout | `server`، `panel` |

## نکات امنیتی

- شناسهٔ ساب قبل از ارسال به پنل بررسی می‌شود (`server.subid_regex`).
- ورود و محدودیت نرخ ندارد. پورت را محلی نگه دارید و از reverse proxy استفاده کنید.
- هرگز `config.json` را commit نکنید (در `.gitignore` هست).
- سرویس هرگز شناسهٔ ساب یا آدرس پنل را لاگ نمی‌کند.

## هنوز نیست

پنل ادمین تحت وب و WARP. در برنامه هستند.

## مجوز

MIT، فایل [LICENSE](LICENSE).

</div>
