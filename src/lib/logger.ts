// lib/logger.ts
import { randomUUID } from "crypto";

export interface LogContext {
  requestId?: string;
  ip?: string;
  userId?: string;
  email?: string;
  action?: string;
  resource?: string;
  statusCode?: number;
  error?: string;
  durationMs?: number;
  adminId?: string;
  adminEmail?: string;
  adminRole?: string;
  sessionId?: string;
  lastUsed?: string;
  expiresAt?: string;
  isActive?: boolean;
  userAgent?: string;
  ipAddress?: string;
  success?: boolean;
  cleanedCount?: number;
  resetLink?: string;
  userName?: string;
  nameLength?: number;
  name?: string;
  phone?: string;
  phoneLength?: number;
  passwordLength?: number;
  hasToken?: boolean;
  token?: string;
  status?: number;
  stack?: string;
  statusText?: string;
  count?: number;
  messageId?: string;
  to?: string;
  subject?: string;
  baseUrlUsed?: string;
}

function format(
  level: string,
  message: string,
  context: LogContext = {},
  extra: Record<string, unknown> = {}
) {
  const log = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...context,
    ...extra,
  };
  return JSON.stringify(log);
}

export const logger = {
  info: (
    msg: string,
    ctx: LogContext = {},
    extra: Record<string, unknown> = {}
  ) => {
    if (process.env.NODE_ENV !== "production") {
      console.error(format("INFO", msg, ctx, extra));
    }
  },
  warn: (
    msg: string,
    ctx: LogContext = {},
    extra: Record<string, unknown> = {}
  ) => {
    if (process.env.NODE_ENV !== "production") {
      console.error(format("WARN", msg, ctx, extra));
    }
  },
  error: (
    msg: string,
    ctx: LogContext = {},
    extra: Record<string, unknown> = {}
  ) => {
    if (process.env.NODE_ENV !== "production") {
      console.error(format("ERROR", msg, ctx, extra));
    }
  },
  debug: (
    msg: string,
    ctx: LogContext = {},
    extra: Record<string, unknown> = {}
  ) => {
    if (process.env.NODE_ENV !== "production") {
      console.debug(format("DEBUG", msg, ctx, extra));
    }
  },
  // Generates a new UUID for each request
  requestId: () => randomUUID(),
};
