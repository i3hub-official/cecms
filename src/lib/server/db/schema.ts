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
  unique,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ------------------------
// AdminSchool Model
// ------------------------
export const adminSchool = pgTable(
  "admin_schools",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    adminId: text("admin_id").references(() => admins.id, {
      onDelete: "set null",
    }),
    schoolId: text("school_id").references(() => centers.id, {
      onDelete: "set null",
    }),
    assignedAt: timestamp("assigned_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    isActive: boolean("is_active").default(true).notNull(),
  },
  (table) => ({
    // ensures no duplicate admin-school pair
    adminSchoolUnique: uniqueIndex("admin_school_unique").on(
      table.adminId,
      table.schoolId
    ),

    // ensures only one active admin per school
    oneActiveAdminPerSchool: uniqueIndex("one_active_admin_per_school").on(
      table.schoolId,
      table.isActive
    ),

    schoolIdx: index("admin_school_school_idx").on(table.schoolId),
    adminIdx: index("admin_school_admin_idx").on(table.adminId),
    activeIdx: index("admin_school_active_idx").on(table.isActive),
  })
);

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
    mergedInto: text("mergedInto").references(() => centers.id, {
      onDelete: "set null",
    }),
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
    phone: text("phone").notNull().unique(),
    email: text("email").notNull().unique(),
    password: text("password").notNull(),
    name: text("name").notNull(),
    role: text("role").notNull().default("ADMIN"),
    isActive: boolean("isActive").notNull().default(true),
    isEmailVerified: boolean("isEmailVerified").notNull().default(false),
    // For future use
    twoFactorEnabled: boolean("twoFactorEnabled").notNull().default(false),
    twoFactorSecret: text("twoFactorSecret"),
    // Audit fields
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    updatedAt: timestamp("updatedAt").$onUpdateFn(() => new Date()),
    // Track last login time
    lastLogin: timestamp("lastLogin").notNull().defaultNow(),
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
// Email Verification Model
// ------------------------
export const emailVerifications = pgTable("email_verifications", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  adminId: text("admin_id")
    .notNull()
    .references(() => admins.id, { onDelete: "cascade" }),
  email: text("email").notNull(),
  token: text("token").notNull().unique(),
  expires: timestamp("expires").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  verifiedAt: timestamp("verified_at"),
});

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

// ===================================================================================
// API KEY MANAGEMENT TABLES - BEGIN
// ===================================================================================

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
// API Key Model
// ------------------------
export const apiKeys = pgTable(
  "api_keys",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    key: text("key").notNull().unique(), // Hashed API key
    prefix: text("prefix").notNull(), // First 8 chars for identification
    name: text("name").notNull(),
    description: text("description"),

    // Admin relationship
    adminId: text("admin_id")
      .notNull()
      .references(() => admins.id, { onDelete: "cascade" }),

    // Permissions
    canRead: boolean("can_read").default(true).notNull(),
    canWrite: boolean("can_write").default(false).notNull(),
    canDelete: boolean("can_delete").default(false).notNull(),
    canManageKeys: boolean("can_manage_keys").default(false).notNull(),

    // Scopes (comma-separated endpoints or wildcards)
    allowedEndpoints: text("allowed_endpoints").default("*").notNull(),

    // Rate limiting
    rateLimit: integer("rate_limit").default(100).notNull(), // Requests per minute
    rateLimitPeriod: integer("rate_limit_period").default(60).notNull(), // Seconds

    // Status
    isActive: boolean("is_active").default(true).notNull(),
    expiresAt: timestamp("expires_at"),
    revokedAt: timestamp("revoked_at"), // When it was manually revoked

    // Metadata
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    lastUsed: timestamp("last_used"),
    usageCount: integer("usage_count").default(0).notNull(),
  },
  (table) => [
    uniqueIndex("api_key_key_idx").on(table.key),
    index("api_key_prefix_idx").on(table.prefix),
    index("api_key_admin_id_idx").on(table.adminId),
    index("api_key_is_active_idx").on(table.isActive),
    index("api_key_created_at_idx").on(table.createdAt),
    index("api_key_expires_at_idx").on(table.expiresAt),
    index("api_key_revoked_at_idx").on(table.revokedAt),
  ]
);

