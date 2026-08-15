import { describe, expect, it } from "vitest";
import { isValidReportDateRange, toReportDateRange } from "../shared/reportFilters";

describe("migration report date filters", () => {
  it("creates inclusive ISO boundaries for a selected date range", () => {
    expect(toReportDateRange("2026-08-01", "2026-08-14")).toEqual({
      from: "2026-08-01T00:00:00.000Z",
      to: "2026-08-14T23:59:59.999Z",
    });
  });

  it("rejects a range whose start is after its end", () => {
    expect(isValidReportDateRange("2026-08-15", "2026-08-14")).toBe(false);
    expect(isValidReportDateRange("2026-08-14", "2026-08-15")).toBe(true);
    expect(isValidReportDateRange("", "2026-08-15")).toBe(true);
  });
});
