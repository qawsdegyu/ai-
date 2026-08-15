# مواصفات تنفيذ منصة IMCAN Inventory Hub

## طريقة الاستخدام

انسخ محتوى هذا المستند كاملاً إلى AI آخر واطلب منه تنفيذ المشروع على مراحل. يجب على AI المنفذ ألا يكتفي بإنشاء واجهة شكلية، بل يبني تطبيقاً عملياً يحتوي على قاعدة بيانات، استيراد Excel، بحث وفلاتر، تقارير، صلاحيات، سجل نشاط، ومساعد ذكي grounded على بيانات المخزون.

---

# Prompt التنفيذ

أنت مهندس برمجيات Full-Stack ومصمم منتجات داخلية. ابنِ منصة داخلية باسم **IMCAN Inventory Hub** لفريق **Imkan Team** لإدارة بيانات أجهزة الشبكات والراوترات ومتابعة حالة الترحيل بين ملفات Excel.

المنصة ليست موقعاً تسويقياً؛ هي لوحة عمليات داخلية responsive تعمل على سطح المكتب والجوال، وتستخدم تصميم SITA/aviation أخضر احترافي مع مساحة بيضاء، بطاقات واضحة، جداول عملية، حالات تحميل، ورسائل نجاح وفشل صريحة.

## 1. الهدف التجاري

الهدف هو استبدال التعامل اليدوي مع ملفي Excel بلوحة تشغيل واحدة. يجب أن يستطيع الموظف البحث عن Router Name أو Site ID أو الدولة أو المدينة، معرفة حالة الترحيل، استيراد ملفات NewInventory وReference، مشاهدة تقارير تحليلية، تصدير النتائج، طرح أسئلة للمساعد الذكي، والعودة إلى المحادثات السابقة. يجب أن يستطيع المسؤول إدارة الأدوار ومراجعة سجل النشاط.

يجب اعتبار بيانات Excel مصدر البيانات التشغيلي، وعدم اختراع سجلات أو تقييمات أو تعليقات مستخدمين. إذا لم توجد بيانات، اعرض حالة فارغة واضحة بدلاً من بيانات وهمية.

## 2. التقنية المقترحة

استخدم واحدة من البنيتين التاليتين، مع تفضيل البنية الأولى:

| الطبقة | الاختيار المفضل |
|---|---|
| Frontend | React 19 + TypeScript + Vite |
| Styling | Tailwind CSS مع tokens مخصصة وهوية SITA الخضراء |
| Components | shadcn/ui أو مكونات accessible مكافئة |
| Backend | Node.js + Express + tRPC |
| Database | PostgreSQL عبر Supabase أو MySQL/TiDB؛ اختر واحداً فقط ولا تخلط ORM مع Supabase REST عشوائياً |
| Excel | SheetJS / xlsx للقراءة والإنشاء |
| PDF | jsPDF أو مكتبة PDF مناسبة |
| Tests | Vitest، مع اختبارات وحدات وتكامل |
| Auth | Manus OAuth إن كان متوفراً، أو Supabase Auth إذا كان Supabase هو مصدر الهوية |
| AI | LLM grounded context لا يجيب من خارج بيانات المخزون عند السؤال عن أرقام أو راوترات |

إذا استخدمت Supabase، خزّن `VITE_SUPABASE_URL` و`VITE_SUPABASE_ANON_KEY` في environment variables. لا تضع `service_role` في المتصفح أو داخل صفحات HTML. القراءة عبر anon لا تعمل إلا إذا كانت الجداول موجودة وسياسات RLS تسمح بها.

## 3. بنية البيانات

أنشئ الجداول التالية. أسماء SQL يمكن أن تكون snake_case، لكن عقود TypeScript يجب أن تستخدم أسماء واضحة.

### users

الحقول: `id`، `open_id` أو Supabase user id، `name`، `email`، `login_method`، `role` بقيم `user/admin`، `created_at`، `updated_at`، `last_signed_in`.

### inventory_records

يجب أن يدعم الحقول التالية:

| الحقل | الوصف |
|---|---|
| `source` | NewInventory أو Reference |
| `country` | الدولة |
| `city` | المدينة |
| `router_name` | اسم الراوتر، وهو مفتاح مطابقة الترحيل |
| `old_router_name` | الاسم القديم إن وجد |
| `site_id` | معرف الموقع |
| `subnet_ip` | الشبكة أو العنوان |
| `contact_details` | معلومات الاتصال |
| `location` | الموقع التفصيلي |
| `operational_hours` | ساعات التشغيل |
| `proactive_email_contacts` | جهات الاتصال البريدية |
| `switch_name` | اسم السويتش |
| `mcs_status` | حالة MCS |
| `circuit_type` | نوع الدائرة |
| `migration_status` | Migrated أو Not Migrated |
| `serial_number` | الرقم التسلسلي |
| `from_product_id` | المنتج السابق |
| `rack` | الراك |
| `port` | المنفذ |
| `vlan` | VLAN |
| `to_vlan` | VLAN الجديدة |
| `created_at/updated_at` | التوقيتان |

