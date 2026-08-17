export type ReportOutputLanguage = "ar" | "en";

export type MigrationReportExport = {
  summary: string;
  total: number;
  migrated: number;
  notMigrated: number;
  migrationRate: number;
  byCountry: Array<{ country: string; count: number }>;
  byCircuitType: Array<{ circuitType: string; count: number }>;
};

export type MigrationReportDocument = {
  language: ReportOutputLanguage;
  direction: "rtl" | "ltr";
  title: string;
  section: string;
  metric: string;
  value: string;
  print: string;
  fileName: string;
  rows: Array<Record<string, string>>;
};

export function migrationReportToRows(report: MigrationReportExport, language: ReportOutputLanguage = "en"): Array<Record<string, string>> {
  const labels = language === "ar"
    ? { summary: "الملخص", totals: "الإجماليات", total: "الإجمالي", migrated: "تم الترحيل", notMigrated: "لم يتم الترحيل", rate: "نسبة الترحيل", country: "الدولة", circuit: "نوع الدائرة" }
    : { summary: "Summary", totals: "Totals", total: "Total", migrated: "Migrated", notMigrated: "Not Migrated", rate: "Migration Rate", country: "Country", circuit: "Circuit Type" };
  return [
    { Section: labels.summary, Metric: labels.summary, Value: report.summary },
    { Section: labels.totals, Metric: labels.total, Value: String(report.total) },
    { Section: labels.totals, Metric: labels.migrated, Value: String(report.migrated) },
    { Section: labels.totals, Metric: labels.notMigrated, Value: String(report.notMigrated) },
    { Section: labels.totals, Metric: labels.rate, Value: `${report.migrationRate}%` },
    ...report.byCountry.map(item => ({ Section: labels.country, Metric: item.country, Value: String(item.count) })),
    ...report.byCircuitType.map(item => ({ Section: labels.circuit, Metric: item.circuitType, Value: String(item.count) })),
  ];
}

export function migrationReportDocument(report: MigrationReportExport | undefined, language: ReportOutputLanguage = "en"): MigrationReportDocument {
  const arabic = language === "ar";
  return {
    language,
    direction: arabic ? "rtl" : "ltr",
    title: arabic ? "تقرير ترحيل IMCAN" : "IMCAN Migration Report",
    section: arabic ? "القسم" : "Section",
    metric: arabic ? "المؤشر" : "Metric",
    value: arabic ? "القيمة" : "Value",
    print: arabic ? "طباعة / حفظ كـ PDF" : "Print / Save as PDF",
    fileName: `imcan-migration-report-${language}.pdf`,
    rows: migrationReportToRows(report ?? { summary: "", total: 0, migrated: 0, notMigrated: 0, migrationRate: 0, byCountry: [], byCircuitType: [] }, language),
  };
}
