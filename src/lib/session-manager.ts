// lib/session-manager.ts
import { prisma } from "@/lib/prisma";

// Clean up expired sessions (call this periodically)
export async function cleanupExpiredSessions() {
  const now = new Date();

  const result = await prisma.adminSession.updateMany({
    where: {
      OR: [
        { expiresAt: { lt: now } },
        {
          lastUsed: {
            lt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
          },
        },
      ],
      isActive: true,
    },
    data: {
      isActive: false,
    },
  });

  console.log(`Cleaned up ${result.count} expired sessions`);
  return result.count;
}

// Revoke all sessions for a user
export async function revokeAllUserSessions(adminId: string) {
  await prisma.adminSession.updateMany({
    where: {
      adminId,
      isActive: true,
    },
    data: {
      isActive: false,
    },
  });
}

// Get active sessions for a user - include all the new fields
export async function getUserActiveSessions(adminId: string) {
  return await prisma.adminSession.findMany({
    where: {
      adminId,
      isActive: true,
      expiresAt: { gt: new Date() },
    },
    orderBy: {
      lastUsed: "desc",
    },
    select: {
      id: true,
      sessionId: true,
      createdAt: true,
      lastUsed: true,
      expiresAt: true,
    },
  });
}

// Revoke a specific session
export async function revokeSession(sessionId: string) {
  return await prisma.adminSession.updateMany({
    where: {
      sessionId,
      isActive: true,
    },
    data: {
      isActive: false,
      expiresAt: new Date(),
    },
  });
}

// Get session by token
export async function getSessionByToken(token: string) {
  return await prisma.adminSession.findFirst({
    where: {
      token,
      isActive: true,
      expiresAt: { gt: new Date() },
    },
    include: {
      admin: {
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
        },
      },
    },
  });
}

// Update session last used timestamp
export async function updateSessionLastUsed(sessionId: string) {
  return await prisma.adminSession.update({
    where: { id: sessionId },
    data: { lastUsed: new Date() },
  });
}
