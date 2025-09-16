// lib/logger.ts
import { randomUUID } from "crypto";

export interface LogContext {
  requestId?: string;
  ip?: string;
  userId?: string;
  sessionId?: string;
  token?: string; // Added token property
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
  info: (msg: string, ctx: LogContext = {}, extra: Record<string, unknown> = {}) =>
    console.log(format("INFO", msg, ctx, extra)),
  warn: (msg: string, ctx: LogContext = {}, extra: Record<string, unknown> = {}) =>
    console.warn(format("WARN", msg, ctx, extra)),
  error: (msg: string, ctx: LogContext = {}, extra: Record<string, unknown> = {}) =>
    console.error(format("ERROR", msg, ctx, extra)),
  requestId: () => randomUUID(),
};