// ------------------------
// API Usage Log Model
// ------------------------
export const apiUsageLogs = pgTable(
  "api_usage_logs",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    apiKeyId: text("api_key_id")
      .notNull()
      .references(() => apiKeys.id, { onDelete: "cascade" }),
    endpoint: text("endpoint").notNull(),
    method: text("method").notNull(),
    statusCode: integer("status_code").notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    requestTime: integer("request_time"), // Response time in ms
    requestSize: integer("request_size"), // Request size in bytes
    responseSize: integer("response_size"), // Response size in bytes
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("api_usage_api_key_id_idx").on(table.apiKeyId),
    index("api_usage_endpoint_idx").on(table.endpoint),
    index("api_usage_method_idx").on(table.method),
    index("api_usage_status_code_idx").on(table.statusCode),
    index("api_usage_created_at_idx").on(table.createdAt),
    index("api_usage_ip_address_idx").on(table.ipAddress),
  ]
);

// ------------------------
// API Rate Limit Model
// ------------------------
export const apiRateLimits = pgTable(
  "api_rate_limits",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    apiKeyId: text("api_key_id")
      .notNull()
      .references(() => apiKeys.id, { onDelete: "cascade" }),
    endpoint: text("endpoint").notNull(),
    requestCount: integer("request_count").default(0).notNull(),
    windowStart: timestamp("window_start").notNull(),
    windowEnd: timestamp("window_end").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("api_rate_limit_unique_idx").on(
      table.apiKeyId,
      table.endpoint,
      table.windowStart
    ),
    index("api_rate_limit_api_key_id_idx").on(table.apiKeyId),
    index("api_rate_limit_endpoint_idx").on(table.endpoint),
    index("api_rate_limit_window_start_idx").on(table.windowStart),
    index("api_rate_limit_window_end_idx").on(table.windowEnd),
  ]
);

// ------------------------
// Dispute Center Model (Drizzle)
// ------------------------
export const disputeCenters = pgTable(
  "dispute_centers",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),

    // Basic Information
    number: text("number").notNull().unique(),
    name: text("name").notNull(),
    address: text("address").notNull(),
    state: text("state").notNull(),
    lga: text("lga").notNull(),

    // Contact Info
    email: text("email").notNull(),
    phone: text("phone").notNull(),
    alternativePhone: text("alternative_phone")
      .notNull()
      .default("00000000000"),

    // Operational
    isActive: boolean("is_active").notNull().default(true),
    status: text("status").notNull().default("active"),

    // Dispute flag
    isDisputed: boolean("is_disputed").notNull().default(false),

    // Capacity
    maxCapacity: integer("max_capacity").notNull().default(50),
    currentCases: integer("current_cases").notNull().default(0),

    // Staff
    totalStaff: integer("total_staff").notNull().default(0),
    availableArbitrators: integer("available_arbitrators").notNull().default(0),

    // Audit
    createdAt: timestamp("created_at").notNull().defaultNow(),
    createdBy: text("created_by").notNull(),
    createdById: text("created_by_id")
      .notNull()
      .references(() => admins.id, { onDelete: "set default" })
      .default("system"),

    modifiedBy: text("modified_by"),
    modifiedAt: timestamp("modified_at").$onUpdateFn(() => new Date()),
    modifiedById: text("modified_by_id")
      .notNull()
      .references(() => admins.id, { onDelete: "set default" })
      .default("system"),

    // Soft delete
    deletedAt: timestamp("deleted_at"),
    deletedBy: text("deleted_by"),
    deletedById: text("deleted_by_id").references(() => admins.id, {
      onDelete: "set default",
    }),
  },
  (table) => [
    // Uniques
    uniqueIndex("dispute_center_number_unique").on(table.number),
    uniqueIndex("dispute_center_email_unique").on(table.email),
    uniqueIndex("dispute_center_name_state_lga_unique").on(
      table.name,
      table.state,
      table.lga
    ),

    // Indexes
    index("idx_dispute_center_is_disputed").on(table.isDisputed),
    index("idx_dispute_center_is_active").on(table.isActive),
    index("idx_dispute_center_status").on(table.status),
    index("idx_dispute_center_state").on(table.state),
    index("idx_dispute_center_lga").on(table.lga),
    index("idx_dispute_center_state_lga").on(table.state, table.lga),
    index("idx_dispute_center_email").on(table.email),
    index("idx_dispute_center_phone").on(table.phone),
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
  createdCenters: many(centers, { relationName: "center_created_by" }),
  modifiedCenters: many(centers, { relationName: "center_modified_by" }),
  adminSchool: many(adminSchool),
  apiKeys: many(apiKeys),
}));

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
  adminSchool: one(adminSchool, {
    fields: [centers.id],
    references: [adminSchool.schoolId],
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
  admin: one(admins, {
    fields: [auditLogs.adminId],
    references: [admins.id],
  }),
}));