أضف فهارس على `router_name`، `site_id`، `country`، `migration_status`، `source`، و`created_at`.

### audit_logs

الحقول: `id`، `user_id`، `user_name`، `action`، `entity_type`، `entity_id`، `summary`، `metadata` JSON، `created_at`.

سجّل على الأقل: `IMPORT_REPLACE`، `ROLE_UPDATE`، `CONVERSATION_ARCHIVE`، `CONVERSATION_RESTORE`، `CONVERSATION_DELETE`، و`EXPORT_REPORT`.

### ai_conversations

الحقول: `id`، `user_id`، `title`، `created_at`، `updated_at`، `archived_at`. اعتبر المحادثة نشطة عندما تكون `archived_at IS NULL`، ومؤرشفة عندما تحتوي `archived_at` على قيمة.

### ai_messages

الحقول: `id`، `conversation_id`، `user_id`، `role` بقيم `user/assistant`، `content`، `created_at`.

ضع foreign keys وفهارس على owner/conversation/timestamps. لا تسمح لأي مستخدم بقراءة محادثة مستخدم آخر.

## 4. منطق استيراد Excel

أنشئ صفحة **Import Center** بحقلين منفصلين:

1. NewInventory workbook.
2. Reference workbook.

اقبل الامتدادات `.xlsx` و`.xlsm`. استخدم SheetJS لقراءة الملف داخل الخادم أو داخل المتصفح حسب البنية المختارة، لكن في التطبيق الإنتاجي يفضّل رفع الملف إلى الخادم والتحقق منه قبل الكتابة إلى قاعدة البيانات.

اختيار الأوراق:

| نوع الملف | الورقة المفضلة |
|---|---|
| NewInventory | `Inventory` |
| Reference | `Major Router Info` |
| عند عدم وجود الورقة | استخدم أول ورقة مع تحذير واضح |

طبّع أسماء الأعمدة بإزالة المسافات والرموز وتحويلها إلى صيغة قابلة للمطابقة. طابق عمود `Router Name` بعد `trim` و`lowercase`. إذا كان Router Name موجوداً في NewInventory فالحالة `Migrated`، وإلا فالحالة `Not Migrated`.

عملية الاستيراد يجب أن تكون استبدالاً ذرياً للمصدر نفسه، لا أن تحذف مصدر الملف الآخر. قبل الحفظ تحقّق من الأعمدة المطلوبة، وأظهر أخطاء مثل:

- Unsupported file type.
- Empty workbook.
- Required sheet missing.
- Column mismatch.
- Upload failed.
- No valid Router Name rows.

بعد نجاح الاستيراد أعد حساب Migration Status، سجّل audit log، وأرسل notification/toast نجاح يتضمن اسم الملف وعدد السجلات.

## 5. الصفحات المطلوبة

### Overview

اعرض أرقاماً مباشرة: إجمالي السجلات، Migrated، Not Migrated، عدد الدول، ونسبة الترحيل. أضف روابط واضحة إلى البحث، التحليلات، الاستيراد، المساعد، وإدارة المستخدمين.

### Router Search

أنشئ جدولاً يحتوي Router Name، Country/City، Site ID، Migration Status، Circuit Type. أضف:

- بحث فوري في Router Name وSite ID والدولة والمدينة.
- فلتر Migration Status.
- اقتراحات ذكية أثناء الكتابة من القيم الموجودة فقط.
- نافذة تفاصيل opaque وغير شفافة تحتوي الحقول الكاملة.
- حالات loading، empty، error.
- زر `Export all Excel`.
- زر `Export filtered Excel`.
- رسالة نجاح واضحة بعد التنزيل، ورسالة مناسبة إذا لم توجد صفوف.

### Migration Analytics

اعرض تحليلات مبنية على البيانات الفعلية فقط:

- Total.
- Migrated.
- Not Migrated.
- Migration Rate.
- Country Distribution.
- Circuit Type Distribution.
- Migration Status Distribution.
- Audit Trail.

أضف تصفية زمنية `from date` و`to date` مع التحقق من أن البداية ليست بعد النهاية، وأعد تحميل التقرير بعد تغيير الفترة. وفّر CSV وExcel وPDF وPrint View، مع عناوين عربية وإنجليزية ودعم RTL عند اختيار العربية.

### Import Center

اعرض حقلي الملفين، تحقق الأعمدة، حالة العملية، عدد السجلات، المصدر، وقت آخر استيراد، ورسالة خطأ قابلة للفهم.

### AI Assistant

