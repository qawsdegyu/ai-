import { describe, expect, it } from "vitest";
import { buildInventoryContext, formatAssistantResponse, noResultsAnswer, requestedLanguageLabel } from "./ai2";
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

  it("formats a successful answer with matched Router Name and Site ID sources", () => {
    const result = formatAssistantResponse("Router R1 is migrated.", [{ routerName: "R1", siteId: "S1", migrationStatus: "Migrated" }]);
    expect(result).toContain("Router R1 is migrated.");
    expect(result).toContain("Sources: R1 (S1)");
  });

  it("returns a safe no-result answer without calling the LLM", async () => {
    const result = noResultsAnswer();
    expect(result.sources).toEqual([]);
    expect(result.answer).toContain("لم أجد");
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
