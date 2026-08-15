import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function context(role: "admin" | "user"): TrpcContext {
  return {
    user: { id: 42, openId: "test-user", name: "Test User", email: "test@example.com", loginMethod: "test", role, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => undefined } as TrpcContext["res"],
  };
}

describe("inventory import permissions", () => {
  it("rejects regular users before reading the workbook", async () => {
    const caller = appRouter.createCaller(context("user"));
    await expect(caller.inventory.importExcel({ fileBase64: "dGVzdC1maWxlLWNvbnRlbnQtbG9uZw==", fileName: "inventory.xlsx", sourceType: "NewInventory" })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("rejects regular users from the user-management procedure", async () => {
    const caller = appRouter.createCaller(context("user"));
    await expect(caller.admin.users()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("rejects regular users from admin.updateRole", async () => {
    const caller = appRouter.createCaller(context("user"));
    await expect(caller.admin.updateRole({ userId: 1, role: "admin" })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
