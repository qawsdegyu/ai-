import { describe, expect, it } from "vitest";
import { reportSuccessMessage } from "../shared/reportNotifications";

describe("report download notifications", () => {
  it("returns clear English confirmation messages for every report action", () => {
    expect(reportSuccessMessage("csv")).toContain("CSV");
    expect(reportSuccessMessage("excel")).toContain("Excel");
    expect(reportSuccessMessage("pdf")).toContain("PDF");
    expect(reportSuccessMessage("print")).toContain("opened");
  });

  it("returns Arabic confirmation messages for PDF and print", () => {
    expect(reportSuccessMessage("pdf", "ar")).toContain("تم تنزيل تقرير PDF");
    expect(reportSuccessMessage("print", "ar")).toContain("فتح نسخة الطباعة");
  });
});
