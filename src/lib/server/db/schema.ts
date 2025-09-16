// src/db/schema.ts
import * as crypto from "crypto";
import {
  pgTable,
  text,
  boolean,
  timestamp,
  integer,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ------------------------
// Center Model
// ------------------------
export const centers = pgTable(
  "centers",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    number: text("number").notNull().unique(),
    name: text("name").notNull(),
    address: text("address").notNull(),
    state: text("state").notNull(),
    lga: text("lga").notNull(),
    isActive: boolean("isActive").notNull().default(true),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    createdBy: text("createdBy").notNull(),
    createdById: text("createdById")
      .notNull()
      .references(() => admins.id, { onDelete: "set default" })
      .default("system"),
    modifiedBy: text("modifiedBy"),
    modifiedAt: timestamp("modifiedAt").$onUpdateFn(() => new Date()),
    modifiedById: text("modifiedById")
      .notNull()
      .references(() => admins.id, { onDelete: "set default" })
      .default("system"),
  },
  (table) => [
    uniqueIndex("center_name_state_lga_unique").on(
      table.name,
      table.state,
      table.lga
    ),
    index("idx_center_state").on(table.state),
    index("idx_center_lga").on(table.lga),
    index("idx_center_is_active").on(table.isActive),
    index("idx_center_created_at").on(table.createdAt),
    index("idx_center_name").on(table.name),
    index("idx_center_number").on(table.number),
    index("idx_center_state_lga").on(table.state, table.lga),
    index("idx_center_lga_is_active").on(table.lga, table.isActive),
    index("idx_center_state_is_active").on(table.state, table.isActive),
    index("idx_center_created_by").on(table.createdBy),
    index("idx_center_modified_by").on(table.modifiedBy),
    index("idx_center_modified_at").on(table.modifiedAt),
    index("idx_center_created_at_is_active").on(
      table.createdAt,
      table.isActive
    ),
    // Add indexes for the foreign keys
    index("idx_center_created_by_id").on(table.createdById),
    index("idx_center_modified_by_id").on(table.modifiedById),
  ]
);

// ------------------------
// Admin Model
// ------------------------
export const admins = pgTable(
  "admins",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    email: text("email").notNull().unique(),
    password: text("password").notNull(),
    name: text("name").notNull(),
    role: text("role").notNull().default("ADMIN"),
    isActive: boolean("isActive").notNull().default(true),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
  },
  (table) => [
    index("idx_admin_email").on(table.email),
    index("idx_admin_is_active").on(table.isActive),
    index("idx_admin_role").on(table.role),
    index("idx_admin_created_at").on(table.createdAt),
  ]
);

// ------------------------
// AdminSession Model
// ------------------------
export const adminSessions = pgTable(
  "admin_sessions",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    adminId: text("adminId")
      .notNull()
      .references(() => admins.id, { onDelete: "cascade" }),
    sessionId: text("sessionId").notNull().unique(),
    token: text("token").notNull().unique(),
    isActive: boolean("isActive").notNull().default(true),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    expiresAt: timestamp("expiresAt").notNull(),
    lastUsed: timestamp("lastUsed").notNull().defaultNow(),
    userAgent: text("userAgent"),
    ipAddress: text("ipAddress"),
    location: text("location"),
    deviceType: text("deviceType"),
  },
  (table) => [
    index("idx_admin_session_is_active").on(table.isActive),
    index("idx_admin_session_created_at").on(table.createdAt),
    index("idx_admin_session_expires_at").on(table.expiresAt),
    index("idx_admin_session_last_used").on(table.lastUsed),
    index("idx_admin_session_ip_address").on(table.ipAddress),
    index("idx_admin_session_device_type").on(table.deviceType),
  ]
);

// ------------------------
// PasswordReset Model
// ------------------------
export const passwordResets = pgTable(
  "password_resets",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    adminId: text("adminId")
      .notNull()
      .references(() => admins.id, { onDelete: "cascade" }),
    token: text("token").notNull().unique(),
    isUsed: boolean("isUsed").notNull().default(false),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    expiresAt: timestamp("expiresAt").notNull(),
  },
  (table) => [
    index("idx_password_reset_is_used").on(table.isUsed),
    index("idx_password_reset_created_at").on(table.createdAt),
    index("idx_password_reset_expires_at").on(table.expiresAt),
  ]
);