export const apiKeyRelations = relations(apiKeys, ({ one, many }) => ({
  admin: one(admins, {
    fields: [apiKeys.adminId],
    references: [admins.id],
  }),
  usageLogs: many(apiUsageLogs),
  rateLimits: many(apiRateLimits),
}));

export const apiUsageLogRelations = relations(apiUsageLogs, ({ one }) => ({
  apiKey: one(apiKeys, {
    fields: [apiUsageLogs.apiKeyId],
    references: [apiKeys.id],
  }),
}));

export const apiRateLimitRelations = relations(apiRateLimits, ({ one }) => ({
  apiKey: one(apiKeys, {
    fields: [apiRateLimits.apiKeyId],
    references: [apiKeys.id],
  }),
}));

export const disputeCenterRelations = relations(disputeCenters, ({ one }) => ({
  createdByAdmin: one(admins, {
    fields: [disputeCenters.createdById],
    references: [admins.id],
  }),
  modifiedByAdmin: one(admins, {
    fields: [disputeCenters.modifiedById],
    references: [admins.id],
  }),
  deletedByAdmin: one(admins, {
    fields: [disputeCenters.deletedById],
    references: [admins.id],
  }),
}));

export const adminSchoolRelations = relations(adminSchool, ({ one }) => ({
  // Change from adminUser to admin
  admin: one(admins, {
    fields: [adminSchool.adminId],
    references: [admins.id],
  }),
  school: one(centers, {
    fields: [adminSchool.schoolId],
    references: [centers.id],
  }),
}));

// ------------------------
// Inferred Types with Relations
// ------------------------
export type Center = typeof centers.$inferSelect & {
  createdByAdmin?: Admin;
  modifiedByAdmin?: Admin;
  adminSchool?: {
    admin: Admin;
  } | null;
};

export type Admin = typeof admins.$inferSelect & {
  createdCenters?: Center[];
  modifiedCenters?: Center[];
  adminSchool?: {
    school: Center;
  }[];
  apiKeys?: ApiKey[];
};

export type ApiKeyWithRelations = ApiKey & {
  admin?: Admin;
  usageLogs?: ApiUsageLog[];
  rateLimits?: ApiRateLimit[];
};

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
// API Key Types
// ------------------------
export type ApiKey = typeof apiKeys.$inferSelect;
export type NewApiKey = typeof apiKeys.$inferInsert;
export type ApiUsageLog = typeof apiUsageLogs.$inferSelect;
export type NewApiUsageLog = typeof apiUsageLogs.$inferInsert;
export type ApiRateLimit = typeof apiRateLimits.$inferSelect;
export type NewApiRateLimit = typeof apiRateLimits.$inferInsert;

// Types
export type DisputeCenter = typeof disputeCenters.$inferSelect;
export type NewDisputeCenter = typeof disputeCenters.$inferInsert;



// // src/db/schema.ts
// import * as crypto from "crypto";
// import {
//   pgTable,
//   text,
//   boolean,
//   timestamp,
//   integer,
//   uniqueIndex,
//   index,
// } from "drizzle-orm/pg-core";
// import { relations } from "drizzle-orm";

