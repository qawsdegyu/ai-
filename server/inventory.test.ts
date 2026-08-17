import { describe, expect, it } from "vitest";
import { filterInventory, inventory, inventoryStats } from "./inventory";

describe("inventory migration matching", () => {
  it("assigns only the required literal migration statuses", () => {
    expect(inventory.length).toBeGreaterThan(0);
    expect(inventory.every(item => item.migrationStatus === "Migrated" || item.migrationStatus === "Not Migrated")).toBe(true);
    expect(inventory.some(item => item.migrationStatus === "Migrated")).toBe(true);
  });

  it("searches across router and operational fields", () => {
    const first = inventory.find(item => item.routerName);
    expect(first).toBeDefined();
    const results = filterInventory({ search: first!.routerName });
    expect(results.some(item => item.routerName === first!.routerName)).toBe(true);
  });

  it("applies status and country filters", () => {
    const migrated = filterInventory({ migrationStatus: "Migrated" });
    expect(migrated.every(item => item.migrationStatus === "Migrated")).toBe(true);
    const country = inventory.find(item => item.country)?.country;
    if (country) {
      const results = filterInventory({ country });
      expect(results.every(item => item.country === country)).toBe(true);
    }
  });

  it("keeps statistics internally consistent", () => {
    const stats = inventoryStats();
    expect(stats.total).toBe(stats.migrated + stats.notMigrated);
    expect(stats.countries.reduce((sum, item) => sum + item.count, 0)).toBe(stats.total);
  });
});
