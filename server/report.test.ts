import { describe, expect, it } from "vitest";
import { buildMigrationReport } from "./report";

describe("migration report", () => {
  it("calculates totals, migration rate, and country distribution from records", () => {
    const report = buildMigrationReport([
      { source: "NewInventory", country: "Jordan", city: "Amman", routerName: "R1", oldRouterName: "", siteId: "S1", subnetIp: "", contactDetails: "", location: "", operationalHours: "", proactiveEmailContacts: "", switchName: "", mcsStatus: "", circuitType: "MPLS", migrationStatus: "Migrated" },
      { source: "Reference", country: "Jordan", city: "Amman", routerName: "R2", oldRouterName: "", siteId: "S2", subnetIp: "", contactDetails: "", location: "", operationalHours: "", proactiveEmailContacts: "", switchName: "", mcsStatus: "", circuitType: "Internet", migrationStatus: "Not Migrated" },
      { source: "Reference", country: "India", city: "Delhi", routerName: "R3", oldRouterName: "", siteId: "S3", subnetIp: "", contactDetails: "", location: "", operationalHours: "", proactiveEmailContacts: "", switchName: "", mcsStatus: "", circuitType: "MPLS", migrationStatus: "Not Migrated" },
    ]);
    expect(report).toMatchObject({ total: 3, migrated: 1, notMigrated: 2, migrationRate: 33 });
    expect(report.byCountry[0]).toEqual({ country: "Jordan", count: 2 });
    expect(report.summary).toContain("33%");
  });

  it("localizes the report summary in Arabic", () => {
    const report = buildMigrationReport([], "ar");
    expect(report.summary).toContain("لا توجد سجلات");
  });
});
