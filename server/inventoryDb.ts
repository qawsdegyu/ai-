import { and, desc, eq, gte, inArray, ilike, like, lte, or, sql, not } from "drizzle-orm";
import { getDb } from "./db";
import { auditLogs, inventoryRecords, type InsertInventoryRecord } from "../drizzle/schema";
import { FIELD_LABELS } from "./inventory";

export async function getStoredInventory(range: { from?: Date; to?: Date } = {}) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (range.from) conditions.push(gte(inventoryRecords.createdAt, range.from));
  if (range.to) conditions.push(lte(inventoryRecords.createdAt, range.to));
  return db.select().from(inventoryRecords).where(conditions.length ? and(...conditions) : undefined).orderBy(inventoryRecords.routerName);
}

export const AUDITED_ACTIONS = ["IMPORT_REPLACE"] as const;

export function buildAuditEntry(actor: { id?: number; name?: string | null }, count: number) {
  return { userId: actor.id, userName: actor.name || "Unknown user", action: "IMPORT_REPLACE", entityType: "inventory_records", summary: `Imported and replaced ${count} inventory records from Excel`, metadata: JSON.stringify({ count, scope: "source-replacement" }) };
}

export async function replaceImportedInventory(rows: InsertInventoryRecord[], actor: { id?: number; name?: string | null }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const source = rows[0]?.source;
  if (!source) throw new Error("Import source is required");
  
  if (source === "NewInventory") {
    // Delete all records that have "new" or "migrated" in their source
    await db.delete(inventoryRecords).where(
      or(
        eq(inventoryRecords.source, "NewInventory"),
        ilike(inventoryRecords.source, "%new%"),
        ilike(inventoryRecords.source, "%migrated%")
      )
    );
  } else {
    // Delete all other records (Reference)
    await db.delete(inventoryRecords).where(
      and(
        not(eq(inventoryRecords.source, "NewInventory")),
        not(ilike(inventoryRecords.source, "%new%")),
        not(ilike(inventoryRecords.source, "%migrated%"))
      )
    );
  }

  if (rows.length) await db.insert(inventoryRecords).values(rows);
  const allRows = await db.select().from(inventoryRecords);
  const migratedNames = new Set(allRows.filter(row => row.source === "NewInventory").map(row => row.routerName.trim().toLowerCase()).filter(Boolean));
  const referenceRows = allRows.filter(row => row.source === "Reference");
  for (const row of referenceRows) {
    const status = migratedNames.has(row.routerName.trim().toLowerCase()) ? "Migrated" : "Not Migrated";
    if (row.migrationStatus !== status) await db.update(inventoryRecords).set({ migrationStatus: status }).where(eq(inventoryRecords.id, row.id));
  }
  await db.insert(auditLogs).values(buildAuditEntry(actor, rows.length));
  return { count: rows.length };
}

export async function listAuditLogs(filters: { limit?: number; userName?: string; action?: string } = {}) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (filters.userName && filters.userName !== "all") conditions.push(eq(auditLogs.userName, filters.userName));
  if (filters.action && filters.action !== "all") conditions.push(eq(auditLogs.action, filters.action));
  return db.select().from(auditLogs).where(conditions.length ? and(...conditions) : undefined).orderBy(desc(auditLogs.createdAt)).limit(filters.limit ?? 100);
}

export async function searchStoredInventory(input: { search?: string; country?: string; city?: string; migrationStatus?: string; circuitType?: string }) {
  const db = await getDb();
  if (!db) return [];
  const search = (input.search ?? "").trim();
  const conditions = [];
  if (search) {
    const term = `%${search}%`;
    conditions.push(or(ilike(inventoryRecords.routerName, term), ilike(inventoryRecords.oldRouterName, term), ilike(inventoryRecords.siteId, term), ilike(inventoryRecords.country, term), ilike(inventoryRecords.city, term), ilike(inventoryRecords.contactDetails, term), ilike(inventoryRecords.location, term)));
  }
  if (input.country && input.country !== "all") conditions.push(eq(inventoryRecords.country, input.country));
  if (input.city && input.city !== "all") conditions.push(eq(inventoryRecords.city, input.city));
  if (input.migrationStatus && input.migrationStatus !== "all") conditions.push(eq(inventoryRecords.migrationStatus, input.migrationStatus as "Migrated" | "Not Migrated"));
  if (input.circuitType && input.circuitType !== "all") conditions.push(eq(inventoryRecords.circuitType, input.circuitType));
  return db.select().from(inventoryRecords).where(conditions.length ? and(...conditions) : undefined).orderBy(inventoryRecords.routerName);
}

export async function updateStoredInventoryRecord(id: number, data: Partial<InsertInventoryRecord>) {
  const db = await getDb();
  if (!db) return false;
  await db.update(inventoryRecords).set(data).where(eq(inventoryRecords.id, id));
  return true;
}

export async function addStoredInventoryRecord(data: InsertInventoryRecord) {
  const db = await getDb();
  if (!db) return false;
  await db.insert(inventoryRecords).values(data);
  return true;
}

export async function deleteStoredInventoryRecord(id: number) {
  const db = await getDb();
  if (!db) return false;
  await db.delete(inventoryRecords).where(eq(inventoryRecords.id, id));
  return true;
}

export async function storedInventoryOptions() {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select({ country: inventoryRecords.country, city: inventoryRecords.city, circuitType: inventoryRecords.circuitType, routerName: inventoryRecords.routerName, siteId: inventoryRecords.siteId }).from(inventoryRecords);
  if (!rows.length) return null;
  const unique = (key: "country" | "city" | "circuitType" | "routerName" | "siteId") => Array.from(new Set(rows.map(row => row[key]).filter(Boolean))).sort();
  return { countries: unique("country"), cities: unique("city"), circuitTypes: unique("circuitType"), routerNames: unique("routerName"), siteIds: unique("siteId"), labels: FIELD_LABELS };
}

export async function storedInventoryStats() {
  const db = await getDb();
  if (!db) return null;
  const [total] = await db.select({ count: sql<number>`count(*)` }).from(inventoryRecords);
  const [migrated] = await db.select({ count: sql<number>`count(*)` }).from(inventoryRecords).where(eq(inventoryRecords.migrationStatus, "Migrated"));
  const [notMigrated] = await db.select({ count: sql<number>`count(*)` }).from(inventoryRecords).where(eq(inventoryRecords.migrationStatus, "Not Migrated"));
  const countries = await db.select({ country: inventoryRecords.country, count: sql<number>`count(*)` }).from(inventoryRecords).groupBy(inventoryRecords.country).orderBy(desc(sql`count(*)`));
  const totalCount = Number(total?.count ?? 0);
  if (totalCount === 0) return null;
  return { total: totalCount, migrated: Number(migrated?.count ?? 0), notMigrated: Number(notMigrated?.count ?? 0), countries: countries.map(item => ({ country: item.country || "Unknown", count: Number(item.count) })) };
}
