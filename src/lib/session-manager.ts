// lib/session-manager.ts
import { prisma } from "@/lib/prisma";

export async function getUserActiveSessions(userId: string) {
  return prisma.adminSession.findMany({
    where: {
      adminId: userId,
      isActive: true,
      expiresAt: {
        gt: new Date(),
      },
    },
    orderBy: {
      lastUsed: "desc",
    },
  });
}

export async function revokeAllUserSessions(userId: string) {
  return prisma.adminSession.updateMany({
    where: {
      adminId: userId,
      isActive: true,
    },
    data: {
      isActive: false,
      expiresAt: new Date(), // Immediate expiration
    },
  });
}

export async function revokeSession(sessionId: string) {
  return prisma.adminSession.updateMany({
    where: {
      sessionId,
    },
    data: {
      isActive: false,
      expiresAt: new Date(),
    },
  });
}

export async function cleanupExpiredSessions() {
  return prisma.adminSession.deleteMany({
    where: {
      expiresAt: {
        lt: new Date(),
      },
    },
  });
}

// Run cleanup periodically (you can set this up with a cron job)
export async function scheduleSessionCleanup() {
  // Run every hour
  setInterval(cleanupExpiredSessions, 60 * 60 * 1000);
}
