// src/lib/tasks/cleanup-tokens.ts
import { passwordService } from "@/lib/services/password";
import { logger } from "@/lib/logger";

export async function cleanupExpiredPasswordResetTokens() {
  try {
    const cleanedCount = await passwordService.cleanupExpiredTokens();
    logger.info("Scheduled token cleanup completed", { cleanedCount });
    return cleanedCount;
  } catch (error) {
    logger.error("Scheduled token cleanup failed", { error: error instanceof Error ? error.message : String(error) });
    return 0;
  }
}

// Run this daily (you can use a cron job or serverless function)
