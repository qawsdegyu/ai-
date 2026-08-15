import { beforeEach, describe, expect, it, vi } from "vitest";
import { getDb } from "./db";
import { listAuditLogs } from "./inventoryDb";

vi.mock("./db", () => ({ getDb: vi.fn() }));
const mockedGetDb = vi.mocked(getDb);

describe("audit log filters", () => {
  beforeEach(() => mockedGetDb.mockReset());

  it("passes user and action filters into the audit query", async () => {
    const whereScopes: unknown[] = [];
    const db = {
      select: () => ({ from: () => ({ where: (scope: unknown) => { whereScopes.push(scope); return { orderBy: () => ({ limit: async () => [{ id: 1 }] }) }; } }) }),
    };
    mockedGetDb.mockResolvedValue(db as never);

    const logs = await listAuditLogs({ userName: "Abood T", action: "IMPORT_REPLACE" });

    expect(logs).toEqual([{ id: 1 }]);
    expect(whereScopes).toHaveLength(1);
  });

  it("supports the unfiltered audit view", async () => {
    const db = {
      select: () => ({ from: () => ({ where: () => ({ orderBy: () => ({ limit: async () => [] }) }) }) }),
    };
    mockedGetDb.mockResolvedValue(db as never);
    await expect(listAuditLogs()).resolves.toEqual([]);
  });
});
