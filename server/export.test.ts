import { describe, expect, it } from "vitest";
import { toCsv } from "../shared/export";

describe("CSV export", () => {
  it("converts rows to quoted CSV format", () => {
    const data = [{ "Router Name": "R1", "City": "Amman" }, { "Router Name": "R2", "City": "Dubai" }];
    expect(toCsv(data)).toBe('Router Name,City\n"R1","Amman"\n"R2","Dubai"');
  });

  it("escapes double quotes in values", () => {
    expect(toCsv([{ "Router Name": 'Router "A"', "City": "London" }])).toContain('"Router ""A"""');
  });
});
