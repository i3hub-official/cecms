// src/lib/services/email.ts
import nodemailer from "nodemailer";
import { logger } from "@/lib/logger";

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface LoginDetails {
  ipAddress: string;
  userAgent: string;
  location?: string;
  timestamp: Date;
}

export interface CenterDetails {
  centerName: string;
  centerId: string;
  adminName: string;
  adminEmail: string;
}

export interface ApiKeyDetails {
  keyName: string;
  keyId: string;
  permissions: string[];
  expiryDate?: Date;
}

export class EmailService {
  private static instance: EmailService;
  private transporter: nodemailer.Transporter;

  private constructor() {
    const port = parseInt(process.env.SMTP_PORT || "587");
    const secure = process.env.SMTP_SECURE
      ? process.env.SMTP_SECURE === "true"
      : port === 465; // default to SSL for 465, TLS otherwise

    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure, // true for SSL, false for TLS
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    // Verify connection configuration
    this.verifyConnection();
  }

  static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  private async verifyConnection(): Promise<void> {
    try {
      await this.transporter.verify();
      logger.info("SMTP connection verified successfully");
    } catch (error) {
      logger.error("SMTP connection failed", {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  async sendMail(options: EmailOptions): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
      });

      logger.info(`Email sent to ${options.to} successfully`);
    } catch (error) {
      logger.error("Failed to send email", {
        error: error instanceof Error ? error.message : String(error),
        to: options.to,
        subject: options.subject,
      });
      throw error;
    }
  }

  /**
   * Get the appropriate base URL for links
   * Uses private LAN URL for development, public URL for production
   */
  getBaseUrl(): string {
    // In development, use the private LAN URL
    if (process.env.NODE_ENV === "development") {
      return process.env.NEXT_PRIVATE_APP_URL || "https://192.168.0.159:3002";
    }

    logger.info("🔧 EmailService.getBaseUrl() debug:");
    logger.info("NODE_ENV:", process.env.NODE_ENV);
    logger.info("NEXT_PRIVATE_APP_URL:", process.env.NEXT_PRIVATE_APP_URL);
    logger.info("NEXT_PUBLIC_APP_URL:", process.env.NEXT_PUBLIC_APP_URL);

    // In production, use the public URL
    return process.env.NEXT_PUBLIC_APP_URL || "https://cecms.vercel.app";
  }