// // ------------------------
// // Center Model
// // ------------------------
// export const centers = pgTable(
//   "centers",
//   {
//     id: text("id")
//       .primaryKey()
//       .$defaultFn(() => crypto.randomUUID()),
//     number: text("number").notNull().unique(),
//     name: text("name").notNull(),
//     address: text("address").notNull(),
//     state: text("state").notNull(),
//     lga: text("lga").notNull(),
//     isActive: boolean("isActive").notNull().default(true),
//     createdAt: timestamp("createdAt").notNull().defaultNow(),
//     createdBy: text("createdBy").notNull(),
//     createdById: text("createdById")
//       .notNull()
//       .references(() => admins.id, { onDelete: "set default" })
//       .default("system"),
//     modifiedBy: text("modifiedBy"),
//     modifiedAt: timestamp("modifiedAt").$onUpdateFn(() => new Date()),
//     modifiedById: text("modifiedById")
//       .notNull()
//       .references(() => admins.id, { onDelete: "set default" })
//       .default("system"),
//   },
//   (table) => [
//     uniqueIndex("center_name_state_lga_unique").on(
//       table.name,
//       table.state,
//       table.lga
//     ),
//     index("idx_center_state").on(table.state),
//     index("idx_center_lga").on(table.lga),
//     index("idx_center_is_active").on(table.isActive),
//     index("idx_center_created_at").on(table.createdAt),
//     index("idx_center_name").on(table.name),
//     index("idx_center_number").on(table.number),
//     index("idx_center_state_lga").on(table.state, table.lga),
//     index("idx_center_lga_is_active").on(table.lga, table.isActive),
//     index("idx_center_state_is_active").on(table.state, table.isActive),
//     index("idx_center_created_by").on(table.createdBy),
//     index("idx_center_modified_by").on(table.modifiedBy),
//     index("idx_center_modified_at").on(table.modifiedAt),
//     index("idx_center_created_at_is_active").on(
//       table.createdAt,
//       table.isActive
//     ),
//     // Add indexes for the foreign keys
//     index("idx_center_created_by_id").on(table.createdById),
//     index("idx_center_modified_by_id").on(table.modifiedById),
//   ]
// );

// // ------------------------
// // Admin Model
// // ------------------------
// export const admins = pgTable(
//   "admins",
//   {
//     id: text("id")
//       .primaryKey()
//       .$defaultFn(() => crypto.randomUUID()),
//     phone: text("phone").notNull().unique(),
//     email: text("email").notNull().unique(),
//     password: text("password").notNull(),
//     name: text("name").notNull(),
//     role: text("role").notNull().default("ADMIN"),
//     isActive: boolean("isActive").notNull().default(true),
//     isEmailVerified: boolean("isEmailVerified").notNull().default(false),
//     // For future use
//     twoFactorEnabled: boolean("twoFactorEnabled").notNull().default(false),
//     twoFactorSecret: text("twoFactorSecret"),
//     // Audit fields
//     createdAt: timestamp("createdAt").notNull().defaultNow(),
//     updatedAt: timestamp("updatedAt").$onUpdateFn(() => new Date()),
//     // Track last login time
//     lastLogin: timestamp("lastLogin").notNull().defaultNow(),
//   },
//   (table) => [
//     index("idx_admin_email").on(table.email),
//     index("idx_admin_is_active").on(table.isActive),
//     index("idx_admin_role").on(table.role),
//     index("idx_admin_created_at").on(table.createdAt),
//   ]
// );

// // ------------------------
// // AdminSession Model
// // ------------------------
// export const adminSessions = pgTable(
//   "admin_sessions",
//   {
//     id: text("id")
//       .primaryKey()
//       .$defaultFn(() => crypto.randomUUID()),
//     adminId: text("adminId")
//       .notNull()
//       .references(() => admins.id, { onDelete: "cascade" }),
//     sessionId: text("sessionId").notNull().unique(),
//     token: text("token").notNull().unique(),
//     isActive: boolean("isActive").notNull().default(true),
//     createdAt: timestamp("createdAt").notNull().defaultNow(),
//     expiresAt: timestamp("expiresAt").notNull(),
//     lastUsed: timestamp("lastUsed").notNull().defaultNow(),
//     userAgent: text("userAgent"),
//     ipAddress: text("ipAddress"),
//     location: text("location"),
//     deviceType: text("deviceType"),
//   },
//   (table) => [
//     index("idx_admin_session_is_active").on(table.isActive),
//     index("idx_admin_session_created_at").on(table.createdAt),
//     index("idx_admin_session_expires_at").on(table.expiresAt),
//     index("idx_admin_session_last_used").on(table.lastUsed),
//     index("idx_admin_session_ip_address").on(table.ipAddress),
//     index("idx_admin_session_device_type").on(table.deviceType),
//   ]
// );

