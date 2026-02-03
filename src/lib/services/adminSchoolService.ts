import { db } from "@/lib/server/db";
import { adminSchool } from "@/lib/server/db/schema";
import { eq, and, asc } from "drizzle-orm";

export class AdminSchoolService {
  /**
   * Assign (or reassign) a school to a new admin.
   * Safety check: only one active admin per school.
   *
   * @param schoolId - The school to assign
   * @param newAdminId - The admin user ID to assign to
   * @param tx - Optional transaction context
   * @returns The newly created assignment record
   */
  static async assignAdmin(
    schoolId: string,
    newAdminId: string,
    tx: typeof db | Parameters<typeof db.transaction>[0] | unknown = db
  ) {
    if (!schoolId || !newAdminId) {
      throw new Error("schoolId and newAdminId are required");
    }

    // Step 1: Check if there's an existing active assignment
    const dbTx = tx as typeof db;
    const existing = await dbTx.query.adminSchool.findFirst({
      where: and(
        eq(adminSchool.schoolId, schoolId),
        eq(adminSchool.isActive, true)
      ),
    });

    // If already assigned to the same admin, return existing assignment
    if (existing && existing.adminId === newAdminId) {
      return existing;
    }

    // Step 2: Deactivate existing assignment if found
    if (existing) {
      // Use the transaction object that supports .update
      const typedTx = tx as typeof db;
      await typedTx
        .update(adminSchool)
        .set({ isActive: false, revokedAt: new Date() })
        .where(eq(adminSchool.id, existing.id));
    }

    // Step 3: Create new assignment
    const typedTx = tx as typeof db;
    const [inserted] = await typedTx
      .insert(adminSchool)
      .values({
        schoolId,
        adminId: newAdminId,
        assignedAt: new Date(),
        isActive: true,
      })
      .returning();

    return inserted;
  }

  /**
   * Unassign the current admin from a school.
   *
   * @param schoolId - The school to unassign
   * @param tx - Optional transaction context
   * @returns The updated assignment record(s)
   */
  static async unassignAdmin(schoolId: string, tx = db) {
    if (!schoolId) {
      throw new Error("schoolId is required");
    }

    return await tx
      .update(adminSchool)
      .set({ isActive: false, revokedAt: new Date() })
      .where(
        and(
          eq(adminSchool.schoolId, schoolId),
          eq(adminSchool.isActive, true)
        )
      )
      .returning();
  }

  /**
   * Transfer all schools from one admin to another.
   * Uses a single transaction for consistency.
   *
   * @param oldAdminId - The admin to transfer schools from
   * @param newAdminId - The admin to transfer schools to
   * @returns Array of results for each school transfer
   */
  static async transferSchools(oldAdminId: string, newAdminId: string) {
    if (!oldAdminId || !newAdminId) {
      throw new Error("oldAdminId and newAdminId are required");
    }

    if (oldAdminId === newAdminId) {
      throw new Error("Cannot transfer schools to the same admin");
    }

    return await db.transaction(async (tx) => {
      const activeAssignments = await tx.query.adminSchool.findMany({
        where: and(
          eq(adminSchool.adminId, oldAdminId),
          eq(adminSchool.isActive, true)
        ),
        columns: { schoolId: true },
      });

      const results: {
        schoolId: string | null;
        success: boolean;
        error?: string;
        result?: unknown;
      }[] = [];
      for (const { schoolId } of activeAssignments) {
        if (schoolId == null) {
          results.push({
            schoolId,
            success: false,
            error: "schoolId is null or undefined",
          });
          throw new Error("schoolId is null or undefined");
        }
        try {
          const result = await AdminSchoolService.assignAdmin(
            schoolId as string,
            newAdminId,
            tx
          );
          results.push({ schoolId, success: true, result });
        } catch (error) {
          results.push({
            schoolId,
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
          });
          // Re-throw to rollback entire transaction
          throw error;
        }
      }

      return results;
    });
  }

