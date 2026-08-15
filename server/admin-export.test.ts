import { describe, expect, it } from "vitest";
import * as XLSX from "xlsx";
import { buildRoleAuditEntry } from "./adminDb";
import { inventoryToExcelBuffer } from "../shared/export";

describe("admin role and Excel export contracts", () => {
  it("builds a role update audit payload with before and after roles", () => {
    const entry = buildRoleAuditEntry(9, "Operator", "user", "admin", { id: 1, name: "Owner" });
    expect(entry).toMatchObject({ userId: 1, action: "ROLE_UPDATE", entityId: 9, summary: "Changed Operator role from user to admin" });
    expect(JSON.parse(entry.metadata)).toEqual({ targetUserId: 9, previousRole: "user", role: "admin" });
  });

  it("creates an Excel workbook with the exact export headers used by the UI", () => {
    const buffer = inventoryToExcelBuffer([{ "Router Name": "R1", "Migration Status": "Migrated" }]);
    const workbook = XLSX.read(buffer, { type: "array" });
    expect(workbook.SheetNames).toEqual(["Inventory"]);
    expect(XLSX.utils.sheet_to_json<Record<string, string>>(workbook.Sheets.Inventory)[0]).toEqual({ "Router Name": "R1", "Migration Status": "Migrated" });
  });
});
