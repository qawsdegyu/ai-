import { describe, expect, it } from "vitest";
import { missingImportColumns } from "../shared/importValidation";

describe("import column validation", () => {
  it("reports missing NewInventory columns", () => {
    expect(missingImportColumns("NewInventory", ["City"])).toEqual(["Versa Router Name", "SITE ID"]);
  });

  it("accepts a valid Reference header set", () => {
    expect(missingImportColumns("Reference", ["Host Name", "Country", "City"])).toEqual([]);
  });
});
