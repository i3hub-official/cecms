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

// Get active sessions for a user
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
  });
}
