import { describe, expect, it } from "vitest";
import { buildInventoryContext, buildServiceTemplate, detectAssistantLanguage, formatAssistantResponse, noResultsAnswer, normalizeAssistantText, requestedLanguageLabel } from "./ai2";
import { buildContext } from "./_core/contextBuilder";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function context(role: "admin" | "user"): TrpcContext {
  return {
    user: { id: 42, openId: "ai-test-user", name: "AI Test User", email: "ai@example.com", loginMethod: "test", role, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => undefined } as unknown as TrpcContext["res"],
  };
}

describe("inventory AI assistant", () => {
  it("builds grounded context with exact English field labels", () => {
    const context = buildInventoryContext([{ source: "Reference", country: "Jordan", city: "Amman", routerName: "R1", oldRouterName: "OLD-R1", siteId: "S1", subnetIp: "10.0.0.0/24", contactDetails: "Ops", location: "HQ", operationalHours: "24/7", proactiveEmailContacts: "ops@example.com", switchName: "SW1", mcsStatus: "Primary", circuitType: "MPLS", migrationStatus: "Migrated" }]);
    expect(context[0]).toMatchObject({ "Router Name": "R1", "Site ID": "S1", "Migration Status": "Migrated", Country: "Jordan" });
  });

  it("keeps retrieved Word content and source metadata in compact context", () => {
    const result = buildContext([{ _raw: "[Word item: procedure] [Position: 4]\\nPower cycle the modem.", source_file: "IMCANEUCSheet2024.docx" }], "", "modem procedure");
    expect(result.contextJson).toContain("Power cycle the modem.");
    expect(result.contextJson).toContain("IMCANEUCSheet2024.docx");
  });

  it("builds the Network template with separate address, contact, MCS, and backup fields", () => {
    const result = buildServiceTemplate("Network", {
      source_file: "NewInventory.xlsx",
      source_row_number: 3,
      sheet_name: "Inventory",
      current_versa_router_name: "VAPAMM001",
      full_site_address: "Queen Alia Airport, Amman",
      contact_details: "Contact Name: Ahmed\\nContact Phone: +962",
      operational_hours: "NA",
      remarks: "New SD-WAN Connection",
      row_data: { mcs_pair: "Yes" },
      status: "Primary",
    });
    expect(result.text).toContain("New SD-WAN Connection");
    expect(result.text).toContain("Full site address: Queen Alia Airport, Amman");
    expect(result.text).toContain("Contact details:");
    expect(result.text).toContain("MCS Site: Y");
    expect(result.text).toContain("Backup Available: Y");
    expect(result.text).toContain("Router LEDs status:");
    expect(result.source.filename).toBe("IMCAN-Reference-Sheet---2024-router-updated.xlsm");
    expect(result.source.data_filename).toBe("NewInventory.xlsx");
  });

  it("builds every workbook service template without dropping its required fields", () => {
    const base = {
      source_file: "NewInventory.xlsx",
      source_row_number: 3,
      sheet_name: "Inventory",
      current_versa_router_name: "VAPAMM001",
      full_site_address: "Queen Alia Airport, Amman",
      contact_details: "Contact Name: Ahmed\\nContact Phone: +962",
      operational_hours: "NA",
      remarks: "New SD-WAN Connection",
      row_data: { mcs_pair: "Yes" },
      status: "Primary",
    };
    const required: Record<string, string[]> = {
      Network: ["Issue description:", "Power status on site:", "Router LEDs status:"],
      Incident: ["Asset tag of Faulty Equipment:", "Fault Description:"],
      LAN: ["Issue description:", "Power status on site:"],
      Request: ["Asset tag of Equipment:", "Request Description:"],
      SITATEX: ["SITATEX address or 7 letter codes:", "Incident description / error message:"],
    };
    for (const [service, fields] of Object.entries(required)) {
      const result = buildServiceTemplate(service as any, base);
      expect(result.source.service).toBe(service);
      for (const field of fields) expect(result.text).toContain(field);
      expect(result.text).not.toContain("\\\\n");
    }
  });

  it("uses the language of the question when detecting response language", () => {
    expect(detectAssistantLanguage("Which sheet contains the IMCAN support note?", "ar")).toBe("en");
    expect(detectAssistantLanguage("في أي ورقة توجد ملاحظة دعم IMCAN؟", "en")).toBe("ar");
    expect(detectAssistantLanguage("IMCAN support", "en")).toBe("en");
  });

  it("formats a successful answer with matched Router Name and Site ID sources", () => {
    const result = formatAssistantResponse("Router R1 is migrated.", [{ routerName: "R1", siteId: "S1", migrationStatus: "Migrated" }]);
    expect(result).toContain("Router R1 is migrated.");
    expect(result).toContain("**Source**");
    expect(result).toContain("**Current Versa Router Name:** R1");
    expect(result).toContain("**Site ID:** S1");
  });

  it("normalizes escaped newlines and JSON envelopes into human-readable text", () => {
    const result = normalizeAssistantText('```json\\n{"answer":"**الخلاصة**\\n\\nتم العثور على Router R1."}\\n```');
    expect(result).toBe("**الخلاصة**\n\nتم العثور على Router R1.");
    expect(result).not.toContain("\\n");
    expect(result).not.toContain('"answer"');
  });

  it("returns a safe no-result answer without calling the LLM", async () => {
    const result = noResultsAnswer();
    expect(result.sources).toEqual([]);
    expect(result.answer).toContain("I could not find");
    expect(noResultsAnswer("en").answer).toContain("I could not find");
    expect(requestedLanguageLabel("ar")).toBe("Arabic");
    expect(requestedLanguageLabel("en")).toBe("English");
  });

  it("requires authentication before an employee can ask the assistant", async () => {
    const unauthenticated = context("user");
    unauthenticated.user = null;
    const caller = appRouter.createCaller(unauthenticated);
    await expect(caller.ai.ask({ question: "Where is router R1?" })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});