  /**
   * Reverse transfer (rollback).
   * Note: Only transfers schools that were assigned to newAdminId from oldAdminId.
   * This uses timestamp-based logic to avoid transferring unrelated schools.
   *
   * @param oldAdminId - The original admin
   * @param newAdminId - The admin to transfer back from
   * @param afterTimestamp - Only transfer schools assigned after this timestamp
   * @returns Array of results for each school transfer
   */
  static async rollbackTransfer(
    oldAdminId: string,
    newAdminId: string,
    afterTimestamp: Date
  ) {
    if (!oldAdminId || !newAdminId || !afterTimestamp) {
      throw new Error(
        "oldAdminId, newAdminId, and afterTimestamp are required"
      );
    }

    return await db.transaction(async (tx) => {
      // Only get schools assigned to newAdminId after the transfer timestamp
      const activeAssignments = await tx.query.adminSchool.findMany({
        where: and(
          eq(adminSchool.adminId, newAdminId),
          eq(adminSchool.isActive, true)
        ),
        columns: { schoolId: true, assignedAt: true },
      });

      // Filter to only schools assigned after the timestamp
      const recentAssignments = activeAssignments.filter(
        (a) => a.assignedAt >= afterTimestamp
      );

      const results: {
        schoolId: string | null;
        success: boolean;
        error?: string;
        result?: unknown;
      }[] = [];
      for (const { schoolId } of recentAssignments) {
        if (schoolId == null) {
          results.push({
            schoolId,
            success: false,
            error: "schoolId is null or undefined",
          });
          throw new Error("schoolId is null or undefined");
        }
        try {
          const result = await AdminSchoolService.assignAdmin(
            schoolId as string,
            oldAdminId,
            tx
          );
          results.push({ schoolId, success: true, result });
        } catch (error) {
          results.push({
            schoolId,
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
          });
          throw error;
        }
      }

      return results;
    });
  }

  /**
   * Get the current active admin for a school.
   *
   * @param schoolId - The school to query
   * @returns The active admin assignment with user details, or undefined
   */
  static async getCurrentAdmin(schoolId: string) {
    if (!schoolId) {
      throw new Error("schoolId is required");
    }

    return await db.query.adminSchool.findFirst({
      where: and(
        eq(adminSchool.schoolId, schoolId),
        eq(adminSchool.isActive, true)
      ),
      with: { admin: true }, // Changed from adminUser to admin
    });
  }

  /**
   * Get the full assignment history of a school.
   *
   * @param schoolId - The school to query
   * @returns Array of all assignments ordered by assignment date
   */
  static async getHistory(schoolId: string) {
    if (!schoolId) {
      throw new Error("schoolId is required");
    }

    return await db.query.adminSchool.findMany({
      where: eq(adminSchool.schoolId, schoolId),
      orderBy: asc(adminSchool.assignedAt),
      with: { admin: true }, // Changed from adminUser to admin
    });
  }

  /**
   * Get assignment history for multiple schools efficiently.
   *
   * @param schoolIds - Array of school IDs to query
   * @returns Map of schoolId to assignment history
   */
  static async getBulkHistory(schoolIds: string[]) {
    if (!schoolIds || schoolIds.length === 0) {
      return new Map();
    }

    const allAssignments = await db.query.adminSchool.findMany({
      where: and(eq(adminSchool.isActive, true)),
      orderBy: asc(adminSchool.assignedAt),
      with: { admin: true }, // Changed from adminUser to admin
    });

    // Group by schoolId
    const historyMap = new Map<string, typeof allAssignments>();
    for (const assignment of allAssignments) {
      if (assignment.schoolId == null) continue;
      const existing = historyMap.get(assignment.schoolId) || [];
      existing.push(assignment);
      historyMap.set(assignment.schoolId, existing);
    }

    return historyMap;
  }
}