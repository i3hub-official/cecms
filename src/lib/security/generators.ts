import { db } from "@/lib/server/db/index";
import { adminSessions } from "@/lib/server/db/schema"; // Adjust import path as needed
import crypto from "crypto";

// Generate registration number
export const generateRegistrationNumber = (): string => {
  const prefix = "CEC";
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.random().toString(36).substr(2, 3).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
};

export async function generateAuthToken(adminId: string, req?: Request) {
  const plainToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto
    .createHash("sha256")
    .update(plainToken)
    .digest("hex");

  const sessionId = crypto.randomUUID(); // Generate a unique session ID

  let ipAddress: string | undefined;
  let userAgent: string | undefined;
  if (req) {
    ipAddress = req.headers.get("x-forwarded-for") || undefined;
    userAgent = req.headers.get("user-agent") || undefined;
  }

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  await db.insert(adminSessions).values({
    adminId,
    sessionId,
    token: tokenHash, // Store the hashed token
    isActive: true,
    createdAt: new Date(),
    expiresAt,
    lastUsed: new Date(),
    userAgent,
    ipAddress,
    // location and deviceType can be null or set later
    location: null,
    deviceType: null,
  });

  return plainToken; // Return the plain token for the client
}
