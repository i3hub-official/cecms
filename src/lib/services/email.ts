// src/lib/services/email.ts
import { logger } from "@/lib/logger";

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export class EmailService {
  private static instance: EmailService;

  private constructor() {}

  static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  async sendPasswordResetEmail(
    email: string,
    token: string,
    userId: string
  ): Promise<boolean> {
    try {
      const resetLink = `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password?token=${token}&userId=${userId}`;

      const emailOptions: EmailOptions = {
        to: email,
        subject: "Password Reset Request",
        html: this.getPasswordResetTemplate(resetLink),
        text: `Please click the following link to reset your password: ${resetLink}`,
      };

      // In production, integrate with your email service (SendGrid, AWS SES, etc.)
      if (process.env.NODE_ENV === "production") {
        // Implement actual email sending logic here
        //  await this.sendViaEmailService(emailOptions);
        logger.info("Password reset email sent (production)", {
          email,
          userId,
        });
      } else {
        // In development, log the token instead of sending email
        logger.info("Password reset token (development)", {
          email,
          userId,
          token,
          resetLink,
        });
      }

      return true;
    } catch (error) {
      logger.error("Failed to send password reset email", {
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }

  async sendPasswordChangedEmail(
    email: string,
    userName: string
  ): Promise<boolean> {
    try {
      const emailOptions: EmailOptions = {
        to: email,
        subject: "Password Changed Successfully",
        html: this.getPasswordChangedTemplate(userName),
        text: `Your password has been successfully changed. If you didn't make this change, please contact support immediately.`,
      };

      if (process.env.NODE_ENV === "production") {
        // Implement actual email sending logic here
        // await this.sendViaEmailService(emailOptions);
        logger.info("Password changed email sent (production)", {
          email,
          userName,
        });
      } else {
        logger.info("Password changed notification (development)", {
          email,
          userName,
        });
      }

      return true;
    } catch (error) {
      logger.error("Failed to send password changed email", {
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }

  private getPasswordResetTemplate(resetLink: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .button { 
            display: inline-block; 
            padding: 12px 24px; 
            background-color: #007bff; 
            color: white; 
            text-decoration: none; 
            border-radius: 4px; 
          }
          .footer { margin-top: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>Password Reset Request</h2>
          <p>You requested to reset your password. Click the button below to proceed:</p>
          <p><a href="${resetLink}" class="button">Reset Password</a></p>
          <p>If the button doesn't work, copy and paste this link into your browser:</p>
          <p>${resetLink}</p>
          <p>This link will expire in 1 hour for security reasons.</p>
          <div class="footer">
            <p>If you didn't request this password reset, please ignore this email or contact support.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private getPasswordChangedTemplate(userName: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .alert { background-color: #f8f9fa; padding: 15px; border-left: 4px solid #28a745; }
          .footer { margin-top: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>Password Changed Successfully</h2>
          <div class="alert">
            <p>Hello ${userName},</p>
            <p>Your password has been successfully changed.</p>
          </div>
          <p>If you did not make this change, please contact our support team immediately.</p>
          <div class="footer">
            <p>This is an automated message. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // Private method to integrate with your email service
  // private async sendViaEmailService(options: EmailOptions): Promise<void> {
  //   // Implementation for your email service (SendGrid, AWS SES, etc.)
  //   // Example with SendGrid:
  //   // const sgMail = require('@sendgrid/mail');
  //   // sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  //   // await sgMail.send(options);
  // }
}
