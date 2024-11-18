# راهنمای نصب و راه‌اندازی سیستم پیامک خودکار آستریسک
## روی MikroTik RouterOS 7

### پیش‌نیازها
- دستگاه MikroTik با RouterOS نسخه 7
- حداقل 128 مگابایت فضای خالی
- اتصال به اینترنت
- دسترسی SSH به روتر

### مراحل نصب

#### ۱. فعال‌سازی کانتینر
ابتدا باید قابلیت کانتینر را فعال کنیم:
```
/system/container
add remote-image=node:16-alpine interface=bridge pull=yes
```

#### ۲. تنظیم متغیرهای محیطی
متغیرهای محیطی مورد نیاز را تنظیم می‌کنیم:
```
/system/container/envs
add name=sms-env key=SMS_USERNAME value="نام‌کاربری"
add name=sms-env key=SMS_PASSWORD value="رمز‌عبور"
add name=sms-env key=ASTERISK_IP value="آی‌پی‌آستریسک"
add name=sms-env key=ASTERISK_USER value="کاربر‌آستریسک"
add name=sms-env key=ASTERISK_PASS value="رمز‌آستریسک"
add name=sms-env key=FROM_NUMBER value="شماره‌فرستنده"
```

#### ۳. ایجاد مسیر اشتراکی
```
/system/container/mounts
add name=app-mount dst=/app src=/asterisk-sms
```

#### ۴. کپی فایل‌های برنامه
فایل‌های برنامه را در مسیر `/asterisk-sms` کپی کنید:
- `index.js`
- `package.json`
- `.env`

#### ۵. راه‌اندازی کانتینر
```
/system/container
add remote-image=node:16-alpine interface=bridge envlist=sms-env mounts=app-mount cmd="npm install && node index.js"
```

### مانیتورینگ و عیب‌یابی

#### مشاهده وضعیت کانتینر
```
/system/container/print
```

#### مشاهده لاگ‌ها
```
/system/container/logs
print where container="container1"
```

#### راه‌اندازی مجدد
```
/system/container/restart numbers=[شماره-کانتینر]
```

### نکات مهم
- حتماً قبل از راه‌اندازی، تنظیمات آستریسک را چک کنید
- از صحت اطلاعات حساب پیامک اطمینان حاصل کنید
- سرویس پیامک باید در دسترس باشد
- برای تغییر متن پیامک، فایل `index.js` را ویرایش کنید

### رفع مشکلات رایج
1. خطای اتصال به آستریسک:
   - آی‌پی و پورت را بررسی کنید
   - فایروال را چک کنید

2. خطای ارسال پیامک:
   - اعتبار حساب را بررسی کنید
   - صحت شماره‌ها را چک کنید

3. مشکل کانتینر:
   - لاگ‌ها را بررسی کنید
   - حافظه و CPU را چک کنید

### پشتیبانی
در صورت بروز مشکل:
- لاگ‌های سیستم را بررسی کنید
- با پشتیبانی تماس بگیرید
- مستندات را مطالعه کنید
