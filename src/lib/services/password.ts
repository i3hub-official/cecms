import { hashPassword, comparePassword } from "@/lib/auth";
import { db } from "@/lib/server/db/index";
import {
  admins,
  passwordResets,
  adminSessions,
  adminActivities,
} from "@/lib/server/db/schema";
import { eq, and, gt } from "drizzle-orm";
import { logger } from "@/lib/logger";
import { EmailService } from "./email";

export class PasswordService {
  private emailService: EmailService;

  constructor() {
    this.emailService = EmailService.getInstance();
  }

  /**
   * Request password reset - generates token and sends email
   */
  async requestPasswordReset(
    email: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Find active admin by email
      const [admin] = await db
        .select()
        .from(admins)
        .where(and(eq(admins.email, email), eq(admins.isActive, true)))
        .limit(1);

      if (!admin) {
        // For security, don't reveal if email exists
        return {
          success: true,
          message:
            "If an account exists with this email, a reset link has been sent",
        };
      }

      // Generate reset token
      const token = await this.generateAndStoreResetToken(
        admin.id,
        admin.email
      );

      // Send password reset email
      const emailSent = await this.emailService.sendPasswordResetEmail(
        admin.email,
        token,
        admin.id
      );

      if (!emailSent) {
        throw new Error("Failed to send password reset email");
      }

      // Log admin activity
      await this.logAdminActivity(admin.id, "REQUESTED_PASSWORD_RESET", {
        email: admin.email,
        timestamp: new Date().toISOString(),
      });

      logger.info("Password reset requested", {
        userId: admin.id,
        email: admin.email,
      });

      return {
        success: true,
        message:
          "If an account exists with this email, a reset link has been sent",
      };
    } catch (error) {
      logger.error("Password reset request failed");
      return {
        success: false,
        message: "Failed to process password reset request",
      };
    }
  }

  /**
   * Reset password using a valid token
   */
  async resetPasswordWithToken(
    token: string,
    newPassword: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Validate password strength
      const passwordValidation = this.validatePasswordStrength(newPassword);
      if (!passwordValidation.valid) {
        return {
          success: false,
          message: passwordValidation.message || "Invalid password",
        };
      }

      // Verify token and get user info
      const tokenInfo = await this.verifyResetToken(token);
      if (!tokenInfo.valid) {
        return {
          success: false,
          message: tokenInfo.message || "Invalid or expired token",
        };
      }

      // Hash new password
      const hashedPassword = await hashPassword(newPassword);

      // Update password and invalidate all sessions in a transaction
      await db.transaction(async (tx) => {
        // Update password
        await tx
          .update(admins)
          .set({ password: hashedPassword })
          .where(eq(admins.id, tokenInfo.userId!));

        // Mark token as used
        await tx
          .update(passwordResets)
          .set({ isUsed: true })
          .where(eq(passwordResets.token, token));

        // Revoke all active sessions for security
        await tx
          .update(adminSessions)
          .set({ isActive: false })
          .where(eq(adminSessions.adminId, tokenInfo.userId!));
      });

      // Get user info for notification
      const [user] = await db
        .select({ email: admins.email, name: admins.name })
        .from(admins)
        .where(eq(admins.id, tokenInfo.userId!))
        .limit(1);

      // Send confirmation email
      if (user) {
        await this.emailService.sendPasswordChangedEmail(user.email, user.name);
      }

      // Log admin activity
      await this.logAdminActivity(tokenInfo.userId!, "PASSWORD_RESET_SUCCESS", {
        timestamp: new Date().toISOString(),
        method: "token_reset",
      });

      logger.info("Password reset successfully", { userId: tokenInfo.userId });

      return { success: true, message: "Password reset successfully" };
    } catch (error) {
      logger.error("Password reset failed", {
        error: error instanceof Error ? error.message : String(error),
      });
      return { success: false, message: "Failed to reset password" };
    }
  }

  /**
   * Change password while authenticated (requires current password)
   */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Validate password strength
      const passwordValidation = this.validatePasswordStrength(newPassword);
      if (!passwordValidation.valid) {
        return {
          success: false,
          message: passwordValidation.message || "Invalid password",
        };
      }

      // Get user with current password hash
      const [user] = await db
        .select()
        .from(admins)
        .where(eq(admins.id, userId))
        .limit(1);

      if (!user) {
        return { success: false, message: "User not found" };
      }

      // Verify current password
      const isCurrentPasswordValid = await comparePassword(
        currentPassword,
        user.password
      );
      if (!isCurrentPasswordValid) {
        return { success: false, message: "Current password is incorrect" };
      }

      // Hash new password
      const hashedPassword = await hashPassword(newPassword);

      // Update password and invalidate all sessions except current one
      await db.transaction(async (tx) => {
        // Update password
        await tx
          .update(admins)
          .set({ password: hashedPassword })
          .where(eq(admins.id, userId));

        // Revoke all other active sessions for security
        await tx
          .update(adminSessions)
          .set({ isActive: false })
          .where(eq(adminSessions.adminId, userId));
      });

      // Send confirmation email
      await this.emailService.sendPasswordChangedEmail(user.email, user.name);

      // Log admin activity
      await this.logAdminActivity(userId, "PASSWORD_CHANGED_SUCCESS", {
        timestamp: new Date().toISOString(),
        method: "authenticated_change",
      });

      logger.info("Password changed successfully", { userId });

      return { success: true, message: "Password changed successfully" };
    } catch (error) {
      logger.error("Password change failed", {
        error: error instanceof Error ? error.message : String(error),
      });
      return { success: false, message: "Failed to change password" };
    }
  }

  /**
   * Verify if a password reset token is valid
   */
  async verifyResetToken(token: string): Promise<{
    valid: boolean;
    message?: string;
    userId?: string;
  }> {
    try {
      // Check if token exists in database and is not used
      const [resetRecord] = await db
        .select({
          id: passwordResets.id,
          adminId: passwordResets.adminId,
          isUsed: passwordResets.isUsed,
          expiresAt: passwordResets.expiresAt,
          admin: {
            id: admins.id,
            email: admins.email,
            isActive: admins.isActive,
          },
        })
        .from(passwordResets)
        .innerJoin(admins, eq(passwordResets.adminId, admins.id))
        .where(eq(passwordResets.token, token))
        .limit(1);

      if (!resetRecord) {
        return { valid: false, message: "Invalid reset token" };
      }

      if (resetRecord.isUsed) {
        return { valid: false, message: "Reset token has already been used" };
      }

      if (new Date() > resetRecord.expiresAt) {
        return { valid: false, message: "Reset token has expired" };
      }

      if (!resetRecord.admin.isActive) {
        return { valid: false, message: "Account is not active" };
      }

      return {
        valid: true,
        userId: resetRecord.adminId,
      };
    } catch (error) {
      logger.error("Token verification failed", {
        error: error instanceof Error ? error.message : String(error),
      });
      return { valid: false, message: "Invalid reset token" };
    }
  }

  /**
   * Generate and store password reset token in database
   */
  private async generateAndStoreResetToken(
    userId: string,
    email: string
  ): Promise<string> {
    const { generateSecureToken } = await import("@/lib/session-manager");
    const token = generateSecureToken(32);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Store token in database
    await db.insert(passwordResets).values({
      id: crypto.randomUUID(),
      adminId: userId,
      token,
      expiresAt,
      isUsed: false,
      createdAt: new Date(),
    });

    return token;
  }

  /**
   * Validate password strength
   */
  private validatePasswordStrength(password: string): {
    valid: boolean;
    message?: string;
  } {
    if (password.length < 8) {
      return {
        valid: false,
        message: "Password must be at least 8 characters long",
      };
    }

    if (!/[A-Z]/.test(password)) {
      return {
        valid: false,
        message: "Password must contain at least one uppercase letter",
      };
    }

    if (!/[a-z]/.test(password)) {
      return {
        valid: false,
        message: "Password must contain at least one lowercase letter",
      };
    }

    if (!/\d/.test(password)) {
      return {
        valid: false,
        message: "Password must contain at least one number",
      };
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      return {
        valid: false,
        message: "Password must contain at least one special character",
      };
    }

    // Check for common passwords (basic check)
    const commonPasswords = [
      "password",
      "123456",
      "qwerty",
      "admin",
      "welcome",
    ];
    if (commonPasswords.includes(password.toLowerCase())) {
      return { valid: false, message: "Password is too common" };
    }

    return { valid: true };
  }

  /**
   * Log admin activity
   */
  private async logAdminActivity(
    adminId: string,
    activity: string,
    details?: Record<string, unknown>
  ) {
    try {
      await db.insert(adminActivities).values({
        id: crypto.randomUUID(),
        adminId,
        activity,
        timestamp: new Date(),
      });
    } catch (error) {
      logger.error("Failed to log admin activity", {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Clean up expired password reset tokens
   */
  async cleanupExpiredTokens(): Promise<number> {
    try {
      const result = await db
        .delete(passwordResets)
        .where(gt(passwordResets.expiresAt, new Date()))
        .execute();

      logger.info("Cleaned up expired password reset tokens", {
        count: result.count || 0,
      });
      return result.count || 0;
    } catch (error) {
      logger.error("Failed to cleanup expired tokens", {
        error: error instanceof Error ? error.message : String(error),
      });
      return 0;
    }
  }
}

// Singleton instance
export const passwordService = new PasswordService();
