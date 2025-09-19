// src/lib/services/email.ts
import nodemailer from "nodemailer";
import { logger } from "@/lib/logger";

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export class EmailService {
  private static instance: EmailService;
  private transporter: nodemailer.Transporter;

  private constructor() {
    // Initialize nodemailer transporter
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_SECURE === "false",
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

  /**
   * Get the appropriate base URL for links
   * Uses private LAN URL for development, public URL for production
   */
  private getBaseUrl(): string {
    // Use private LAN URL for development if available
    if (
      process.env.NODE_ENV !== "development" &&
      process.env.NEXT_PUBLIC_APP_URL
    ) {
      return process.env.NEXT_PUBLIC_APP_URL;
    }

    // Fall back to public URL
    return process.env.NEXT_PRIVATE_APP_URL || "http://192.168.0.159:3002";
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

      // Send email in all environments
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

  // async sendPasswordResetEmail(
  //   email: string,
  //   token: string,
  //   userId: string
  // ): Promise<boolean> {
  //   try {
  //     const baseUrl = this.getBaseUrl();
  //     // Don't include token in URL anymore
  //     const resetLink = `${baseUrl}/auth/reset-password`;

  //     const emailOptions: EmailOptions = {
  //       to: email,
  //       subject: "Password Reset Request",
  //       html: this.getPasswordResetTemplate(token, resetLink), // Pass token to template
  //       text: `Please use the following token to reset your password: ${token}\n\nGo to: ${resetLink}`,
  //     };

  //     const result = await this.sendEmail(emailOptions);

  //     if (result) {
  //       logger.info("Password reset email sent", {
  //         email,
  //         userId,
  //         messageId: result.messageId,
  //       });
  //       return true;
  //     }

  //     return false;
  //   } catch (err) {
  //     logger.error("Failed to send password reset email");
  //     return false;
  //   }
  // }

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
    userName: string
  ): Promise<boolean> {
    try {
      const baseUrl = this.getBaseUrl();
      const verificationLink = `${baseUrl}/auth/verify-email?token=${token}&email=${encodeURIComponent(
        email
      )}`;

      const emailOptions: EmailOptions = {
        to: email,
        subject: "Verify Your Email Address",
        html: this.getVerificationTemplate(userName, verificationLink),
        text: `Please verify your email address by clicking this link: ${verificationLink}`,
      };

      const result = await this.sendEmail(emailOptions);

      if (result) {
        logger.info("Verification email sent", {
          email,
          userName,
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
        userName,
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


//   private getPasswordResetTemplate(token: string, resetLink: string): string {
//   return `
//     <!DOCTYPE html>
//     <html>
//     <head>
//       <meta charset="utf-8">
//       <style>
//         body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
//         .container { max-width: 600px; margin: 0 auto; padding: 20px; }
//         .token-box { 
//           background-color: #f8f9fa; 
//           padding: 15px; 
//           border: 2px dashed #007bff;
//           border-radius: 5px;
//           margin: 20px 0;
//           font-family: monospace;
//           font-size: 16px;
//           text-align: center;
//         }
//         .button { 
//           display: inline-block; 
//           padding: 12px 24px; 
//           background-color: #007bff; 
//           color: white; 
//           text-decoration: none; 
//           border-radius: 4px; 
//         }
//       </style>
//     </head>
//     <body>
//       <div class="container">
//         <h2>Password Reset Request</h2>
//         <p>You requested to reset your password. Here is your reset token:</p>
        
//         <div class="token-box">
//           <strong>${token}</strong>
//         </div>
        
//         <p>Click the button below to go to the password reset page:</p>
//         <p><a href="${resetLink}" class="button">Reset Password</a></p>
        
//         <p><strong>Security Notice:</strong></p>
//         <ul>
//           <li>This token will expire in 1 hour</li>
//           <li>Do not share this token with anyone</li>
//           <li>You will need to enter this token on the reset page</li>
//         </ul>
//       </div>
//     </body>
//     </html>
//   `;
// }

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
          
          <p>Hello ${userName},</p>
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
}
