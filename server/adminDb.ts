import { asc, eq } from "drizzle-orm";
import { auditLogs, users } from "../drizzle/schema";
import { getDb } from "./db";

export async function listUsers() {
  const db = await getDb();
  if (!db) return [];
  return db.select({ id: users.id, name: users.name, email: users.email, role: users.role, lastSignedIn: users.lastSignedIn, createdAt: users.createdAt }).from(users).orderBy(asc(users.name));
}

export function buildRoleAuditEntry(targetUserId: number, targetName: string | null, previousRole: "admin" | "user", role: "admin" | "user", actor: { id: number; name?: string | null }) {
  return { userId: actor.id, userName: actor.name || "Unknown user", action: "ROLE_UPDATE", entityType: "users", entityId: targetUserId, summary: `Changed ${targetName || `user #${targetUserId}`} role from ${previousRole} to ${role}`, metadata: JSON.stringify({ targetUserId, previousRole, role }) };
}

export async function updateUserRole(targetUserId: number, role: "admin" | "user", actor: { id: number; name?: string | null }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const [target] = await db.select({ id: users.id, name: users.name, role: users.role }).from(users).where(eq(users.id, targetUserId)).limit(1);
  if (!target) throw new Error("User not found");
  await db.update(users).set({ role }).where(eq(users.id, targetUserId));
  await db.insert(auditLogs).values(buildRoleAuditEntry(targetUserId, target.name, target.role as "admin" | "user", role, actor));
  return { ...target, role };
}

export async function deleteUser(targetUserId: number, actor: { id: number; name?: string | null }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  if (targetUserId === actor.id) throw new Error("You cannot delete yourself");
  
  const [target] = await db.select({ id: users.id, name: users.name }).from(users).where(eq(users.id, targetUserId)).limit(1);
  if (!target) throw new Error("User not found");
  
  await db.delete(users).where(eq(users.id, targetUserId));
  await db.insert(auditLogs).values({
    userId: actor.id,
    userName: actor.name || "Unknown user",
    action: "USER_DELETED",
    entityType: "users",
    entityId: targetUserId,
    summary: `Deleted user ${target.name || `#${targetUserId}`}`,
    metadata: "{}"
  });
  return { success: true };
}
