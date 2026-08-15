import seed from "./inventory-seed.json";

export const FIELD_LABELS = {
  country: "Country",
  city: "City",
  routerName: "Router Name",
  oldRouterName: "Old Router Name",
  siteId: "Site ID",
  subnetIp: "Subnet IP",
  contactDetails: "Contact Details",
  location: "Location",
  operationalHours: "Operational Hours",
  migrationStatus: "Migration Status",
  proactiveEmailContacts: "Proactive Email Contacts",
  switchName: "Switch Name",
  mcsStatus: "MCS Status",
} as const;

export type InventoryRecord = {
  source: string;
  country: string;
  city: string;
  routerName: string;
  oldRouterName: string;
  siteId: string;
  subnetIp: string;
  contactDetails: string;
  location: string;
  operationalHours: string;
  proactiveEmailContacts: string;
  switchName: string;
  mcsStatus: string;
  circuitType: string;
  migrationStatus: "Migrated" | "Not Migrated";
  serialNumber?: string;
  fromProductId?: string;
  rack?: string;
  port?: string;
  vlan?: string;
  toVlan?: string;
};

const raw = seed as { newInventory: InventoryRecord[]; reference: InventoryRecord[] };
const migratedNames = new Set(raw.newInventory.map(item => item.routerName.trim().toLowerCase()).filter(Boolean));

export const inventory: InventoryRecord[] = [
  ...raw.newInventory.map(item => ({ ...item, migrationStatus: "Migrated" as const })),
  ...raw.reference.map(item => ({
    ...item,
    migrationStatus: migratedNames.has(item.routerName.trim().toLowerCase()) ? "Migrated" as const : "Not Migrated" as const,
  })),
];

export function filterInventory(input: { search?: string; country?: string; city?: string; migrationStatus?: string; circuitType?: string }) {
  const search = (input.search ?? "").trim().toLowerCase();
  return inventory.filter(item => {
    const haystack = Object.values(item).join(" ").toLowerCase();
    return (!search || haystack.includes(search))
      && (!input.country || input.country === "all" || item.country === input.country)
      && (!input.city || input.city === "all" || item.city === input.city)
      && (!input.migrationStatus || input.migrationStatus === "all" || item.migrationStatus === input.migrationStatus)
      && (!input.circuitType || input.circuitType === "all" || item.circuitType === input.circuitType);
  });
}

export function inventoryStats() {
  const countries = inventory.reduce<Record<string, number>>((acc, item) => {
    const country = item.country || "Unknown";
    acc[country] = (acc[country] ?? 0) + 1;
    return acc;
  }, {});
  return {
    total: inventory.length,
    migrated: inventory.filter(item => item.migrationStatus === "Migrated").length,
    notMigrated: inventory.filter(item => item.migrationStatus === "Not Migrated").length,
    countries: Object.entries(countries).sort((a, b) => b[1] - a[1]).map(([country, count]) => ({ country, count })),
  };
}

export function inventoryOptions() {
  const unique = (key: keyof InventoryRecord) => Array.from(new Set(inventory.map(item => String(item[key] ?? "").trim()).filter(Boolean))).sort();
  return { countries: unique("country"), cities: unique("city"), circuitTypes: unique("circuitType"), routerNames: unique("routerName"), siteIds: unique("siteId"), labels: FIELD_LABELS };
}
