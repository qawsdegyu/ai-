import { beforeEach, describe, expect, it, vi } from "vitest";
import { getDb } from "./db";
import { deleteConversation, listUserConversations, matchesConversationView, ownsConversation, setConversationArchived } from "./aiHistory";

vi.mock("./db", () => ({ getDb: vi.fn() }));
const mockedGetDb = vi.mocked(getDb);

describe("AI conversation ownership and lifecycle", () => {
  beforeEach(() => mockedGetDb.mockReset());

  it("allows only the owning user to access a conversation", () => {
    expect(ownsConversation({ userId: 7 }, 7)).toBe(true);
    expect(ownsConversation({ userId: 7 }, 8)).toBe(false);
    expect(ownsConversation(null, 7)).toBe(false);
  });

  it("separates active and archived conversations", () => {
    expect(matchesConversationView({ archivedAt: null }, false)).toBe(true);
    expect(matchesConversationView({ archivedAt: new Date() }, false)).toBe(false);
    expect(matchesConversationView({ archivedAt: new Date() }, true)).toBe(true);
    expect(matchesConversationView({ archivedAt: null }, true)).toBe(false);
  });

  it("archives and restores only the owned conversation", async () => {
    const conversation = { id: 11, userId: 7, archivedAt: null };
    const updates: Array<Record<string, unknown>> = [];
    const db = {
      select: () => ({ from: () => ({ where: () => ({ limit: async () => [conversation] }) }) }),
      update: () => ({ set: (values: Record<string, unknown>) => ({ where: async () => { updates.push(values); } }) }),
    };
    mockedGetDb.mockResolvedValue(db as never);
    await setConversationArchived(7, 11, true);
    await setConversationArchived(7, 11, false);
    expect(updates).toHaveLength(2);
    expect(updates[0].archivedAt).toBeInstanceOf(Date);
    expect(updates[1].archivedAt).toBeNull();
  });

  it("deletes conversation messages and the conversation after ownership validation", async () => {
    const deletes: string[] = [];
    const db = {
      select: () => ({ from: () => ({ where: () => ({ limit: async () => [{ id: 12, userId: 7 }] }) }) }),
      delete: () => ({ where: async () => { deletes.push("delete"); } }),
    };
    mockedGetDb.mockResolvedValue(db as never);
    await deleteConversation(7, 12);
    expect(deletes).toEqual(["delete", "delete"]);
  });

  it("requests separate active and archived views", async () => {
    const whereCalls: unknown[] = [];
    const db = {
      select: () => ({ from: () => ({ where: (scope: unknown) => { whereCalls.push(scope); return { orderBy: async () => [{ id: 1 }] }; } }) }),
    };
    mockedGetDb.mockResolvedValue(db as never);
    await listUserConversations(7, false);
    await listUserConversations(7, true);
    expect(whereCalls).toHaveLength(2);
  });
});
