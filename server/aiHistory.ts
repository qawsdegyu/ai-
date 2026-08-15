import { and, desc, eq, isNull, isNotNull } from "drizzle-orm";
import { aiConversations, aiMessages } from "../drizzle/schema";
import { getDb } from "./db";

export function ownsConversation(conversation: { userId: number } | null | undefined, userId: number) {
  return Boolean(conversation && conversation.userId === userId);
}

export function matchesConversationView(conversation: { archivedAt?: Date | null }, archivedOnly: boolean) {
  return archivedOnly ? Boolean(conversation.archivedAt) : !conversation.archivedAt;
}

export async function createConversation(userId: number, title: string) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const result = await db.insert(aiConversations).values({ userId, title: title.trim().slice(0, 255) || "New AI conversation" }).returning({ id: aiConversations.id });
  const conversationId = result[0].id;
  return { id: conversationId, userId, title: title.trim().slice(0, 255) || "New AI conversation" };
}

export async function appendConversationMessage(userId: number, conversationId: number, role: "user" | "assistant", content: string) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const [conversation] = await db.select().from(aiConversations).where(and(eq(aiConversations.id, conversationId), eq(aiConversations.userId, userId))).limit(1);
  if (!ownsConversation(conversation, userId)) throw new Error("Conversation not found");
  const sanitizedContent = content.replace(/\x00/g, "");
  await db.insert(aiMessages).values({ userId, conversationId, role, content: sanitizedContent });
  await db.update(aiConversations).set({ updatedAt: new Date() }).where(eq(aiConversations.id, conversationId));
  return { success: true } as const;
}

export async function listUserConversations(userId: number, archivedOnly = false) {
  const db = await getDb();
  if (!db) return [];
  const scope = archivedOnly ? and(eq(aiConversations.userId, userId), isNotNull(aiConversations.archivedAt)) : and(eq(aiConversations.userId, userId), isNull(aiConversations.archivedAt));
  return db.select().from(aiConversations).where(scope).orderBy(desc(aiConversations.updatedAt));
}

export async function setConversationArchived(userId: number, conversationId: number, archived: boolean) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const [conversation] = await db.select().from(aiConversations).where(and(eq(aiConversations.id, conversationId), eq(aiConversations.userId, userId))).limit(1);
  if (!ownsConversation(conversation, userId)) throw new Error("Conversation not found");
  await db.update(aiConversations).set({ archivedAt: archived ? new Date() : null }).where(eq(aiConversations.id, conversationId));
  return { success: true } as const;
}

export async function deleteConversation(userId: number, conversationId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const [conversation] = await db.select().from(aiConversations).where(and(eq(aiConversations.id, conversationId), eq(aiConversations.userId, userId))).limit(1);
  if (!ownsConversation(conversation, userId)) throw new Error("Conversation not found");
  await db.delete(aiMessages).where(and(eq(aiMessages.conversationId, conversationId), eq(aiMessages.userId, userId)));
  await db.delete(aiConversations).where(eq(aiConversations.id, conversationId));
  return { success: true } as const;
}

export async function getUserConversation(userId: number, conversationId: number) {
  const db = await getDb();
  if (!db) return null;
  const [conversation] = await db.select().from(aiConversations).where(and(eq(aiConversations.id, conversationId), eq(aiConversations.userId, userId))).limit(1);
  if (!conversation) return null;
  const messages = await db.select().from(aiMessages).where(and(eq(aiMessages.conversationId, conversationId), eq(aiMessages.userId, userId))).orderBy(aiMessages.createdAt);
  return { conversation, messages };
}

export async function getAllAiMessages() {
  const db = await getDb();
  if (!db) return [];
  const { users } = await import("../drizzle/schema");
  return db
    .select({
      id: aiMessages.id,
      role: aiMessages.role,
      content: aiMessages.content,
      createdAt: aiMessages.createdAt,
      userName: users.name,
      userEmail: users.email,
    })
    .from(aiMessages)
    .leftJoin(users, eq(aiMessages.userId, users.id))
    .orderBy(desc(aiMessages.createdAt))
    .limit(1000);
}