// // ------------------------
// // PasswordReset Model
// // ------------------------
// export const passwordResets = pgTable(
//   "password_resets",
//   {
//     id: text("id")
//       .primaryKey()
//       .$defaultFn(() => crypto.randomUUID()),
//     adminId: text("adminId")
//       .notNull()
//       .references(() => admins.id, { onDelete: "cascade" }),
//     token: text("token").notNull().unique(),
//     isUsed: boolean("isUsed").notNull().default(false),
//     createdAt: timestamp("createdAt").notNull().defaultNow(),
//     expiresAt: timestamp("expiresAt").notNull(),
//   },
//   (table) => [
//     index("idx_password_reset_is_used").on(table.isUsed),
//     index("idx_password_reset_created_at").on(table.createdAt),
//     index("idx_password_reset_expires_at").on(table.expiresAt),
//   ]
// );

// // ------------------------
// // AdminActivity Model
// // ------------------------
// export const adminActivities = pgTable(
//   "admin_activities",
//   {
//     id: text("id")
//       .primaryKey()
//       .$defaultFn(() => crypto.randomUUID()),
//     adminId: text("adminId")
//       .notNull()
//       .references(() => admins.id, { onDelete: "cascade" }),
//     activity: text("activity").notNull(),
//     timestamp: timestamp("timestamp").notNull().defaultNow(),
//   },
//   (table) => [
//     index("idx_admin_activity_activity").on(table.activity),
//     index("idx_admin_activity_timestamp").on(table.timestamp),
//   ]
// );

// // ------------------------
// // Email Verification Model
// // ------------------------
// export const emailVerifications = pgTable("email_verifications", {
//   id: text("id")
//     .primaryKey()
//     .$defaultFn(() => crypto.randomUUID()),
//   adminId: text("admin_id")
//     .notNull()
//     .references(() => admins.id, { onDelete: "cascade" }),
//   email: text("email").notNull(),
//   token: text("token").notNull().unique(),
//   expires: timestamp("expires").notNull(),
//   createdAt: timestamp("created_at").defaultNow().notNull(),
//   verifiedAt: timestamp("verified_at"),
// });

// // ------------------------
// // AuditLog Model
// // ------------------------
// export const auditLogs = pgTable(
//   "audit_logs",
//   {
//     id: text("id")
//       .primaryKey()
//       .$defaultFn(() => crypto.randomUUID()),
//     adminId: text("adminId")
//       .notNull()
//       .references(() => admins.id, { onDelete: "cascade" }),
//     action: text("action").notNull(),
//     entity: text("entity").notNull(),
//     entityId: text("entityId").notNull(),
//     timestamp: timestamp("timestamp").notNull().defaultNow(),
//     details: text("details"),
//   },
//   (table) => [
//     index("idx_audit_log_action").on(table.action),
//     index("idx_audit_log_entity").on(table.entity),
//   ]
// );

// // ===================================================================================
// // API KEY MANAGEMENT TABLES - BEGIN
// // ===================================================================================

// // ------------------------
// // ApiLog Model
// // ------------------------
// export const apiLogs = pgTable(
//   "api_logs",
//   {
//     id: text("id")
//       .primaryKey()
//       .$defaultFn(() => crypto.randomUUID()),
//     endpoint: text("endpoint").notNull(),
//     method: text("method").notNull(),
//     status: integer("status").notNull(),
//     request: text("request").notNull(),
//     response: text("response").notNull(),
//     timestamp: timestamp("timestamp").notNull().defaultNow(),
//   },
//   (table) => [
//     index("idx_api_log_endpoint").on(table.endpoint),
//     index("idx_api_log_method").on(table.method),
//     index("idx_api_log_status").on(table.status),
//     index("idx_api_log_timestamp").on(table.timestamp),
//   ]
// );