  async sendPasswordResetEmail(
    email: string,
    token: string,
    userId: string
  ): Promise<boolean> {
    try {
      const baseUrl = this.getBaseUrl();
      const resetLink = `${baseUrl}/auth/reset-password?token=${token}&userId=${userId}`;

      const emailOptions: EmailOptions = {
        to: email,
        subject: "Password Reset Request",
        html: this.getPasswordResetTemplate(resetLink),
        text: `Please click the following link to reset your password: ${resetLink}`,
      };

      const result = await this.sendEmail(emailOptions);

      if (result) {
        logger.info("Password reset email sent", {
          email,
          userId,
          messageId: result.messageId,
          baseUrlUsed: baseUrl,
        });
        return true;
      }

      return false;
    } catch (error) {
      logger.error("Failed to send password reset email", {
        error: error instanceof Error ? error.message : String(error),
        email,
        userId,
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

      const result = await this.sendEmail(emailOptions);

      if (result) {
        logger.info("Password changed email sent", {
          email,
          userName,
          messageId: result.messageId,
        });
        return true;
      }

      return false;
    } catch (error) {
      logger.error("Failed to send password changed email", {
        error: error instanceof Error ? error.message : String(error),
        email,
        userName,
      });
      return false;
    }
  }

  /**
   * Send new login notification email
   */
  async sendLoginNotificationEmail(
    email: string,
    userName: string,
    loginDetails: LoginDetails
  ): Promise<boolean> {
    try {
      const emailOptions: EmailOptions = {
        to: email,
        subject: "New Login to Your Account",
        html: this.getLoginNotificationTemplate(userName, loginDetails),
        text: `A new login was detected on your account from IP: ${
          loginDetails.ipAddress
        } at ${loginDetails.timestamp.toLocaleString()}`,
      };

      const result = await this.sendEmail(emailOptions);

      if (result) {
        logger.info("Login notification email sent", {
          email,
          userName,
          messageId: result.messageId,
        });
        return true;
      }

      return false;
    } catch (error) {
      logger.error("Failed to send login notification email", {
        error: error instanceof Error ? error.message : String(error),
        email,
        userName,
      });
      return false;
    }
  }

  /**
   * Send center creation notification email
   */
  async sendCenterCreationEmail(
    email: string,
    userName: string,
    centerDetails: CenterDetails
  ): Promise<boolean> {
    try {
      const emailOptions: EmailOptions = {
        to: email,
        subject: "New Center Created Successfully",
        html: this.getCenterCreationTemplate(userName, centerDetails),
        text: `A new center "${centerDetails.centerName}" has been created successfully. Center ID: ${centerDetails.centerId}`,
      };

      const result = await this.sendEmail(emailOptions);

      if (result) {
        logger.info("Center creation email sent", {
          email,
          userName,
          centerId: centerDetails.centerId,
          messageId: result.messageId,
        });
        return true;
      }

      return false;
    } catch (error) {
      logger.error("Failed to send center creation email", {
        error: error instanceof Error ? error.message : String(error),
        email,
        userName,
      });
      return false;
    }
  }

  /**
   * Send API key creation notification email
   */
  async sendApiKeyCreationEmail(
    email: string,
    userName: string,
    apiKeyDetails: ApiKeyDetails
  ): Promise<boolean> {
    try {
      const emailOptions: EmailOptions = {
        to: email,
        subject: "API Key Created Successfully",
        html: this.getApiKeyCreationTemplate(userName, apiKeyDetails),
        text: `A new API key "${apiKeyDetails.keyName}" has been created for your account.`,
      };

      const result = await this.sendEmail(emailOptions);

      if (result) {
        logger.info("API key creation email sent", {
          email,
          userName,
          keyId: apiKeyDetails.keyId,
          messageId: result.messageId,
        });
        return true;
      }

      return false;
    } catch (error) {
      logger.error("Failed to send API key creation email", {
        error: error instanceof Error ? error.message : String(error),
        email,
        userName,
      });
      return false;
    }
  }

  /**
   * Send API key revocation notification email
   */
  async sendApiKeyRevokedEmail(
    email: string,
    userName: string,
    keyName: string,
    revokedBy?: string
  ): Promise<boolean> {
    try {
      const emailOptions: EmailOptions = {
        to: email,
        subject: "API Key Revoked",
        html: this.getApiKeyRevokedTemplate(userName, keyName, revokedBy),
        text: `Your API key "${keyName}" has been revoked${
          revokedBy ? ` by ${revokedBy}` : ""
        }.`,
      };

      const result = await this.sendEmail(emailOptions);

      if (result) {
        logger.info("API key revoked email sent", {
          email,
          userName,
          keyName,
          messageId: result.messageId,
        });
        return true;
      }

      return false;
    } catch (error) {
      logger.error("Failed to send API key revoked email", {
        error: error instanceof Error ? error.message : String(error),
        email,
        userName,
      });
      return false;
    }
  }

  /**
   * Send account suspension notification email
   */
  async sendAccountSuspensionEmail(
    email: string,
    userName: string,
    reason: string,
    suspendedBy: string
  ): Promise<boolean> {
    try {
      const emailOptions: EmailOptions = {
        to: email,
        subject: "Account Suspended",
        html: this.getAccountSuspensionTemplate(userName, reason, suspendedBy),
        text: `Your account has been suspended. Reason: ${reason}`,
      };

      const result = await this.sendEmail(emailOptions);

      if (result) {
        logger.info("Account suspension email sent", {
          email,
          userName,
          messageId: result.messageId,
        });
        return true;
      }

      return false;
    } catch (error) {
      logger.error("Failed to send account suspension email", {
        error: error instanceof Error ? error.message : String(error),
        email,
        userName,
      });
      return false;
    }
  }

  /**
   * Send account reactivation notification email
   */
  async sendAccountReactivationEmail(
    email: string,
    userName: string,
    reactivatedBy: string
  ): Promise<boolean> {
    try {
      const emailOptions: EmailOptions = {
        to: email,
        subject: "Account Reactivated",
        html: this.getAccountReactivationTemplate(userName, reactivatedBy),
        text: `Your account has been reactivated and you can now access all services.`,
      };

      const result = await this.sendEmail(emailOptions);

      if (result) {
        logger.info("Account reactivation email sent", {
          email,
          userName,
          messageId: result.messageId,
        });
        return true;
      }

      return false;
    } catch (error) {
      logger.error("Failed to send account reactivation email", {
        error: error instanceof Error ? error.message : String(error),
        email,
        userName,
      });
      return false;
    }
  }

  /**
   * Generic email sending method
   */
  private async sendEmail(
    options: EmailOptions
  ): Promise<nodemailer.SentMessageInfo | null> {
    try {
      const from =
        process.env.SMTP_FROM || process.env.SMTP_USER || "noreply@cecms.com";

      const mailOptions: nodemailer.SendMailOptions = {
        from: `"CECMS" <${from}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      };

      const result = await this.transporter.sendMail(mailOptions);
      return result;
    } catch (error) {
      logger.error("Failed to send email", {
        error: error instanceof Error ? error.message : String(error),
        to: options.to,
        subject: options.subject,
      });
      return null;
    }
  }

  /**
   * Send welcome email to new users
   */
  async sendWelcomeEmail(
    email: string,
    userName: string,
    tempPassword?: string
  ): Promise<boolean> {
    try {
      const baseUrl = this.getBaseUrl();
      const loginLink = `${baseUrl}/auth/signin`;

      const emailOptions: EmailOptions = {
        to: email,
        subject: "Welcome to Our Platform",
        html: this.getWelcomeTemplate(userName, tempPassword),
        text: `Welcome ${userName}! Your account has been successfully created.${
          tempPassword ? ` Your temporary password is: ${tempPassword}` : ""
        } Login at: ${loginLink}`,
      };

      const result = await this.sendEmail(emailOptions);

      if (result) {
        logger.info("Welcome email sent", {
          email,
          userName,
          messageId: result.messageId,
          baseUrlUsed: baseUrl,
        });
        return true;
      }

      return false;
    } catch (error) {
      logger.error("Failed to send welcome email", {
        error: error instanceof Error ? error.message : String(error),
        email,
        userName,
      });
      return false;
    }
  }

  /**
   * Send email verification email
   */
  async sendVerificationEmail(
    email: string,
    token: string,
    name: string,
    userId: string
  ): Promise<boolean> {
    try {
      const baseUrl = this.getBaseUrl();
      const verificationLink = `${baseUrl}/api/auth/verify-email?token=${token}&userId=${encodeURIComponent(
        userId
      )}`;

      const emailOptions: EmailOptions = {
        to: email,
        subject: "Verify Your Email Address",
        html: this.getVerificationTemplate(name, verificationLink),
        text: `Please verify your email address by clicking this link: ${verificationLink}`,
      };

      const result = await this.sendEmail(emailOptions);

      if (result) {
        logger.info("Verification email sent", {
          email,
          name,
          messageId: result.messageId,
          baseUrlUsed: baseUrl,
        });
        return true;
      }

      return false;
    } catch (error) {
      logger.error("Failed to send verification email", {
        error: error instanceof Error ? error.message : String(error),
        email,
        name,
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
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset</title>
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            margin: 0;
            padding: 0;
            background-color: #f9f9f9;
          }
          .container { 
            max-width: 600px; 
            margin: 0 auto; 
            padding: 20px;
            background-color: #ffffff;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          .header { 
            text-align: center; 
            padding: 20px 0;
            border-bottom: 2px solid #007bff;
          }
          .button { 
            display: inline-block; 
            padding: 12px 24px; 
            background-color: #007bff; 
            color: white; 
            text-decoration: none; 
            border-radius: 4px;
            margin: 20px 0;
          }
          .footer { 
            margin-top: 30px; 
            font-size: 12px; 
            color: #666;
            text-align: center;
            border-top: 1px solid #eee;
            padding-top: 20px;
          }
          .code-block {
            background-color: #f8f9fa;
            padding: 15px;
            border-radius: 4px;
            border-left: 4px solid #007bff;
            margin: 20px 0;
            word-break: break-all;
            font-family: monospace;
          }
          .warning {
            background-color: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 15px;
            border-radius: 4px;
            margin: 20px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>Password Reset Request</h2>
          </div>
          
          <p>Hello,</p>
          <p>You requested to reset your password. Click the button below to proceed:</p>
          
          <div style="text-align: center;">
            <a href="${resetLink}" class="button">Reset Password</a>
          </div>
          
          <p>If the button doesn't work, copy and paste this link into your browser:</p>
          
          <div class="code-block">
            ${resetLink}
          </div>
          
          <div class="warning">
            <p><strong>⚠️ This link will expire in 1 hour for security reasons.</strong></p>
          </div>
          
          <p>If you're on a local network, make sure you're connected to the same network as the server.</p>
          
          <div class="footer">
            <p>If you didn't request this password reset, please ignore this email or contact our support team immediately.</p>
            <p>This is an automated message. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private getVerificationTemplate(
    userName: string,
    verificationLink: string
  ): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Your Email</title>
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            margin: 0;
            padding: 0;
            background-color: #f9f9f9;
          }
          .container { 
            max-width: 600px; 
            margin: 0 auto; 
            padding: 20px;
            background-color: #ffffff;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          .header { 
            text-align: center; 
            padding: 20px 0;
            border-bottom: 2px solid #28a745;
          }
          .button { 
            display: inline-block; 
            padding: 12px 24px; 
            background-color: #28a745; 
            color: white; 
            text-decoration: none; 
            border-radius: 4px;
            margin: 20px 0;
          }
          .footer { 
            margin-top: 30px; 
            font-size: 12px; 
            color: #666;
            text-align: center;
            border-top: 1px solid #eee;
            padding-top: 20px;
          }
          .code-block {
            background-color: #f8f9fa;
            padding: 15px;
            border-radius: 4px;
            border-left: 4px solid #28a745;
            margin: 20px 0;
            word-break: break-all;
            font-family: monospace;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>Verify Your Email Address</h2>
          </div>

          <p>Hello, <strong>${userName},</strong></p>
          <p>Thank you for signing up! Please verify your email address to complete your registration.</p>
          
          <div style="text-align: center;">
            <a href="${verificationLink}" class="button">Verify Email</a>
          </div>
          
          <p>If the button doesn't work, copy and paste this link into your browser:</p>
          
          <div class="code-block">
            ${verificationLink}
          </div>
          
          <p>If you're on a local network, make sure you're connected to the same network as the server.</p>
          
          <div class="footer">
            <p>If you didn't create an account with us, please ignore this email.</p>
            <p>This is an automated message. Please do not reply to this email.</p>
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
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Changed</title>
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            margin: 0;
            padding: 0;
            background-color: #f9f9f9;
          }
          .container { 
            max-width: 600px; 
            margin: 0 auto; 
            padding: 20px;
            background-color: #ffffff;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          .header { 
            text-align: center; 
            padding: 20px 0;
            border-bottom: 2px solid #28a745;
          }
          .alert { 
            background-color: #d4edda; 
            padding: 15px; 
            border-left: 4px solid #28a745;
            border-radius: 4px;
            margin: 20px 0;
          }
          .footer { 
            margin-top: 30px; 
            font-size: 12px; 
            color: #666;
            text-align: center;
            border-top: 1px solid #eee;
            padding-top: 20px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>Password Changed Successfully</h2>
          </div>
          
          <div class="alert">
            <p><strong>Hello ${userName},</strong></p>
            <p>Your password has been successfully changed.</p>
          </div>
          
          <p>If you did not make this change, please contact our support team immediately as your account may be compromised.</p>
          
          <div class="footer">
            <p>This is an automated message. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private getWelcomeTemplate(userName: string, tempPassword?: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome</title>
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            margin: 0;
            padding: 0;
            background-color: #f9f9f9;
          }
          .container { 
            max-width: 600px; 
            margin: 0 auto; 
            padding: 20px;
            background-color: #ffffff;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          .header { 
            text-align: center; 
            padding: 20px 0;
            border-bottom: 2px solid #007bff;
          }
          .footer { 
            margin-top: 30px; 
            font-size: 12px; 
            color: #666;
            text-align: center;
            border-top: 1px solid #eee;
            padding-top: 20px;
          }
          .code-block {
            background-color: #f8f9fa;
            padding: 15px;
            border-radius: 4px;
            border-left: 4px solid #007bff;
            margin: 20px 0;
            word-break: break-all;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>Welcome to Our Platform!</h2>
          </div>
          
          <p><strong>Hello ${userName},</strong></p>
          <p>Your account has been successfully created and is ready to use.</p>
          
          ${
            tempPassword
              ? `
          <p>Your temporary password is:</p>
          <div class="code-block">
            <strong>${tempPassword}</strong>
          </div>
          <p>Please change your password after your first login for security reasons.</p>
          `
              : ""
          }
          
          <p>You can now sign in to your account and start using our services.</p>
          
          <div class="footer">
            <p>If you have any questions, please contact our support team.</p>
            <p>This is an automated message. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private getLoginNotificationTemplate(
    userName: string,
    loginDetails: LoginDetails
  ): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Login Detected</title>
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            margin: 0;
            padding: 0;
            background-color: #f9f9f9;
          }
          .container { 
            max-width: 600px; 
            margin: 0 auto; 
            padding: 20px;
            background-color: #ffffff;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          .header { 
            text-align: center; 
            padding: 20px 0;
            border-bottom: 2px solid #17a2b8;
          }
          .info-box {
            background-color: #d1ecf1;
            border-left: 4px solid #17a2b8;
            padding: 15px;
            border-radius: 4px;
            margin: 20px 0;
          }
          .footer { 
            margin-top: 30px; 
            font-size: 12px; 
            color: #666;
            text-align: center;
            border-top: 1px solid #eee;
            padding-top: 20px;
          }
          .security-note {
            background-color: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 15px;
            border-radius: 4px;
            margin: 20px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>🔐 New Login Detected</h2>
          </div>
          
          <p>Hello <strong>${userName},</strong></p>
          <p>We detected a new login to your account. Here are the details:</p>
          
          <div class="info-box">
            <p><strong>Login Details:</strong></p>
            <ul>
              <li><strong>Time:</strong> ${loginDetails.timestamp.toLocaleString()}</li>
              <li><strong>IP Address:</strong> ${loginDetails.ipAddress}</li>
              <li><strong>Device/Browser:</strong> ${
                loginDetails.userAgent
              }</li>
              ${
                loginDetails.location
                  ? `<li><strong>Location:</strong> ${loginDetails.location}</li>`
                  : ""
              }
            </ul>
          </div>
          
          <div class="security-note">
            <p><strong>Was this you?</strong></p>
            <p>If you recognize this login, no action is needed. If you don't recognize this activity, please:</p>
            <ul>
              <li>Change your password immediately</li>
              <li>Review your account activity</li>
              <li>Contact our support team</li>
            </ul>
          </div>
          
          <div class="footer">
            <p>This is an automated security notification. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private getCenterCreationTemplate(
    userName: string,
    centerDetails: CenterDetails
  ): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Center Created Successfully</title>
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            margin: 0;
            padding: 0;
            background-color: #f9f9f9;
          }
          .container { 
            max-width: 600px; 
            margin: 0 auto; 
            padding: 20px;
            background-color: #ffffff;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          .header { 
            text-align: center; 
            padding: 20px 0;
            border-bottom: 2px solid #28a745;
          }
          .success-box {
            background-color: #d4edda;
            border-left: 4px solid #28a745;
            padding: 15px;
            border-radius: 4px;
            margin: 20px 0;
          }
          .info-grid {
            display: grid;
            grid-template-columns: 1fr 2fr;
            gap: 10px;
            margin: 20px 0;
            padding: 15px;
            background-color: #f8f9fa;
            border-radius: 4px;
          }
          .info-label {
            font-weight: bold;
            color: #495057;
          }
          .footer { 
            margin-top: 30px; 
            font-size: 12px; 
            color: #666;
            text-align: center;
            border-top: 1px solid #eee;
            padding-top: 20px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>🏢 Center Created Successfully</h2>
          </div>
          
          <p>Hello <strong>${userName},</strong></p>
          <p>Congratulations! A new center has been successfully created in the system.</p>
          
          <div class="success-box">
            <h3>Center Details:</h3>
            <div class="info-grid">
              <span class="info-label">Center Name:</span>
              <span>${centerDetails.centerName}</span>
              <span class="info-label">Center ID:</span>
              <span>${centerDetails.centerId}</span>
              <span class="info-label">Administrator:</span>
              <span>${centerDetails.adminName}</span>
              <span class="info-label">Admin Email:</span>
              <span>${centerDetails.adminEmail}</span>
            </div>
          </div>
          
          <p>The center is now active and ready for use. The administrator has been notified and can begin managing the center operations.</p>
          
          <div class="footer">
            <p>This is an automated notification. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private getApiKeyCreationTemplate(
    userName: string,
    apiKeyDetails: ApiKeyDetails
  ): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>API Key Created</title>
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            margin: 0;
            padding: 0;
            background-color: #f9f9f9;
          }
          .container { 
            max-width: 600px; 
            margin: 0 auto; 
            padding: 20px;
            background-color: #ffffff;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          .header { 
            text-align: center; 
            padding: 20px 0;
            border-bottom: 2px solid #6f42c1;
          }
          .api-box {
            background-color: #f3e5f5;
            border-left: 4px solid #6f42c1;
            padding: 15px;
            border-radius: 4px;
            margin: 20px 0;
          }
          .permissions-list {
            background-color: #f8f9fa;
            padding: 15px;
            border-radius: 4px;
            margin: 15px 0;
          }
          .security-warning {
            background-color: #f8d7da;
            border-left: 4px solid #dc3545;
            padding: 15px;
            border-radius: 4px;
            margin: 20px 0;
          }
          .footer { 
            margin-top: 30px; 
            font-size: 12px; 
            color: #666;
            text-align: center;
            border-top: 1px solid #eee;
            padding-top: 20px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>🔑 API Key Created</h2>
          </div>
          
          <p>Hello <strong>${userName},</strong></p>
          <p>A new API key has been successfully created for your account.</p>
          
          <div class="api-box">
            <h3>API Key Details:</h3>
            <p><strong>Key Name:</strong> ${apiKeyDetails.keyName}</p>
            <p><strong>Key ID:</strong> ${apiKeyDetails.keyId}</p>
            ${
              apiKeyDetails.expiryDate
                ? `<p><strong>Expires:</strong> ${apiKeyDetails.expiryDate.toLocaleDateString()}</p>`
                : "<p><strong>Expires:</strong> Never</p>"
            }
          </div>
          
          <div class="permissions-list">
            <h4>Permissions Granted:</h4>
            <ul>
              ${apiKeyDetails.permissions
                .map((permission) => `<li>${permission}</li>`)
                .join("")}
            </ul>
          </div>
          
          <div class="security-warning">
            <h4>🔐 Security Notice:</h4>
            <ul>
              <li>Keep your API key secure and never share it publicly</li>
              <li>Use HTTPS when making API requests</li>
              <li>Regularly rotate your API keys for security</li>
              <li>Monitor your API usage for any suspicious activity</li>
            </ul>
          </div>
          
          <div class="footer">
            <p>This is an automated notification. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private getApiKeyRevokedTemplate(
    userName: string,
    keyName: string,
    revokedBy?: string
  ): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>API Key Revoked</title>
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            margin: 0;
            padding: 0;
            background-color: #f9f9f9;
          }
          .container { 
            max-width: 600px; 
            margin: 0 auto; 
            padding: 20px;
            background-color: #ffffff;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          .header { 
            text-align: center; 
            padding: 20px 0;
            border-bottom: 2px solid #dc3545;
          }
          .revoked-box {
            background-color: #f8d7da;
            border-left: 4px solid #dc3545;
            padding: 15px;
            border-radius: 4px;
            margin: 20px 0;
          }
          .footer { 
            margin-top: 30px; 
            font-size: 12px; 
            color: #666;
            text-align: center;
            border-top: 1px solid #eee;
            padding-top: 20px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>🚫 API Key Revoked</h2>
          </div>
          
          <p>Hello <strong>${userName},</strong></p>
          <p>An API key associated with your account has been revoked.</p>
          
          <div class="revoked-box">
            <h3>Revocation Details:</h3>
            <p><strong>Key Name:</strong> ${keyName}</p>
            <p><strong>Revoked At:</strong> ${new Date().toLocaleString()}</p>
            ${
              revokedBy
                ? `<p><strong>Revoked By:</strong> ${revokedBy}</p>`
                : ""
            }
          </div>
          
          <p>This API key is no longer valid and cannot be used to access our services. Any applications using this key will need to be updated with a new API key.</p>
          
          <p>If you didn't initiate this revocation, please contact our support team immediately.</p>
          
          <div class="footer">
            <p>This is an automated security notification. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private getAccountSuspensionTemplate(
    userName: string,
    reason: string,
    suspendedBy: string
  ): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Account Suspended</title>
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            margin: 0;
            padding: 0;
            background-color: #f9f9f9;
          }
          .container { 
            max-width: 600px; 
            margin: 0 auto; 
            padding: 20px;
            background-color: #ffffff;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          .header { 
            text-align: center; 
            padding: 20px 0;
            border-bottom: 2px solid #dc3545;
          }
          .suspension-box {
            background-color: #f8d7da;
            border-left: 4px solid #dc3545;
            padding: 15px;
            border-radius: 4px;
            margin: 20px 0;
          }
          .contact-box {
            background-color: #d1ecf1;
            border-left: 4px solid #17a2b8;
            padding: 15px;
            border-radius: 4px;
            margin: 20px 0;
          }
          .footer { 
            margin-top: 30px; 
            font-size: 12px; 
            color: #666;
            text-align: center;
            border-top: 1px solid #eee;
            padding-top: 20px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>⚠️ Account Suspended</h2>
          </div>
          
          <p>Hello <strong>${userName},</strong></p>
          <p>We regret to inform you that your account has been suspended.</p>
          
          <div class="suspension-box">
            <h3>Suspension Details:</h3>
            <p><strong>Reason:</strong> ${reason}</p>
            <p><strong>Suspended By:</strong> ${suspendedBy}</p>
            <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
          </div>
          
          <p>During the suspension period, you will not be able to access your account or use our services.</p>
          
          <div class="contact-box">
            <h4>What you can do:</h4>
            <ul>
              <li>Review our terms of service and community guidelines</li>
              <li>Contact our support team if you believe this is an error</li>
              <li>Provide any additional information that might help resolve the issue</li>
            </ul>
          </div>
          
          <div class="footer">
            <p>This is an automated notification. Please contact support if you have questions.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private getAccountReactivationTemplate(
    userName: string,
    reactivatedBy: string
  ): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Account Reactivated</title>
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            margin: 0;
            padding: 0;
            background-color: #f9f9f9;
          }
          .container { 
            max-width: 600px; 
            margin: 0 auto; 
            padding: 20px;
            background-color: #ffffff;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          .header { 
            text-align: center; 
            padding: 20px 0;
            border-bottom: 2px solid #28a745;
          }
          .success-box {
            background-color: #d4edda;
            border-left: 4px solid #28a745;
            padding: 15px;
            border-radius: 4px;
            margin: 20px 0;
          }
          .next-steps {
            background-color: #d1ecf1;
            border-left: 4px solid #17a2b8;
            padding: 15px;
            border-radius: 4px;
            margin: 20px 0;
          }
          .footer { 
            margin-top: 30px; 
            font-size: 12px; 
            color: #666;
            text-align: center;
            border-top: 1px solid #eee;
            padding-top: 20px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>✅ Account Reactivated</h2>
          </div>
          
          <p>Hello <strong>${userName},</strong></p>
          <p>Great news! Your account has been successfully reactivated.</p>
          
          <div class="success-box">
            <h3>Reactivation Details:</h3>
            <p><strong>Reactivated By:</strong> ${reactivatedBy}</p>
            <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
          </div>
          
          <p>You now have full access to your account and all our services. We're glad to have you back!</p>
          
          <div class="next-steps">
            <h4>Next Steps:</h4>
            <ul>
              <li>Log in to your account with your existing credentials</li>
              <li>Review any changes that may have occurred during the suspension</li>
              <li>Ensure you're familiar with our terms of service</li>
              <li>Contact support if you have any questions</li>
            </ul>
          </div>
          
          <div class="footer">
            <p>Welcome back! This is an automated notification.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}

// // src/lib/services/email.ts
// import nodemailer from "nodemailer";
// import { logger } from "@/lib/logger";

// export interface EmailOptions {
//   to: string;
//   subject: string;
//   html: string;
//   text?: string;
// }

// export class EmailService {
//   private static instance: EmailService;
//   private transporter: nodemailer.Transporter;

//   private constructor() {
//     const port = parseInt(process.env.SMTP_PORT || "587");
//     const secure = process.env.SMTP_SECURE
//       ? process.env.SMTP_SECURE === "true"
//       : port === 465; // default to SSL for 465, TLS otherwise

//     this.transporter = nodemailer.createTransport({
//       host: process.env.SMTP_HOST,
//       port,
//       secure, // true for SSL, false for TLS
//       auth: {
//         user: process.env.SMTP_USER,
//         pass: process.env.SMTP_PASSWORD,
//       },
//     });

//     // Verify connection configuration
//     this.verifyConnection();
//   }

//   static getInstance(): EmailService {
//     if (!EmailService.instance) {
//       EmailService.instance = new EmailService();
//     }
//     return EmailService.instance;
//   }

//   private async verifyConnection(): Promise<void> {
//     try {
//       await this.transporter.verify();
//       logger.info("SMTP connection successfully");
//     } catch (error) {
//       logger.error("SMTP connection failed", {
//         error: error instanceof Error ? error.message : String(error),
//       });
//     }
//   }

//   /**
//    * Generic email sending method
//    */
//   private async sendMail(options: EmailOptions): Promise<void> {
//     try {
//       const from =
//         process.env.SMTP_FROM || process.env.SMTP_USER || "noreply@cecms.com";

//       const mailOptions: nodemailer.SendMailOptions = {
//         from: `"CECMS" <${from}>`,
//         to: options.to,
//         subject: options.subject,
//         html: options.html,
//         text: options.text,
//       };

//       await this.transporter.sendMail(mailOptions);
//     } catch (error) {
//       logger.error("Failed to send email", {
//         error: error instanceof Error ? error.message : String(error),
//         to: options.to,
//         subject: options.subject,
//       });
//       throw error;
//     }
//   }

//   /**
//    * Get the appropriate base URL for links
//    * Uses private LAN URL for development, public URL for production
//    */
//   getBaseUrl(): string {
//     // In development, use the private LAN URL
//     if (process.env.NODE_ENV === "development") {
//       return process.env.NEXT_PRIVATE_APP_URL || "https://192.168.0.159:3002";
//     }

//     // In production, use the public URL
//     return process.env.NEXT_PUBLIC_APP_URL || "https://cecms.vercel.app";
//   }

//   async sendPasswordResetEmail(
//     email: string,
//     token: string,
//     userId: string
//   ): Promise<boolean> {
//     try {
//       const baseUrl = this.getBaseUrl();
//       const resetLink = `${baseUrl}/auth/reset-password?token=${token}&userId=${userId}`;

//       const emailOptions: EmailOptions = {
//         to: email,
//         subject: "Password Reset Request",
//         html: this.getPasswordResetTemplate(resetLink),
//         text: `Please click the following link to reset your password: ${resetLink}`,
//       };

//       await this.sendMail(emailOptions);

//       logger.info("Password reset email sent", {
//         email,
//         userId,
//         baseUrlUsed: baseUrl,
//       });
//       return true;
//     } catch (error) {
//       logger.error("Failed to send password reset email", {
//         error: error instanceof Error ? error.message : String(error),
//         email,
//         userId,
//       });
//       return false;
//     }
//   }

//   async sendPasswordChangedEmail(
//     email: string,
//     userName: string
//   ): Promise<boolean> {
//     try {
//       const emailOptions: EmailOptions = {
//         to: email,
//         subject: "Password Changed Successfully",
//         html: this.getPasswordChangedTemplate(userName),
//         text: `Your password has been successfully changed. If you didn't make this change, please contact support immediately.`,
//       };

//       await this.sendMail(emailOptions);

//       logger.info("Password changed email sent", {
//         email,
//         userName,
//       });
//       return true;
//     } catch (error) {
//       logger.error("Failed to send password changed email", {
//         error: error instanceof Error ? error.message : String(error),
//         email,
//         userName,
//       });
//       return false;
//     }
//   }

//   /**
//    * Send welcome email to new users
//    */
//   async sendWelcomeEmail(
//     email: string,
//     userName: string,
//     tempPassword?: string
//   ): Promise<boolean> {
//     try {
//       const baseUrl = this.getBaseUrl();
//       const loginLink = `${baseUrl}/auth/signin`;

//       const emailOptions: EmailOptions = {
//         to: email,
//         subject: "Welcome to Our Platform",
//         html: this.getWelcomeTemplate(userName, tempPassword),
//         text: `Welcome ${userName}! Your account has been successfully created.${
//           tempPassword ? ` Your temporary password is: ${tempPassword}` : ""
//         } Login at: ${loginLink}`,
//       };

//       await this.sendMail(emailOptions);

//       logger.info("Welcome email sent", {
//         email,
//         userName,
//         baseUrlUsed: baseUrl,
//       });
//       return true;
//     } catch (error) {
//       logger.error("Failed to send welcome email", {
//         error: error instanceof Error ? error.message : String(error),
//         email,
//         userName,
//       });
//       return false;
//     }
//   }

//   /**
//    * Send email verification email
//    */
//   async sendVerificationEmail(
//     email: string,
//     token: string,
//     userName: string
//   ): Promise<boolean> {
//     try {
//       const baseUrl = this.getBaseUrl();
//       const verificationLink = `${baseUrl}/api/auth/verify-email?token=${token}&email=${encodeURIComponent(
//         email
//       )}`;

//       const emailOptions: EmailOptions = {
//         to: email,
//         subject: "Verify Your Email Address",
//         html: this.getVerificationTemplate(userName, verificationLink),
//         text: `Please verify your email address by clicking this link: ${verificationLink}`,
//       };

//       await this.sendMail(emailOptions);

//       logger.info("Verification email sent", {
//         email,
//         userName,
//         baseUrlUsed: baseUrl,
//       });
//       return true;
//     } catch (error) {
//       logger.error("Failed to send verification email", {
//         error: error instanceof Error ? error.message : String(error),
//         email,
//         userName,
//       });
//       return false;
//     }
//   }

//   private getPasswordResetTemplate(resetLink: string): string {
//     return `
//       <!DOCTYPE html>
//       <html>
//       <head>
//         <meta charset="utf-8">
//         <meta name="viewport" content="width=device-width, initial-scale=1.0">
//         <title>Password Reset</title>
//         <style>
//           body {
//             font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
//             line-height: 1.6;
//             color: #333;
//             margin: 0;
//             padding: 0;
//             background-color: #f9f9f9;
//           }
//           .container {
//             max-width: 600px;
//             margin: 0 auto;
//             padding: 20px;
//             background-color: #ffffff;
//             border-radius: 8px;
//             box-shadow: 0 2px 10px rgba(0,0,0,0.1);
//           }
//           .header {
//             text-align: center;
//             padding: 20px 0;
//             border-bottom: 2px solid #007bff;
//           }
//           .button {
//             display: inline-block;
//             padding: 12px 24px;
//             background-color: #007bff;
//             color: white;
//             text-decoration: none;
//             border-radius: 4px;
//             margin: 20px 0;
//           }
//           .footer {
//             margin-top: 30px;
//             font-size: 12px;
//             color: #666;
//             text-align: center;
//             border-top: 1px solid #eee;
//             padding-top: 20px;
//           }
//           .code-block {
//             background-color: #f8f9fa;
//             padding: 15px;
//             border-radius: 4px;
//             border-left: 4px solid #007bff;
//             margin: 20px 0;
//             word-break: break-all;
//             font-family: monospace;
//           }
//           .warning {
//             background-color: #fff3cd;
//             border-left: 4px solid #ffc107;
//             padding: 15px;
//             border-radius: 4px;
//             margin: 20px 0;
//           }
//         </style>
//       </head>
//       <body>
//         <div class="container">
//           <div class="header">
//             <h2>Password Reset Request</h2>
//           </div>

//           <p>Hello,</p>
//           <p>You requested to reset your password. Click the button below to proceed:</p>

//           <div style="text-align: center;">
//             <a href="${resetLink}" class="button">Reset Password</a>
//           </div>

//           <p>If the button doesn't work, copy and paste this link into your browser:</p>

//           <div class="code-block">
//             ${resetLink}
//           </div>

//           <div class="warning">
//             <p><strong>⚠️ This link will expire in 1 hour for security reasons.</strong></p>
//           </div>

//           <p>If you're on a local network, make sure you're connected to the same network as the server.</p>

//           <div class="footer">
//             <p>If you didn't request this password reset, please ignore this email or contact our support team immediately.</p>
//             <p>This is an automated message. Please do not reply to this email.</p>
//           </div>
//         </div>
//       </body>
//       </html>
//     `;
//   }

//   private getVerificationTemplate(
//     userName: string,
//     verificationLink: string
//   ): string {
//     return `
//       <!DOCTYPE html>
//       <html>
//       <head>
//         <meta charset="utf-8">
//         <meta name="viewport" content="width=device-width, initial-scale=1.0">
//         <title>Verify Your Email</title>
//         <style>
//           body {
//             font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
//             line-height: 1.6;
//             color: #333;
//             margin: 0;
//             padding: 0;
//             background-color: #f9f9f9;
//           }
//           .container {
//             max-width: 600px;
//             margin: 0 auto;
//             padding: 20px;
//             background-color: #ffffff;
//             border-radius: 8px;
//             box-shadow: 0 2px 10px rgba(0,0,0,0.1);
//           }
//           .header {
//             text-align: center;
//             padding: 20px 0;
//             border-bottom: 2px solid #28a745;
//           }
//           .button {
//             display: inline-block;
//             padding: 12px 24px;
//             background-color: #28a745;
//             color: white;
//             text-decoration: none;
//             border-radius: 4px;
//             margin: 20px 0;
//           }
//           .footer {
//             margin-top: 30px;
//             font-size: 12px;
//             color: #666;
//             text-align: center;
//             border-top: 1px solid #eee;
//             padding-top: 20px;
//           }
//           .code-block {
//             background-color: #f8f9fa;
//             padding: 15px;
//             border-radius: 4px;
//             border-left: 4px solid #28a745;
//             margin: 20px 0;
//             word-break: break-all;
//             font-family: monospace;
//           }
//         </style>
//       </head>
//       <body>
//         <div class="container">
//           <div class="header">
//             <h2>Verify Your Email Address</h2>
//           </div>

//           <p>Hello, <strong>${userName},</strong></p>
//           <p>Thank you for signing up! Please verify your email address to complete your registration.</p>

//           <div style="text-align: center;">
//             <a href="${verificationLink}" class="button">Verify Email</a>
//           </div>

//           <p>If the button doesn't work, copy and paste this link into your browser:</p>

//           <div class="code-block">
//             ${verificationLink}
//           </div>

//           <p>If you're on a local network, make sure you're connected to the same network as the server.</p>

//           <div class="footer">
//             <p>If you didn't create an account with us, please ignore this email.</p>
//             <p>This is an automated message. Please do not reply to this email.</p>
//           </div>
//         </div>
//       </body>
//       </html>
//     `;
//   }

//   private getPasswordChangedTemplate(userName: string): string {
//     return `
//       <!DOCTYPE html>
//       <html>
//       <head>
//         <meta charset="utf-8">
//         <meta name="viewport" content="width=device-width, initial-scale=1.0">
//         <title>Password Changed</title>
//         <style>
//           body {
//             font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
//             line-height: 1.6;
//             color: #333;
//             margin: 0;
//             padding: 0;
//             background-color: #f9f9f9;
//           }
//           .container {
//             max-width: 600px;
//             margin: 0 auto;
//             padding: 20px;
//             background-color: #ffffff;
//             border-radius: 8px;
//             box-shadow: 0 2px 10px rgba(0,0,0,0.1);
//           }
//           .header {
//             text-align: center;
//             padding: 20px 0;
//             border-bottom: 2px solid #28a745;
//           }
//           .alert {
//             background-color: #d4edda;
//             padding: 15px;
//             border-left: 4px solid #28a745;
//             border-radius: 4px;
//             margin: 20px 0;
//           }
//           .footer {
//             margin-top: 30px;
//             font-size: 12px;
//             color: #666;
//             text-align: center;
//             border-top: 1px solid #eee;
//             padding-top: 20px;
//           }
//         </style>
//       </head>
//       <body>
//         <div class="container">
//           <div class="header">
//             <h2>Password Changed Successfully</h2>
//           </div>

//           <div class="alert">
//             <p><strong>Hello ${userName},</strong></p>
//             <p>Your password has been successfully changed.</p>
//           </div>

//           <p>If you did not make this change, please contact our support team immediately as your account may be compromised.</p>

//           <div class="footer">
//             <p>This is an automated message. Please do not reply to this email.</p>
//           </div>
//         </div>
//       </body>
//       </html>
//     `;
//   }

//   private getWelcomeTemplate(userName: string, tempPassword?: string): string {
//     return `
//       <!DOCTYPE html>
//       <html>
//       <head>
//         <meta charset="utf-8">
//         <meta name="viewport" content="width=device-width, initial-scale=1.0">
//         <title>Welcome</title>
//         <style>
//           body {
//             font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
//             line-height: 1.6;
//             color: #333;
//             margin: 0;
//             padding: 0;
//             background-color: #f9f9f9;
//           }
//           .container {
//             max-width: 600px;
//             margin: 0 auto;
//             padding: 20px;
//             background-color: #ffffff;
//             border-radius: 8px;
//             box-shadow: 0 2px 10px rgba(0,0,0,0.1);
//           }
//           .header {
//             text-align: center;
//             padding: 20px 0;
//             border-bottom: 2px solid #007bff;
//           }
//           .footer {
//             margin-top: 30px;
//             font-size: 12px;
//             color: #666;
//             text-align: center;
//             border-top: 1px solid #eee;
//             padding-top: 20px;
//           }
//           .code-block {
//             background-color: #f8f9fa;
//             padding: 15px;
//             border-radius: 4px;
//             border-left: 4px solid #007bff;
//             margin: 20px 0;
//             word-break: break-all;
//           }
//         </style>
//       </head>
//       <body>
//         <div class="container">
//           <div class="header">
//             <h2>Welcome to Our Platform!</h2>
//           </div>

//           <p><strong>Hello ${userName},</strong></p>
//           <p>Your account has been successfully created and is ready to use.</p>

//           ${
//             tempPassword
//               ? `
//           <p>Your temporary password is:</p>
//           <div class="code-block">
//             <strong>${tempPassword}</strong>
//           </div>
//           <p>Please change your password after your first login for security reasons.</p>
//           `
//               : ""
//           }

//           <p>You can now sign in to your account and start using our services.</p>

//           <div class="footer">
//             <p>If you have any questions, please contact our support team.</p>
//             <p>This is an automated message. Please do not reply to this email.</p>
//           </div>
//         </div>
//       </body>
//       </html>
//     `;
//   }
// }
