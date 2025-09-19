// src/lib/session-manager
import { db } from "@/lib/server/db/index";
import { adminSessions, admins } from "@/lib/server/db/schema";
import { eq, and, gt } from "drizzle-orm";
import { logger } from "./logger";
import { randomBytes } from "crypto";

const SESSION_CONFIG = {
  SESSION_EXPIRY_HOURS: 24,
  CLEANUP_DAYS: 7,
  EXTEND_IF_LESS_THAN_HOURS: 4,
};

// ------------------------
// Create new session
// ------------------------
export async function createSession(
  adminId: string,
  token: string,
  sessionId: string,
  userAgent?: string,
  ipAddress?: string
) {
  const now = new Date();
  const expiresAt = new Date(
    now.getTime() + SESSION_CONFIG.SESSION_EXPIRY_HOURS * 60 * 60 * 1000
  );

  const [session] = await db
    .insert(adminSessions)
    .values({
      adminId,
      token,
      sessionId,
      isActive: true,
      createdAt: now,
      lastUsed: now,
      expiresAt,
      userAgent: userAgent || null,
      ipAddress: ipAddress || null,
    })
    .returning();

  logger.info("Created new session", { sessionId: session.sessionId, adminId });
  return session;
}

// ------------------------
// Validate by token
// ------------------------
export async function getSessionByToken(token: string) {
  try {
    logger.debug("Looking up session by token");
    const [row] = await db
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
          eq(admins.isActive, true),
          gt(adminSessions.expiresAt, new Date())
        )
      )
      .limit(1);

    if (!row) {
      logger.debug("No active session for token");
      return null;
    }

    const now = new Date();
    const msToExpiry = row.session.expiresAt.getTime() - now.getTime();
    const extendThreshold =
      SESSION_CONFIG.EXTEND_IF_LESS_THAN_HOURS * 60 * 60 * 1000;

    if (msToExpiry < extendThreshold) {
      const newExpiry = new Date(
        now.getTime() + SESSION_CONFIG.SESSION_EXPIRY_HOURS * 60 * 60 * 1000
      );
      await db
        .update(adminSessions)
        .set({ expiresAt: newExpiry, lastUsed: now })
        .where(eq(adminSessions.sessionId, row.session.sessionId));

      row.session.expiresAt = newExpiry;
      row.session.lastUsed = now;
      logger.debug("Extended session expiry", {
        sessionId: row.session.sessionId,
      });
    }

    logger.debug("Session found", {
      sessionId: row.session.sessionId,
      adminId: row.admin.id,
      email: row.admin.email,
    });

    return { ...row.session, admin: row.admin };
  } catch (err) {
    logger.error("Error in getSessionByToken", {
      error: err instanceof Error ? err.message : String(err),
    });
    return null;
  }
}

// ------------------------
// Update lastUsed
// ------------------------
export async function updateSessionLastUsed(
  sessionId: string,
  extendIfNeeded = true
) {
  try {
    const now = new Date();
    const update: { lastUsed: Date; expiresAt?: Date } = { lastUsed: now };

    if (extendIfNeeded) {
      const [s] = await db
        .select({ expiresAt: adminSessions.expiresAt })
        .from(adminSessions)
        .where(eq(adminSessions.sessionId, sessionId))
        .limit(1);

      if (s) {
        const msLeft = s.expiresAt.getTime() - now.getTime();
        const threshold =
          SESSION_CONFIG.EXTEND_IF_LESS_THAN_HOURS * 60 * 60 * 1000;
        if (msLeft < threshold) {
          update.expiresAt = new Date(
            now.getTime() + SESSION_CONFIG.SESSION_EXPIRY_HOURS * 60 * 60 * 1000
          );
          logger.debug("Extended expiry on lastUsed update", { sessionId });
        }
      }
    }

    const [updated] = await db
      .update(adminSessions)
      .set(update)
      .where(eq(adminSessions.sessionId, sessionId))
      .returning();

    logger.debug("Updated lastUsed", {
      sessionId,
      lastUsed: updated?.lastUsed?.toISOString(),
      expiresAt: updated?.expiresAt?.toISOString(),
    });

    return updated;
  } catch (err) {
    logger.error("Error in updateSessionLastUsed", {
      error: err instanceof Error ? err.message : String(err),
    });
    return null;
  }
}

// ------------------------
// Revoke session
// ------------------------
export async function revokeSession(sessionId: string) {
  const [res] = await db
    .update(adminSessions)
    .set({ isActive: false, expiresAt: new Date() })
    .where(eq(adminSessions.sessionId, sessionId))
    .returning();

  logger.info("Session revoked", { sessionId, success: !!res });
  return res;
}

export function generateSessionId(): string {
  return randomBytes(16).toString("hex");
}

/**
 * Generate a secure random token for various purposes
 */
export function generateSecureToken(length: number = 32): string {
  return randomBytes(length).toString("hex");
}
