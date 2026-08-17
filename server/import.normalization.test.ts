import { describe, expect, it } from "vitest";
import { normalizeImport } from "./routers";

describe("Excel import normalization", () => {
  it("maps NewInventory headers to the inventory contract", () => {
    const [record] = normalizeImport("NewInventory", [{ "Versa Router Name": "VAPAMM001", "SITE ID": "PAMM315", "Subnet IP": "10.0.0.0/24", Country: "Jordan", City: "Amman", "Operational hours": "09:00-17:00" }]);
    expect(record).toMatchObject({ routerName: "VAPAMM001", siteId: "PAMM315", subnetIp: "10.0.0.0/24", country: "Jordan", city: "Amman", operationalHours: "09:00-17:00", migrationStatus: "Migrated" });
  });

  it("maps Reference host names as Not Migrated until matching is recalculated", () => {
    const [record] = normalizeImport("Reference", [{ "Host Name": "AMMKASV", IP: "10.1.1.1", Rack: "R1" }]);
    expect(record).toMatchObject({ routerName: "AMMKASV", subnetIp: "10.1.1.1", rack: "R1", migrationStatus: "Not Migrated" });
  });
});
