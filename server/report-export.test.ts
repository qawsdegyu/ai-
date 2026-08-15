import { describe, expect, it } from "vitest";
import { migrationReportDocument, migrationReportToRows } from "../shared/report";

describe("migration report export", () => {
  it("exports summary, totals, country, and circuit breakdowns", () => {
    const rows = migrationReportToRows({
      summary: "84% migrated",
      total: 10,
      migrated: 8,
      notMigrated: 2,
      migrationRate: 80,
      byCountry: [{ country: "Jordan", count: 4 }],
      byCircuitType: [{ circuitType: "MPLS", count: 6 }],
    });
    expect(rows).toContainEqual({ Section: "Summary", Metric: "Summary", Value: "84% migrated" });
    expect(rows).toContainEqual({ Section: "Country", Metric: "Jordan", Value: "4" });
    expect(rows).toContainEqual({ Section: "Circuit Type", Metric: "MPLS", Value: "6" });
  });

  it("fully localizes Arabic report rows", () => {
    const rows = migrationReportToRows({ summary: "تم الترحيل", total: 10, migrated: 8, notMigrated: 2, migrationRate: 80, byCountry: [{ country: "Jordan", count: 4 }], byCircuitType: [] }, "ar");
    expect(rows).toContainEqual({ Section: "الإجماليات", Metric: "تم الترحيل", Value: "8" });
    expect(rows).toContainEqual({ Section: "الإجماليات", Metric: "لم يتم الترحيل", Value: "2" });
    expect(rows).toContainEqual({ Section: "الدولة", Metric: "Jordan", Value: "4" });
  });

  it("builds bilingual PDF and print payload metadata", () => {
    const report = { summary: "84% migrated", total: 10, migrated: 8, notMigrated: 2, migrationRate: 80, byCountry: [], byCircuitType: [] };
    const arabic = migrationReportDocument(report, "ar");
    const english = migrationReportDocument(report, "en");
    expect(arabic).toMatchObject({ direction: "rtl", title: "تقرير ترحيل IMCAN", fileName: "imcan-migration-report-ar.pdf" });
    expect(arabic.rows.some(row => row.Metric === "لم يتم الترحيل")).toBe(true);
    expect(english).toMatchObject({ direction: "ltr", title: "IMCAN Migration Report", fileName: "imcan-migration-report-en.pdf" });
    expect(english.rows.some(row => row.Metric === "Not Migrated")).toBe(true);
  });
});
