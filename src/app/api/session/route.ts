// src/app/api/admin/sessions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { eq, and, gt } from 'drizzle-orm';
import { db } from '@/db';
import { adminSessions, admins } from '@/db/schema';
import { verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const adminId = verifyToken(token);
    
    if (!adminId) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Get all active sessions for the current admin
    const sessions = await db
      .select({
        id: adminSessions.id,
        sessionId: adminSessions.sessionId,
        createdAt: adminSessions.createdAt,
        lastUsed: adminSessions.lastUsed,
        expiresAt: adminSessions.expiresAt,
        userAgent: adminSessions.userAgent,
        ipAddress: adminSessions.ipAddress,
        location: adminSessions.location,
        deviceType: adminSessions.deviceType,
      })
      .from(adminSessions)
      .where(
        and(
          eq(adminSessions.adminId, adminId),
          eq(adminSessions.isActive, true),
          gt(adminSessions.expiresAt, new Date())
        )
      )
      .orderBy(adminSessions.lastUsed);

    return NextResponse.json({
      success: true,
      data: sessions,
    });
  } catch (error) {
    console.error('Failed to fetch sessions:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}