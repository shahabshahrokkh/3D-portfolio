# نتایج فشرده‌سازی مدل‌ها با Draco

## خلاصه نتایج

تمام 4 مدل GLB با موفقیت با استفاده از فشرده‌سازی Draco بهینه شدند.

### نتایج فشرده‌سازی:

| فایل | حجم اصلی | حجم فشرده | کاهش حجم |
|------|----------|-----------|----------|
| **hoodie.glb** | 4.61 MB | 0.67 MB | **85.5%** ✅ |
| **t-shirt_low_poly.glb** | 1.89 MB | 0.28 MB | **85.2%** ✅ |
| **white_tshirt_godzilla.glb** | 45.8 MB | 29.19 MB | **36.3%** ⚠️ |
| **hoodie_black.glb** | 49.11 MB | 42.32 MB | **13.8%** ⚠️ |

### کاهش کل حجم:
- **حجم کل قبل:** 101.41 MB
- **حجم کل بعد:** 72.46 MB
- **کاهش کل:** 28.95 MB (28.5%)

## توضیحات

### ✅ فشرده‌سازی عالی (85%+)
- `hoodie.glb` و `t-shirt_low_poly.glb` به طور چشمگیری فشرده شدند
- این مدل‌ها عمدتاً شامل داده‌های هندسی (geometry) بودند که Draco در فشرده‌سازی آن‌ها بسیار موثر است

### ⚠️ فشرده‌سازی متوسط (13-36%)
- `hoodie_black.glb` و `white_tshirt_godzilla.glb` کمتر فشرده شدند
- این مدل‌ها احتمالاً شامل تکسچرهای بزرگ embedded هستند
- Draco فقط geometry را فشرده می‌کند، نه تکسچرها

## فایل‌های پشتیبان

فایل‌های اصلی در پوشه زیر ذخیره شده‌اند:
```
public/assets/models/backup_original/
```

## توصیه‌های بیشتر برای بهینه‌سازی

برای کاهش بیشتر حجم `hoodie_black.glb` و `white_tshirt_godzilla.glb`:

1. **فشرده‌سازی تکسچرها:**
   - تبدیل تکسچرها به فرمت WebP یا Basis Universal
   - کاهش resolution تکسچرها (مثلاً از 4K به 2K)

2. **جداسازی تکسچرها:**
   - استخراج تکسچرها از GLB
   - فشرده‌سازی جداگانه تکسچرها
   - استفاده از GLTF به جای GLB (با تکسچرهای خارجی)

3. **ابزارهای پیشنهادی:**
   ```bash
   # تبدیل به GLTF با تکسچرهای جدا
   gltf-pipeline -i model.glb -o model.gltf -s
   
   # فشرده‌سازی تکسچرها با gltf-transform
   npm install -g @gltf-transform/cli
   gltf-transform optimize input.glb output.glb --texture-compress webp
   ```

## اسکریپت فشرده‌سازی

اسکریپت `compress_models_draco.bat` برای استفاده مجدد ایجاد شده است.

---
**تاریخ:** 2026-05-14
**ابزار:** gltf-pipeline با Draco compression