// // ------------------------
// // API Key Model
// // ------------------------
// export const apiKeys = pgTable(
//   "api_keys",
//   {
//     id: text("id")
//       .primaryKey()
//       .$defaultFn(() => crypto.randomUUID()),
//     key: text("key").notNull().unique(), // Hashed API key
//     prefix: text("prefix").notNull(), // First 8 chars for identification
//     name: text("name").notNull(),
//     description: text("description"),

//     // Admin relationship
//     adminId: text("admin_id")
//       .notNull()
//       .references(() => admins.id, { onDelete: "cascade" }),

//     // Permissions
//     canRead: boolean("can_read").default(true).notNull(),
//     canWrite: boolean("can_write").default(false).notNull(),
//     canDelete: boolean("can_delete").default(false).notNull(),
//     canManageKeys: boolean("can_manage_keys").default(false).notNull(),

//     // Scopes (comma-separated endpoints or wildcards)
//     allowedEndpoints: text("allowed_endpoints").default("*").notNull(),

//     // Rate limiting
//     rateLimit: integer("rate_limit").default(100).notNull(), // Requests per minute
//     rateLimitPeriod: integer("rate_limit_period").default(60).notNull(), // Seconds

//     // Status
//     isActive: boolean("is_active").default(true).notNull(),
//     expiresAt: timestamp("expires_at"),
//     revokedAt: timestamp("revoked_at"), // When it was manually revoked

//     // Metadata
//     createdAt: timestamp("created_at").defaultNow().notNull(),
//     updatedAt: timestamp("updated_at").defaultNow().notNull(),
//     lastUsed: timestamp("last_used"),
//     usageCount: integer("usage_count").default(0).notNull(),
//   },
//   (table) => [
//     uniqueIndex("api_key_key_idx").on(table.key),
//     index("api_key_prefix_idx").on(table.prefix),
//     index("api_key_admin_id_idx").on(table.adminId),
//     index("api_key_is_active_idx").on(table.isActive),
//     index("api_key_created_at_idx").on(table.createdAt),
//     index("api_key_expires_at_idx").on(table.expiresAt),
//     index("api_key_revoked_at_idx").on(table.revokedAt),
//   ]
// );

// // ------------------------
// // API Usage Log Model
// // ------------------------
// export const apiUsageLogs = pgTable(
//   "api_usage_logs",
//   {
//     id: text("id")
//       .primaryKey()
//       .$defaultFn(() => crypto.randomUUID()),
//     apiKeyId: text("api_key_id")
//       .notNull()
//       .references(() => apiKeys.id, { onDelete: "cascade" }),
//     endpoint: text("endpoint").notNull(),
//     method: text("method").notNull(),
//     statusCode: integer("status_code").notNull(),
//     ipAddress: text("ip_address"),
//     userAgent: text("user_agent"),
//     requestTime: integer("request_time"), // Response time in ms
//     requestSize: integer("request_size"), // Request size in bytes
//     responseSize: integer("response_size"), // Response size in bytes
//     createdAt: timestamp("created_at").defaultNow().notNull(),
//   },
//   (table) => [
//     index("api_usage_api_key_id_idx").on(table.apiKeyId),
//     index("api_usage_endpoint_idx").on(table.endpoint),
//     index("api_usage_method_idx").on(table.method),
//     index("api_usage_status_code_idx").on(table.statusCode),
//     index("api_usage_created_at_idx").on(table.createdAt),
//     index("api_usage_ip_address_idx").on(table.ipAddress),
//   ]
// );

// // ------------------------
// // API Rate Limit Model
// // ------------------------
// export const apiRateLimits = pgTable(
//   "api_rate_limits",
//   {
//     id: text("id")
//       .primaryKey()
//       .$defaultFn(() => crypto.randomUUID()),
//     apiKeyId: text("api_key_id")
//       .notNull()
//       .references(() => apiKeys.id, { onDelete: "cascade" }),
//     endpoint: text("endpoint").notNull(),
//     requestCount: integer("request_count").default(0).notNull(),
//     windowStart: timestamp("window_start").notNull(),
//     windowEnd: timestamp("window_end").notNull(),
//     createdAt: timestamp("created_at").defaultNow().notNull(),
//     updatedAt: timestamp("updated_at").defaultNow().notNull(),
//   },
//   (table) => [
//     uniqueIndex("api_rate_limit_unique_idx").on(
//       table.apiKeyId,
//       table.endpoint,
//       table.windowStart
//     ),
//     index("api_rate_limit_api_key_id_idx").on(table.apiKeyId),
//     index("api_rate_limit_endpoint_idx").on(table.endpoint),
//     index("api_rate_limit_window_start_idx").on(table.windowStart),
//     index("api_rate_limit_window_end_idx").on(table.windowEnd),
//   ]
// );