أنشئ محادثة ثنائية اللغة بالعربية والإنجليزية. قبل إرسال السؤال، استخرج سياقاً محدوداً من قاعدة البيانات يتضمن الصفوف ذات الصلة والإحصائيات. يجب أن يجيب المساعد عن:

- البحث عن Router Name.
- حالة Migration.
- Site ID والدولة والمدينة.
- ملخصات الترحيل.
- تفسير الحقول.
- إنشاء تقرير مختصر.

لا تجعل النموذج يخترع سجلات أو أرقاماً. إذا لم يجد بيانات، يقول بوضوح إنه لم يجد نتيجة مطابقة. أظهر مصادر الإجابة مثل Router Name وSite ID. أضف loading animation، retry، وحالة فشل آمنة.

### Conversation History

أضف New Conversation، قائمة Previous Conversations، Active، Archived، Archive، Restore، Delete. يجب إظهار confirmation dialog قبل الحذف. اعزل النتائج حسب المستخدم، ولا تخلط المحادثات المؤرشفة مع النشطة.

### Admin Users

هذه الصفحة للمسؤول فقط. اعرض المستخدمين، البريد، الدور، آخر دخول، وأزرار تغيير role. عند تغيير الدور سجّل `ROLE_UPDATE` مع actor والهدف والقيمة القديمة والجديدة.

## 6. الصلاحيات والأمان

أنشئ `adminProcedure` أو middleware مكافئاً. لا تعتمد على إخفاء زر Admin فقط؛ يجب حماية المسار في الخادم أيضاً.

طبّق القواعد التالية:

| العملية | user | admin |
|---|---:|---:|
| قراءة المخزون | نعم | نعم |
| استيراد Excel | لا | نعم |
| تعديل الأدوار | لا | نعم |
| قراءة سجل النشاط | حسب السياسة | نعم |
| قراءة محادثاته | نعم | نعم |
| قراءة محادثة مستخدم آخر | لا | حسب سياسة الإدارة |
| حذف محادثته | نعم بعد تأكيد | نعم |

إذا استُخدم Supabase، فعّل RLS على كل الجداول. لا تستخدم service_role في React أو standalone HTML. إذا استُخدم Manus OAuth، نفّذ عمليات Supabase من خادم موثوق ومرّر هوية المستخدم بطريقة موثوقة؛ لا تفترض أن `auth.uid()` متاح لمستخدم Manus ما لم يتم ربط نظامي الهوية صراحة.

## 7. عقود API المقترحة

أنشئ procedures أو endpoints typed بهذه الوظائف:

```text
inventory.list({ query?, status?, country?, from?, to? })
inventory.getById({ id })
inventory.import({ source, file })
inventory.suggestions({ field, query })
reports.migration({ from?, to?, language })
reports.exportPayload({ filters, language })
audit.list({ userId?, action?, from?, to? })
admin.users.list()
admin.users.updateRole({ userId, role })
ai.conversations.list({ archived? })
ai.conversations.create({ title? })
ai.conversations.archive({ id })
ai.conversations.restore({ id })
ai.conversations.delete({ id, confirmed: true })
ai.messages.list({ conversationId })
ai.ask({ conversationId?, question, language? })
```

كل procedure يجب أن يتحقق من الإدخال ويعيد أخطاء typed. لا تستخدم Axios أو fetch عشوائي في React إذا كان المشروع tRPC؛ استخدم عقد tRPC موحداً.

## 8. التصدير

استخدم البيانات المفلترة نفسها الموجودة في الواجهة، وليس كل البيانات بالخطأ. يجب أن يتضمن Excel وCSV الأعمدة: Router Name، Country، City، Site ID، Migration Status، Circuit Type، Source. سمِّ الملفات مثلاً:

```text
imkan-inventory.xlsx
imkan-filtered-inventory.xlsx
imkan-migration-report-ar.pdf
imkan-migration-report-en.pdf
```

بعد إنشاء الملف، أظهر toast نجاحاً يذكر عدد الصفوف. إذا كانت النتيجة فارغة، لا تنشئ ملفاً فارغاً بصمت؛ اعرض رسالة للمستخدم.

## 9. تصميم الواجهة

استخدم هوية SITA Green:

- خلفية عامة فاتحة مائلة إلى الأخضر.
- Sidebar ثابتة للتطبيق الداخلي.
- أخضر داكن للعناوين الرئيسية.
- أخضر فاتح لحالات Migrated.
- ذهبي/كهرماني لحالة Not Migrated.
- بطاقات ذات ظل ناعم بدلاً من حدود ثقيلة.
- dialogs بخلفية opaque، نص واضح، وcontrast كافٍ.
- واجهة responsive.
- aria-labels وfocus states وkeyboard navigation.
- احترام `prefers-reduced-motion`.

