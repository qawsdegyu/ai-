# Standalone Excel export validation

تم فتح `router-search.html` بعد استيراد بيانات Excel، وظهرت زران: `Export all Excel` و`Export filtered Excel`.

تم إدخال المرشح `Jordan`، فظهر جدول بثلاثة سجلات. عند الضغط على `Export filtered Excel` ظهرت رسالة نجاح مرئية: `3 rows exported to Excel successfully.` وتم إنشاء تنزيل ملف `imkan-filtered-inventory.xlsx` من خلال `XLSX.writeFile`.

التصدير الكامل يستخدم الملف `imkan-inventory.xlsx`، والتصدير المفلتر يستخدم `imkan-filtered-inventory.xlsx`. كلاهما يحتوي أعمدة Router Name وCountry وCity وSite ID وMigration Status وCircuit Type وSource.

تم فتح صفحة تنزيلات المتصفح وظهرت الملفات فعلياً: `imkan-inventory.xlsx` و`imkan-filtered-inventory.xlsx`، وكلاهما مصدره صفحة HTML المحلية.