// // ------------------------
// // API Key Relations
// // ------------------------
// export const apiKeyRelations = relations(apiKeys, ({ one, many }) => ({
//   admin: one(admins, {
//     fields: [apiKeys.adminId],
//     references: [admins.id],
//   }),
//   usageLogs: many(apiUsageLogs),
//   rateLimits: many(apiRateLimits),
// }));

// export const apiUsageLogRelations = relations(apiUsageLogs, ({ one }) => ({
//   apiKey: one(apiKeys, {
//     fields: [apiUsageLogs.apiKeyId],
//     references: [apiKeys.id],
//   }),
// }));

// export const apiRateLimitRelations = relations(apiRateLimits, ({ one }) => ({
//   apiKey: one(apiKeys, {
//     fields: [apiRateLimits.apiKeyId],
//     references: [apiKeys.id],
//   }),
// }));

// // ===================================================================================
// // API KEY MANAGEMENT TABLES - END
// // ===================================================================================

// // ------------------------
// // Dispute Center Model (Drizzle)
// // ------------------------
// export const disputeCenters = pgTable(
//   "dispute_centers",
//   {
//     id: text("id")
//       .primaryKey()
//       .$defaultFn(() => crypto.randomUUID()),

//     // Basic Information
//     number: text("number").notNull().unique(),
//     name: text("name").notNull(),
//     address: text("address").notNull(),
//     state: text("state").notNull(),
//     lga: text("lga").notNull(),

//     // Contact Info
//     email: text("email").notNull(),
//     phone: text("phone").notNull(),
//     alternativePhone: text("alternative_phone")
//       .notNull()
//       .default("00000000000"),

//     // Operational
//     isActive: boolean("is_active").notNull().default(true),
//     status: text("status").notNull().default("active"),

//     // Dispute flag
//     isDisputed: boolean("is_disputed").notNull().default(false),

//     // Capacity
//     maxCapacity: integer("max_capacity").notNull().default(50),
//     currentCases: integer("current_cases").notNull().default(0),

//     // Staff
//     totalStaff: integer("total_staff").notNull().default(0),
//     availableArbitrators: integer("available_arbitrators").notNull().default(0),

//     // Audit
//     createdAt: timestamp("created_at").notNull().defaultNow(),
//     createdBy: text("created_by").notNull(),
//     createdById: text("created_by_id")
//       .notNull()
//       .references(() => admins.id, { onDelete: "set default" })
//       .default("system"),

//     modifiedBy: text("modified_by"),
//     modifiedAt: timestamp("modified_at").$onUpdateFn(() => new Date()),
//     modifiedById: text("modified_by_id")
//       .notNull()
//       .references(() => admins.id, { onDelete: "set default" })
//       .default("system"),

//     // Soft delete
//     deletedAt: timestamp("deleted_at"),
//     deletedBy: text("deleted_by"),
//     deletedById: text("deleted_by_id").references(() => admins.id, {
//       onDelete: "set default",
//     }),
//   },
//   (table) => [
//     // Uniques
//     uniqueIndex("dispute_center_number_unique").on(table.number),
//     uniqueIndex("dispute_center_email_unique").on(table.email),
//     uniqueIndex("dispute_center_name_state_lga_unique").on(
//       table.name,
//       table.state,
//       table.lga
//     ),