لا تستخدم modal شفافة تجعل محتوى الصفحة يظهر خلفها. لا تنشئ روابط داخل روابط. لا تنشئ Select.Item بقيمة فارغة.

## 10. الاختبارات المطلوبة

اكتب Vitest tests قبل التسليم، وتشمل:

1. تطبيع أسماء الأعمدة.
2. اختيار ورقة Inventory وMajor Router Info.
3. رفض ملف فارغ أو امتداد غير مدعوم.
4. مطابقة Router Name واحتساب Migrated/Not Migrated.
5. تصفية التقرير بالتاريخ والتحقق من نطاق غير صالح.
6. حساب توزيع Country وCircuit Type.
7. بناء صفوف التقرير بالعربية والإنجليزية.
8. إنشاء payload للطباعة وPDF.
9. تصدير كل البيانات والبيانات المفلترة.
10. صلاحيات user/admin.
11. عزل محادثات المستخدمين.
12. فصل Active عن Archived.
13. عدم حذف المحادثة عند إلغاء confirmation.
14. الحذف بعد التأكيد فقط.
15. تسجيل import وrole update وexport في audit log.
16. حالات Supabase 401/403 وRLS وempty table.

نفّذ:

```bash
pnpm check
pnpm test
```

ولا تعتبر العمل منتهياً إذا فشل TypeScript أو بقيت أخطاء console أو إذا كانت إحدى الصفحات تعرض بيانات ثابتة بعد الاستيراد.

## 11. خطة التنفيذ

نفّذ المشروع بهذا الترتيب:

### المرحلة الأولى: الأساس

أنشئ المشروع، المصادقة، قاعدة البيانات، schema، migrations، layout، Sidebar، design tokens، وtodo.md.

### المرحلة الثانية: المخزون والاستيراد

أنشئ inventory_records، import center، parsing، normalization، migration calculation، validation، audit logging، واختبارات Excel.

### المرحلة الثالثة: البحث والتحليلات

اربط Router Search وOverview وMigration Analytics بالبيانات الحقيقية، ثم أضف الفلاتر الزمنية والتصدير.

### المرحلة الرابعة: AI والمحادثات

أضف grounded retrieval، الرسائل، history، archive/restore/delete، confirmation، loading، bilingual output، واختبارات الملكية.

### المرحلة الخامسة: الإدارة والجودة

أضف Admin Users وRLS وrole management وaudit filters، ثم نفّذ الفحص والاختبارات والتحقق البصري.

### المرحلة السادسة: التسليم

أنشئ README يشرح التشغيل، environment variables، schema، استيراد الملفات، الحساب الإداري الأول، وحدود Supabase Auth. احفظ checkpoint بعد مراجعة todo.md والتأكد أن البنود المكتملة معلّمة `[x]`.

## 12. معايير القبول النهائية

يُقبل المشروع عندما يستطيع مستخدم مصادق عليه البحث في بيانات فعلية، ويستطيع المسؤول رفع ملفي Excel وتحديث السجلات دون حذف المصدر الآخر، وتُحسب Migration Status من Router Name، وتتغير المؤشرات والتوزيعات فوراً، وتعمل فلاتر التاريخ، ويُنزّل Excel/PDF/CSV صحيحاً، ويحصل AI على إجابات grounded، وتُحفظ المحادثات بأمان، ويُسجل النشاط، وتعمل صفحات HTML المستقلة عند الحاجة دون كشف service_role.

لا تعتبر بيانات العرض الثابتة بديلاً عن قاعدة البيانات. استخدم بيانات Excel الفعلية أو اعرض empty state واضحاً.

---

# ملاحظات خاصة بمشروع Supabase الفارغ

قبل تشغيل الواجهة، نفّذ ملف `supabase-init.sql` في SQL Editor. بعد نجاح التنفيذ، تحقق من ظهور `inventory_records` و`users` و`audit_logs` و`ai_conversations` و`ai_messages`.

إذا أردت استخدام الصفحات HTML المستقلة مباشرة من الجهاز، يمكنها القراءة من `inventory_records` عبر Supabase REST باستخدام anon فقط إذا سمحت RLS بالقراءة. أما الرفع والتعديل وسجل النشاط والمساعد الذكي فمن الأفضل تنفيذها في backend موثوق، لأن HTML المحلي لا يستطيع حماية الأسرار ولا فرض صلاحيات الإدارة بشكل آمن.

إذا أعدت بناء المشروع باستخدام Manus OAuth، لا تخلط جدول `users` الخاص بـManus مع `auth.users` الخاص بـSupabase دون خطة ربط واضحة. المسار الأكثر أماناً هو إبقاء Manus OAuth في التطبيق الأساسي، وتنفيذ استدعاءات Supabase من الخادم باستخدام إعدادات آمنة، أو الانتقال الكامل إلى Supabase Auth.
