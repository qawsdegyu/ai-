import { filterInventory, type InventoryRecord } from "./inventory";
import { getStoredInventory } from "./inventoryDb";

export type ReportLanguage = "ar" | "en";

export function buildMigrationReport(rows: InventoryRecord[], language: ReportLanguage = "en") {
  const migrated = rows.filter(row => row.migrationStatus === "Migrated").length;
  const notMigrated = rows.filter(row => row.migrationStatus === "Not Migrated").length;
  const byCountry = Object.entries(rows.reduce<Record<string, number>>((acc, row) => {
    const country = row.country || "Unknown";
    acc[country] = (acc[country] ?? 0) + 1;
    return acc;
  }, {})).sort((a, b) => b[1] - a[1]).map(([country, count]) => ({ country, count }));
  const byCircuitType = Object.entries(rows.reduce<Record<string, number>>((acc, row) => {
    const circuitType = row.circuitType || "Unknown";
    acc[circuitType] = (acc[circuitType] ?? 0) + 1;
    return acc;
  }, {})).sort((a, b) => b[1] - a[1]).map(([circuitType, count]) => ({ circuitType, count }));
  const migrationRate = rows.length ? Math.round((migrated / rows.length) * 100) : 0;
  return {
    generatedAt: new Date().toISOString(),
    total: rows.length,
    migrated,
    notMigrated,
    migrationRate,
    byCountry,
    byCircuitType,
    summary: language === "ar" ? (rows.length ? `تم ترحيل ${migrationRate}% من أصل ${rows.length} سجلًا. ما زال ${notMigrated} سجلًا بحالة Not Migrated.` : "لا توجد سجلات مخزون متاحة للتحليل.") : (rows.length ? `${migrationRate}% of ${rows.length} records are Migrated. ${notMigrated} records remain Not Migrated.` : "No inventory records are available for analysis."),
  };
}

export async function getMigrationReport(language: ReportLanguage = "en", range: { from?: Date; to?: Date } = {}) {
  const stored = await getStoredInventory(range);
  const hasRange = Boolean(range.from || range.to);
  return buildMigrationReport((stored.length || hasRange ? stored : filterInventory({})) as InventoryRecord[], language);
}
