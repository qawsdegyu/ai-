export type ReportAction = "csv" | "excel" | "pdf" | "print";

export function reportSuccessMessage(action: ReportAction, language: "ar" | "en" = "en") {
  if (language === "ar") {
    return {
      csv: "تم تنزيل تقرير CSV بنجاح.",
      excel: "تم تنزيل تقرير Excel بنجاح.",
      pdf: "تم تنزيل تقرير PDF بنجاح.",
      print: "تم فتح نسخة الطباعة بنجاح.",
    }[action];
  }
  return {
    csv: "Migration CSV downloaded successfully.",
    excel: "Migration Excel downloaded successfully.",
    pdf: "Migration PDF downloaded successfully.",
    print: "Print-ready report opened successfully.",
  }[action];
}
