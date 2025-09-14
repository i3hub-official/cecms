// lib/db.ts
import { prisma } from "./prisma";
import type { PrismaClient } from "@prisma/client";

export async function safeDbCall<T>(
  fn: (db: PrismaClient) => Promise<T>
): Promise<T> {
  try {
    return await fn(prisma);
  } catch (error) {
    console.error("Database error:", error);
    throw new Error("Database operation failed");
  }
}
