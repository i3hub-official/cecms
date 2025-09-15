// lib/session-manager.ts
import { db } from "@/lib/server/db/index";
import { adminSessions, admins } from "@/lib/server/db/schema";
import { eq, and, or, lt, gt, desc } from "drizzle-orm";

// Clean up expired sessions (call this periodically)
export async function cleanupExpiredSessions() {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const result = await db
    .update(adminSessions)
    .set({
      isActive: false,
    })
    .where(
      and(
        eq(adminSessions.isActive, true),
        or(
          lt(adminSessions.expiresAt, now),
          lt(adminSessions.lastUsed, sevenDaysAgo)
        )
      )
    );

  const affectedRows = result.length || 0; // Adjusted to use the length of the result array
  console.log(`Cleaned up ${affectedRows} expired sessions`);
  return affectedRows;
}

// Revoke all sessions for a user
export async function revokeAllUserSessions(adminId: string) {
  await db
    .update(adminSessions)
    .set({
      isActive: false,
    })
    .where(
      and(eq(adminSessions.adminId, adminId), eq(adminSessions.isActive, true))
    );
}

// Get active sessions for a user - include all the new fields
export async function getUserActiveSessions(adminId: string) {
  return await db
    .select({
      id: adminSessions.id,
      sessionId: adminSessions.sessionId,
      createdAt: adminSessions.createdAt,
      lastUsed: adminSessions.lastUsed,
      expiresAt: adminSessions.expiresAt,
    })
    .from(adminSessions)
    .where(
      and(
        eq(adminSessions.adminId, adminId),
        eq(adminSessions.isActive, true),
        gt(adminSessions.expiresAt, new Date())
      )
    )
    .orderBy(desc(adminSessions.lastUsed));
}

// Revoke a specific session
export async function revokeSession(sessionId: string) {
  return await db
    .update(adminSessions)
    .set({
      isActive: false,
      expiresAt: new Date(),
    })
    .where(
      and(
        eq(adminSessions.sessionId, sessionId),
        eq(adminSessions.isActive, true)
      )
    );
}

// Get session by token
export async function getSessionByToken(token: string) {
  const [session] = await db
    .select({
      session: adminSessions,
      admin: {
        id: admins.id,
        email: admins.email,
        name: admins.name,
        role: admins.role,
        isActive: admins.isActive,
      },
    })
    .from(adminSessions)
    .innerJoin(admins, eq(adminSessions.adminId, admins.id))
    .where(
      and(
        eq(adminSessions.token, token),
        eq(adminSessions.isActive, true),
        gt(adminSessions.expiresAt, new Date())
      )
    )
    .limit(1);

  return session ? { ...session.session, admin: session.admin } : null;
}

// Update session last used timestamp
export async function updateSessionLastUsed(sessionId: string) {
  const [updatedSession] = await db
    .update(adminSessions)
    .set({
      lastUsed: new Date(),
    })
    .where(eq(adminSessions.id, sessionId))
    .returning();

  return updatedSession;
}