// ------------------------
// ApiLog Model
// ------------------------
export const apiLogs = pgTable(
  "api_logs",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    endpoint: text("endpoint").notNull(),
    method: text("method").notNull(),
    status: integer("status").notNull(),
    request: text("request").notNull(),
    response: text("response").notNull(),
    timestamp: timestamp("timestamp").notNull().defaultNow(),
  },
  (table) => [
    index("idx_api_log_endpoint").on(table.endpoint),
    index("idx_api_log_method").on(table.method),
    index("idx_api_log_status").on(table.status),
    index("idx_api_log_timestamp").on(table.timestamp),
  ]
);

// ------------------------
// AdminActivity Model
// ------------------------
export const adminActivities = pgTable(
  "admin_activities",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    adminId: text("adminId")
      .notNull()
      .references(() => admins.id, { onDelete: "cascade" }),
    activity: text("activity").notNull(),
    timestamp: timestamp("timestamp").notNull().defaultNow(),
  },
  (table) => [
    index("idx_admin_activity_activity").on(table.activity),
    index("idx_admin_activity_timestamp").on(table.timestamp),
  ]
);

// ------------------------
// AuditLog Model
// ------------------------
export const auditLogs = pgTable(
  "audit_logs",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    adminId: text("adminId")
      .notNull()
      .references(() => admins.id, { onDelete: "cascade" }),
    action: text("action").notNull(),
    entity: text("entity").notNull(),
    entityId: text("entityId").notNull(),
    timestamp: timestamp("timestamp").notNull().defaultNow(),
    details: text("details"),
  },
  (table) => [
    index("idx_audit_log_action").on(table.action),
    index("idx_audit_log_entity").on(table.entity),
  ]
);

// ------------------------
// Relations
// ------------------------
export const adminRelations = relations(admins, ({ many }) => ({
   sessions: many(adminSessions),
  passwordResets: many(passwordResets),
  auditLogs: many(auditLogs),
  adminActivities: many(adminActivities),
  // Add reverse relations for centers
  createdCenters: many(centers, { relationName: "center_created_by" }),
  modifiedCenters: many(centers, { relationName: "center_modified_by" }),
}));

// ------------------------
// Relations
// ------------------------
export const centerRelations = relations(centers, ({ one }) => ({
  createdByAdmin: one(admins, {
    fields: [centers.createdById],
    references: [admins.id],
    relationName: "center_created_by",
  }),
  modifiedByAdmin: one(admins, {
    fields: [centers.modifiedById],
    references: [admins.id],
    relationName: "center_modified_by",
  }),
}));

export const adminSessionRelations = relations(adminSessions, ({ one }) => ({
  admin: one(admins, {
    fields: [adminSessions.adminId],
    references: [admins.id],
  }),
}));

export const passwordResetRelations = relations(passwordResets, ({ one }) => ({
  admin: one(admins, {
    fields: [passwordResets.adminId],
    references: [admins.id],
  }),
}));

export const adminActivityRelations = relations(adminActivities, ({ one }) => ({
  admin: one(admins, {
    fields: [adminActivities.adminId],
    references: [admins.id],
  }),
}));

export const auditLogRelations = relations(auditLogs, ({ one }) => ({
  admin: one(admins, { fields: [auditLogs.adminId], references: [admins.id] }),
}));

// ------------------------
// Inferred Types
// ------------------------
export type NewCenter = typeof centers.$inferInsert;
export type NewAdmin = typeof admins.$inferInsert;
export type AdminSession = typeof adminSessions.$inferSelect;
export type NewAdminSession = typeof adminSessions.$inferInsert;
export type PasswordReset = typeof passwordResets.$inferSelect;
export type NewPasswordReset = typeof passwordResets.$inferInsert;
export type ApiLog = typeof apiLogs.$inferSelect;
export type NewApiLog = typeof apiLogs.$inferInsert;
export type AdminActivity = typeof adminActivities.$inferSelect;
export type NewAdminActivity = typeof adminActivities.$inferInsert;
export type AuditLog = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;

// ------------------------
// Inferred Types with Relations
// ------------------------
export type Center = typeof centers.$inferSelect & {
  createdByAdmin?: Admin;
  modifiedByAdmin?: Admin;
};

export type Admin = typeof admins.$inferSelect & {
  createdCenters?: Center[];
  modifiedCenters?: Center[];
};



