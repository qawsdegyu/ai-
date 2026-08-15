import { describe, expect, it } from "vitest";
import { toCsv } from "./export";

describe("CSV export", () => {
  it("converts rows to quoted CSV format", () => {
    const data = [{ "Router Name": "R1", "City": "Amman" }, { "Router Name": "R2", "City": "Dubai" }];
    const csv = toCsv(data);
    expect(csv).toBe('Router Name,City\n"R1","Amman"\n"R2","Dubai"');
  });

  it("escapes double quotes in values", () => {
    const data = [{ "Router Name": 'Router "A"', "City": "London" }];
    const csv = toCsv(data);
    expect(csv).toContain('"Router ""A"""');
  });
});
