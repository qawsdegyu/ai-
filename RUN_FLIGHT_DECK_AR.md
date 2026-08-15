# تشغيل Flight Deck على Windows

هذه النسخة تحتوي على إصلاح مسار إجابات OneDrive في `server/ai2.ts`. أصبح سياق البحث يضم عنوان الخلية بصيغة مباشرة مثل `[C2]` و`[G2]`، ويضم الصف الكامل عند العثور على Country وCity حتى يستطيع المساعد إرجاع RouterName وSite ID من الخلايا الصحيحة.

## المتطلبات

ثبّت Node.js إصدار 20 أو أحدث، وثبّت pnpm عبر `npm install -g pnpm`. يجب أن يكون لديك اتصال Microsoft OneDrive واتصال Supabase صالحان.

## التشغيل

افتح PowerShell داخل مجلد المشروع وشغّل:

```powershell
pnpm install
Copy-Item .env.example .env
notepad .env
pnpm check
pnpm dev
```

افتح بعد ذلك `http://localhost:3000`.

## إعداد `.env`

ضع القيم الفعلية في `.env` على جهازك فقط. لا ترفع `.env` إلى GitHub ولا ترسله في المحادثة. يجب إعداد `DATABASE_URL`، وبيانات Supabase، وبيانات Microsoft OAuth، و`JWT_SECRET`. يجب أيضًا ضبط `OAUTH_SERVER_URL` إذا كان نظام تسجيل الدخول في بيئتك يعتمد عليه.

## اختبار الإجابة

بعد تسجيل الدخول وربط OneDrive، أعد فهرسة الملف من **Data Control**، ثم اسأل AI Copilot:

```text
في ورقة Inventory من ملف IMCAN-Reference-Sheet---2024 (1).xlsm: ما قيمة RouterName في الصف الذي فيه Country = CANADA وCity = MONTREAL؟ وما قيمة Site ID؟ اذكر الخلية لكل قيمة.
```

الإجابة المرجعية الموجودة في الملف هي `RouterName = PYUL502` في الخلية `C2`، و`Site ID = YULXSSV` في الخلية `G2`، من ورقة `Inventory`.

## ملاحظات مهمة

إذا ظهرت رسالة `fileMeta is not defined`، فهذا يعني أن الخادم يعمل بنسخة قديمة من `server/ai2.ts`. أوقف الخادم، تأكد من أن مجلد التشغيل هو مجلد هذه الحزمة، ثم شغّل `pnpm dev` من جديد. لا تُضمّن ملف `.env` الحقيقي داخل أي نسخة ترسلها إلى شخص آخر.
