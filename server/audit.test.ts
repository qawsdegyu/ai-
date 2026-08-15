import { describe, expect, it } from "vitest";
import { buildAuditEntry } from "./inventoryDb";

describe("audit logging", () => {
  it("creates an import audit entry with actor and change summary", () => {
    const entry = buildAuditEntry({ id: 7, name: "Imkan Admin" }, 12);
    expect(entry).toMatchObject({ userId: 7, userName: "Imkan Admin", action: "IMPORT_REPLACE", entityType: "inventory_records", summary: "Imported and replaced 12 inventory records from Excel" });
    expect(JSON.parse(entry.metadata)).toEqual({ count: 12, scope: "source-replacement" });
  });
});