//     // Indexes
//     index("idx_dispute_center_is_disputed").on(table.isDisputed),
//     index("idx_dispute_center_is_active").on(table.isActive),
//     index("idx_dispute_center_status").on(table.status),
//     index("idx_dispute_center_state").on(table.state),
//     index("idx_dispute_center_lga").on(table.lga),
//     index("idx_dispute_center_state_lga").on(table.state, table.lga),
//     index("idx_dispute_center_email").on(table.email),
//     index("idx_dispute_center_phone").on(table.phone),
//   ]
// );

// // ------------------------
// // Relations
// // ------------------------
// export const adminRelations = relations(admins, ({ many }) => ({
//   sessions: many(adminSessions),
//   passwordResets: many(passwordResets),
//   auditLogs: many(auditLogs),
//   adminActivities: many(adminActivities),
//   createdCenters: many(centers, { relationName: "center_created_by" }),
//   modifiedCenters: many(centers, { relationName: "center_modified_by" }),
//   apiKeys: many(apiKeys), // Added relation for API keys
// }));

// export const centerRelations = relations(centers, ({ one }) => ({
//   createdByAdmin: one(admins, {
//     fields: [centers.createdById],
//     references: [admins.id],
//     relationName: "center_created_by",
//   }),
//   modifiedByAdmin: one(admins, {
//     fields: [centers.modifiedById],
//     references: [admins.id],
//     relationName: "center_modified_by",
//   }),
// }));

// export const adminSessionRelations = relations(adminSessions, ({ one }) => ({
//   admin: one(admins, {
//     fields: [adminSessions.adminId],
//     references: [admins.id],
//   }),
// }));

// export const passwordResetRelations = relations(passwordResets, ({ one }) => ({
//   admin: one(admins, {
//     fields: [passwordResets.adminId],
//     references: [admins.id],
//   }),
// }));

// export const adminActivityRelations = relations(adminActivities, ({ one }) => ({
//   admin: one(admins, {
//     fields: [adminActivities.adminId],
//     references: [admins.id],
//   }),
// }));

// export const auditLogRelations = relations(auditLogs, ({ one }) => ({
//   admin: one(admins, {
//     fields: [auditLogs.adminId],
//     references: [admins.id],
//   }),
// }));
// // ------------------------
// // Inferred Types
// // ------------------------
// export type NewCenter = typeof centers.$inferInsert;
// export type NewAdmin = typeof admins.$inferInsert;
// export type AdminSession = typeof adminSessions.$inferSelect;
// export type NewAdminSession = typeof adminSessions.$inferInsert;
// export type PasswordReset = typeof passwordResets.$inferSelect;
// export type NewPasswordReset = typeof passwordResets.$inferInsert;
// export type ApiLog = typeof apiLogs.$inferSelect;
// export type NewApiLog = typeof apiLogs.$inferInsert;
// export type AdminActivity = typeof adminActivities.$inferSelect;
// export type NewAdminActivity = typeof adminActivities.$inferInsert;
// export type AuditLog = typeof auditLogs.$inferSelect;
// export type NewAuditLog = typeof auditLogs.$inferInsert;

// // ------------------------
// // API Key Types
// // ------------------------
// export type ApiKey = typeof apiKeys.$inferSelect;
// export type NewApiKey = typeof apiKeys.$inferInsert;
// export type ApiUsageLog = typeof apiUsageLogs.$inferSelect;
// export type NewApiUsageLog = typeof apiUsageLogs.$inferInsert;
// export type ApiRateLimit = typeof apiRateLimits.$inferSelect;
// export type NewApiRateLimit = typeof apiRateLimits.$inferInsert;

// // Types
// export type DisputeCenter = typeof disputeCenters.$inferSelect;
// export type NewDisputeCenter = typeof disputeCenters.$inferInsert;

// // ------------------------
// // Inferred Types with Relations
// // ------------------------
// export type Center = typeof centers.$inferSelect & {
//   createdByAdmin?: Admin;
//   modifiedByAdmin?: Admin;
// };

// export type Admin = typeof admins.$inferSelect & {
//   createdCenters?: Center[];
//   modifiedCenters?: Center[];
//   apiKeys?: ApiKey[]; // Added API keys relation
// };

// export type ApiKeyWithRelations = ApiKey & {
//   admin?: Admin;
//   usageLogs?: ApiUsageLog[];
//   rateLimits?: ApiRateLimit[];
// };
