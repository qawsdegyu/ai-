import { beforeEach, describe, expect, it, vi } from "vitest";
import { getStoredInventory } from "./inventoryDb";
import { getMigrationReport } from "./report";

vi.mock("./inventoryDb", () => ({ getStoredInventory: vi.fn() }));
const mockedGetStoredInventory = vi.mocked(getStoredInventory);

describe("migration report date-range behavior", () => {
  beforeEach(() => mockedGetStoredInventory.mockReset());

  it("passes inclusive date boundaries to stored inventory and reports only returned rows", async () => {
    mockedGetStoredInventory.mockResolvedValue([
      { source: "NewInventory", country: "Jordan", city: "Amman", routerName: "R1", migrationStatus: "Migrated", circuitType: "MPLS" },
    ] as never);
    const from = new Date("2026-08-01T00:00:00.000Z");
    const to = new Date("2026-08-14T23:59:59.999Z");

    const report = await getMigrationReport("en", { from, to });

    expect(mockedGetStoredInventory).toHaveBeenCalledWith({ from, to });
    expect(report).toMatchObject({ total: 1, migrated: 1, notMigrated: 0 });
  });

  it("returns an empty report when a selected range has no stored rows", async () => {
    mockedGetStoredInventory.mockResolvedValue([]);
    const report = await getMigrationReport("en", { from: new Date("2026-08-01T00:00:00.000Z") });
    expect(report).toMatchObject({ total: 0, migrated: 0, notMigrated: 0 });
  });
});
