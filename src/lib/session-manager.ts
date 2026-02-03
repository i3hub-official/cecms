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
// Try this updated version:
export async function getSessionByToken(token: string) {
  try {
    if (!token) {
      console.log("getSessionByToken: No token provided");
      return null;
    }
    
    console.log("=== GET SESSION BY TOKEN DEBUG ===");
    console.log("Token length:", token.length);
    console.log("Token first 50 chars:", token.substring(0, 50));

    // Try exact match
    const sessions = await db
      .select()
      .from(adminSessions)
      .where(
        and(
          eq(adminSessions.token, token),
          eq(adminSessions.isActive, true),
          gt(adminSessions.expiresAt, new Date())
        )
      )
      .limit(1);
    
    console.log("Exact match found:", sessions.length > 0);
    
    if (sessions.length === 0) {
      // Try trimmed version
      const trimmedToken = token.trim();
      console.log("Trying trimmed token, length:", trimmedToken.length);
      
      const trimmedSessions = await db
        .select()
        .from(adminSessions)
        .where(
          and(
            eq(adminSessions.token, trimmedToken),
            eq(adminSessions.isActive, true),
            gt(adminSessions.expiresAt, new Date())
          )
        )
        .limit(1);
        
      console.log("Trimmed match found:", trimmedSessions.length > 0);
      
      if (trimmedSessions.length === 0) {
        console.log("No session found for token");
        return null;
      }
      
      var session = trimmedSessions[0];
    } else {
      var session = sessions[0];
    }

    console.log("Session found:", {
      sessionId: session.sessionId,
      adminId: session.adminId,
      isActive: session.isActive,
      expiresAt: session.expiresAt,
    });

    // Get admin
    const adminResult = await db
      .select()
      .from(admins)
      .where(
        and(
          eq(admins.id, session.adminId),
          eq(admins.isActive, true)
        )
      )
      .limit(1);

    if (adminResult.length === 0) {
      console.log("Admin not found or inactive");
      return null;
    }

    const admin = adminResult[0];
    
    console.log("Admin found:", {
      id: admin.id,
      email: admin.email,
      name: admin.name,
    });

    return {
      ...session,
      admin,
    };
  } catch (err) {
    console.error("Error in getSessionByToken:", err);
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
