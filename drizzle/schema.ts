import { pgTable, index, uniqueIndex, foreignKey, text, timestamp, boolean, unique, integer } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const adminSchools = pgTable("admin_schools", {
	id: text().primaryKey().notNull(),
	adminId: text("admin_id"),
	schoolId: text("school_id"),
	assignedAt: timestamp("assigned_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	revokedAt: timestamp("revoked_at", { withTimezone: true, mode: 'string' }),
	isActive: boolean("is_active").default(true).notNull(),
}, (table) => [
	index("admin_school_active_idx").using("btree", table.isActive.asc().nullsLast().op("bool_ops")),
	index("admin_school_admin_idx").using("btree", table.adminId.asc().nullsLast().op("text_ops")),
	index("admin_school_school_idx").using("btree", table.schoolId.asc().nullsLast().op("text_ops")),
	uniqueIndex("admin_school_unique").using("btree", table.adminId.asc().nullsLast().op("text_ops"), table.schoolId.asc().nullsLast().op("text_ops")),
	uniqueIndex("one_active_admin_per_school").using("btree", table.schoolId.asc().nullsLast().op("bool_ops"), table.isActive.asc().nullsLast().op("bool_ops")),
	foreignKey({
			columns: [table.adminId],
			foreignColumns: [admins.id],
			name: "admin_schools_admin_id_admins_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.schoolId],
			foreignColumns: [centers.id],
			name: "admin_schools_school_id_centers_id_fk"
		}).onDelete("set null"),
]);

export const adminSessions = pgTable("admin_sessions", {
	id: text().primaryKey().notNull(),
	adminId: text().notNull(),
	sessionId: text().notNull(),
	token: text().notNull(),
	isActive: boolean().default(true).notNull(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	expiresAt: timestamp({ mode: 'string' }).notNull(),
	lastUsed: timestamp({ mode: 'string' }).defaultNow().notNull(),
	userAgent: text(),
	ipAddress: text(),
	location: text(),
	deviceType: text(),
}, (table) => [
	index("idx_admin_session_created_at").using("btree", table.createdAt.asc().nullsLast().op("timestamp_ops")),
	index("idx_admin_session_device_type").using("btree", table.deviceType.asc().nullsLast().op("text_ops")),
	index("idx_admin_session_expires_at").using("btree", table.expiresAt.asc().nullsLast().op("timestamp_ops")),
	index("idx_admin_session_ip_address").using("btree", table.ipAddress.asc().nullsLast().op("text_ops")),
	index("idx_admin_session_is_active").using("btree", table.isActive.asc().nullsLast().op("bool_ops")),
	index("idx_admin_session_last_used").using("btree", table.lastUsed.asc().nullsLast().op("timestamp_ops")),
	foreignKey({
			columns: [table.adminId],
			foreignColumns: [admins.id],
			name: "admin_sessions_adminId_admins_id_fk"
		}).onDelete("cascade"),
	unique("admin_sessions_sessionId_unique").on(table.sessionId),
	unique("admin_sessions_token_unique").on(table.token),
]);

export const apiKeys = pgTable("api_keys", {
	id: text().primaryKey().notNull(),
	key: text().notNull(),
	prefix: text().notNull(),
	name: text().notNull(),
	description: text(),
	adminId: text("admin_id").notNull(),
	canRead: boolean("can_read").default(true).notNull(),
	canWrite: boolean("can_write").default(false).notNull(),
	canDelete: boolean("can_delete").default(false).notNull(),
	canManageKeys: boolean("can_manage_keys").default(false).notNull(),
	allowedEndpoints: text("allowed_endpoints").default('*').notNull(),
	rateLimit: integer("rate_limit").default(100).notNull(),
	rateLimitPeriod: integer("rate_limit_period").default(60).notNull(),
	isActive: boolean("is_active").default(true).notNull(),
	expiresAt: timestamp("expires_at", { mode: 'string' }),
	revokedAt: timestamp("revoked_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	lastUsed: timestamp("last_used", { mode: 'string' }),
	usageCount: integer("usage_count").default(0).notNull(),
}, (table) => [
	index("api_key_admin_id_idx").using("btree", table.adminId.asc().nullsLast().op("text_ops")),
	index("api_key_created_at_idx").using("btree", table.createdAt.asc().nullsLast().op("timestamp_ops")),
	index("api_key_expires_at_idx").using("btree", table.expiresAt.asc().nullsLast().op("timestamp_ops")),
	index("api_key_is_active_idx").using("btree", table.isActive.asc().nullsLast().op("bool_ops")),
	uniqueIndex("api_key_key_idx").using("btree", table.key.asc().nullsLast().op("text_ops")),
	index("api_key_prefix_idx").using("btree", table.prefix.asc().nullsLast().op("text_ops")),
	index("api_key_revoked_at_idx").using("btree", table.revokedAt.asc().nullsLast().op("timestamp_ops")),
	foreignKey({
			columns: [table.adminId],
			foreignColumns: [admins.id],
			name: "api_keys_admin_id_admins_id_fk"
		}).onDelete("cascade"),
	unique("api_keys_key_unique").on(table.key),
]);

export const apiRateLimits = pgTable("api_rate_limits", {
	id: text().primaryKey().notNull(),
	apiKeyId: text("api_key_id").notNull(),
	endpoint: text().notNull(),
	requestCount: integer("request_count").default(0).notNull(),
	windowStart: timestamp("window_start", { mode: 'string' }).notNull(),
	windowEnd: timestamp("window_end", { mode: 'string' }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("api_rate_limit_api_key_id_idx").using("btree", table.apiKeyId.asc().nullsLast().op("text_ops")),
	index("api_rate_limit_endpoint_idx").using("btree", table.endpoint.asc().nullsLast().op("text_ops")),
	uniqueIndex("api_rate_limit_unique_idx").using("btree", table.apiKeyId.asc().nullsLast().op("timestamp_ops"), table.endpoint.asc().nullsLast().op("text_ops"), table.windowStart.asc().nullsLast().op("text_ops")),
	index("api_rate_limit_window_end_idx").using("btree", table.windowEnd.asc().nullsLast().op("timestamp_ops")),
	index("api_rate_limit_window_start_idx").using("btree", table.windowStart.asc().nullsLast().op("timestamp_ops")),
	foreignKey({
			columns: [table.apiKeyId],
			foreignColumns: [apiKeys.id],
			name: "api_rate_limits_api_key_id_api_keys_id_fk"
		}).onDelete("cascade"),
]);

export const apiUsageLogs = pgTable("api_usage_logs", {
	id: text().primaryKey().notNull(),
	apiKeyId: text("api_key_id").notNull(),
	endpoint: text().notNull(),
	method: text().notNull(),
	statusCode: integer("status_code").notNull(),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	requestTime: integer("request_time"),
	requestSize: integer("request_size"),
	responseSize: integer("response_size"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("api_usage_api_key_id_idx").using("btree", table.apiKeyId.asc().nullsLast().op("text_ops")),
	index("api_usage_created_at_idx").using("btree", table.createdAt.asc().nullsLast().op("timestamp_ops")),
	index("api_usage_endpoint_idx").using("btree", table.endpoint.asc().nullsLast().op("text_ops")),
	index("api_usage_ip_address_idx").using("btree", table.ipAddress.asc().nullsLast().op("text_ops")),
	index("api_usage_method_idx").using("btree", table.method.asc().nullsLast().op("text_ops")),
	index("api_usage_status_code_idx").using("btree", table.statusCode.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.apiKeyId],
			foreignColumns: [apiKeys.id],
			name: "api_usage_logs_api_key_id_api_keys_id_fk"
		}).onDelete("cascade"),
]);

export const apiLogs = pgTable("api_logs", {
	id: text().primaryKey().notNull(),
	endpoint: text().notNull(),
	method: text().notNull(),
	status: integer().notNull(),
	request: text().notNull(),
	response: text().notNull(),
	timestamp: timestamp({ mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_api_log_endpoint").using("btree", table.endpoint.asc().nullsLast().op("text_ops")),
	index("idx_api_log_method").using("btree", table.method.asc().nullsLast().op("text_ops")),
	index("idx_api_log_status").using("btree", table.status.asc().nullsLast().op("int4_ops")),
	index("idx_api_log_timestamp").using("btree", table.timestamp.asc().nullsLast().op("timestamp_ops")),
]);

export const auditLogs = pgTable("audit_logs", {
	id: text().primaryKey().notNull(),
	adminId: text().notNull(),
	action: text().notNull(),
	entity: text().notNull(),
	entityId: text().notNull(),
	timestamp: timestamp({ mode: 'string' }).defaultNow().notNull(),
	details: text(),
}, (table) => [
	index("idx_audit_log_action").using("btree", table.action.asc().nullsLast().op("text_ops")),
	index("idx_audit_log_entity").using("btree", table.entity.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.adminId],
			foreignColumns: [admins.id],
			name: "audit_logs_adminId_admins_id_fk"
		}).onDelete("cascade"),
]);

export const admins = pgTable("admins", {
	id: text().primaryKey().notNull(),
	phone: text().notNull(),
	email: text().notNull(),
	password: text().notNull(),
	name: text().notNull(),
	role: text().default('ADMIN').notNull(),
	isActive: boolean().default(true).notNull(),
	isEmailVerified: boolean().default(false).notNull(),
	twoFactorEnabled: boolean().default(false).notNull(),
	twoFactorSecret: text(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp({ mode: 'string' }),
	lastLogin: timestamp({ mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_admin_created_at").using("btree", table.createdAt.asc().nullsLast().op("timestamp_ops")),
	index("idx_admin_email").using("btree", table.email.asc().nullsLast().op("text_ops")),
	index("idx_admin_is_active").using("btree", table.isActive.asc().nullsLast().op("bool_ops")),
	index("idx_admin_role").using("btree", table.role.asc().nullsLast().op("text_ops")),
	unique("admins_phone_unique").on(table.phone),
	unique("admins_email_unique").on(table.email),
]);

export const disputeCenters = pgTable("dispute_centers", {
	id: text().primaryKey().notNull(),
	number: text().notNull(),
	name: text().notNull(),
	address: text().notNull(),
	state: text().notNull(),
	lga: text().notNull(),
	email: text().notNull(),
	phone: text().notNull(),
	alternativePhone: text("alternative_phone").default('00000000000').notNull(),
	isActive: boolean("is_active").default(true).notNull(),
	status: text().default('active').notNull(),
	isDisputed: boolean("is_disputed").default(false).notNull(),
	maxCapacity: integer("max_capacity").default(50).notNull(),
	currentCases: integer("current_cases").default(0).notNull(),
	totalStaff: integer("total_staff").default(0).notNull(),
	availableArbitrators: integer("available_arbitrators").default(0).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	createdBy: text("created_by").notNull(),
	createdById: text("created_by_id").default('system').notNull(),
	modifiedBy: text("modified_by"),
	modifiedAt: timestamp("modified_at", { mode: 'string' }),
	modifiedById: text("modified_by_id").default('system').notNull(),
	deletedAt: timestamp("deleted_at", { mode: 'string' }),
	deletedBy: text("deleted_by"),
	deletedById: text("deleted_by_id"),
}, (table) => [
	uniqueIndex("dispute_center_email_unique").using("btree", table.email.asc().nullsLast().op("text_ops")),
	uniqueIndex("dispute_center_name_state_lga_unique").using("btree", table.name.asc().nullsLast().op("text_ops"), table.state.asc().nullsLast().op("text_ops"), table.lga.asc().nullsLast().op("text_ops")),
	uniqueIndex("dispute_center_number_unique").using("btree", table.number.asc().nullsLast().op("text_ops")),
	index("idx_dispute_center_email").using("btree", table.email.asc().nullsLast().op("text_ops")),
	index("idx_dispute_center_is_active").using("btree", table.isActive.asc().nullsLast().op("bool_ops")),
	index("idx_dispute_center_is_disputed").using("btree", table.isDisputed.asc().nullsLast().op("bool_ops")),
	index("idx_dispute_center_lga").using("btree", table.lga.asc().nullsLast().op("text_ops")),
	index("idx_dispute_center_phone").using("btree", table.phone.asc().nullsLast().op("text_ops")),
	index("idx_dispute_center_state").using("btree", table.state.asc().nullsLast().op("text_ops")),
	index("idx_dispute_center_state_lga").using("btree", table.state.asc().nullsLast().op("text_ops"), table.lga.asc().nullsLast().op("text_ops")),
	index("idx_dispute_center_status").using("btree", table.status.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.createdById],
			foreignColumns: [admins.id],
			name: "dispute_centers_created_by_id_admins_id_fk"
		}).onDelete("set default"),
	foreignKey({
			columns: [table.modifiedById],
			foreignColumns: [admins.id],
			name: "dispute_centers_modified_by_id_admins_id_fk"
		}).onDelete("set default"),
	foreignKey({
			columns: [table.deletedById],
			foreignColumns: [admins.id],
			name: "dispute_centers_deleted_by_id_admins_id_fk"
		}).onDelete("set default"),
	unique("dispute_centers_number_unique").on(table.number),
]);

export const emailVerifications = pgTable("email_verifications", {
	id: text().primaryKey().notNull(),
	adminId: text("admin_id").notNull(),
	email: text().notNull(),
	token: text().notNull(),
	expires: timestamp({ mode: 'string' }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	verifiedAt: timestamp("verified_at", { mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.adminId],
			foreignColumns: [admins.id],
			name: "email_verifications_admin_id_admins_id_fk"
		}).onDelete("cascade"),
	unique("email_verifications_token_unique").on(table.token),
]);

export const centers = pgTable("centers", {
	id: text().primaryKey().notNull(),
	number: text().notNull(),
	name: text().notNull(),
	address: text().notNull(),
	state: text().notNull(),
	lga: text().notNull(),
	isActive: boolean().default(true).notNull(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	createdBy: text().notNull(),
	createdById: text().default('system').notNull(),
	modifiedBy: text(),
	modifiedAt: timestamp({ mode: 'string' }),
	modifiedById: text().default('system').notNull(),
}, (table) => [
	uniqueIndex("center_name_state_lga_unique").using("btree", table.name.asc().nullsLast().op("text_ops"), table.state.asc().nullsLast().op("text_ops"), table.lga.asc().nullsLast().op("text_ops")),
	index("idx_center_created_at").using("btree", table.createdAt.asc().nullsLast().op("timestamp_ops")),
	index("idx_center_created_at_is_active").using("btree", table.createdAt.asc().nullsLast().op("timestamp_ops"), table.isActive.asc().nullsLast().op("timestamp_ops")),
	index("idx_center_created_by").using("btree", table.createdBy.asc().nullsLast().op("text_ops")),
	index("idx_center_created_by_id").using("btree", table.createdById.asc().nullsLast().op("text_ops")),
	index("idx_center_is_active").using("btree", table.isActive.asc().nullsLast().op("bool_ops")),
	index("idx_center_lga").using("btree", table.lga.asc().nullsLast().op("text_ops")),
	index("idx_center_lga_is_active").using("btree", table.lga.asc().nullsLast().op("text_ops"), table.isActive.asc().nullsLast().op("text_ops")),
	index("idx_center_modified_at").using("btree", table.modifiedAt.asc().nullsLast().op("timestamp_ops")),
	index("idx_center_modified_by").using("btree", table.modifiedBy.asc().nullsLast().op("text_ops")),
	index("idx_center_modified_by_id").using("btree", table.modifiedById.asc().nullsLast().op("text_ops")),
	index("idx_center_name").using("btree", table.name.asc().nullsLast().op("text_ops")),
	index("idx_center_number").using("btree", table.number.asc().nullsLast().op("text_ops")),
	index("idx_center_state").using("btree", table.state.asc().nullsLast().op("text_ops")),
	index("idx_center_state_is_active").using("btree", table.state.asc().nullsLast().op("bool_ops"), table.isActive.asc().nullsLast().op("bool_ops")),
	index("idx_center_state_lga").using("btree", table.state.asc().nullsLast().op("text_ops"), table.lga.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.createdById],
			foreignColumns: [admins.id],
			name: "centers_createdById_admins_id_fk"
		}).onDelete("set default"),
	foreignKey({
			columns: [table.modifiedById],
			foreignColumns: [admins.id],
			name: "centers_modifiedById_admins_id_fk"
		}).onDelete("set default"),
	unique("centers_number_unique").on(table.number),
]);

export const adminActivities = pgTable("admin_activities", {
	id: text().primaryKey().notNull(),
	adminId: text().notNull(),
	activity: text().notNull(),
	timestamp: timestamp({ mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_admin_activity_activity").using("btree", table.activity.asc().nullsLast().op("text_ops")),
	index("idx_admin_activity_timestamp").using("btree", table.timestamp.asc().nullsLast().op("timestamp_ops")),
	foreignKey({
			columns: [table.adminId],
			foreignColumns: [admins.id],
			name: "admin_activities_adminId_admins_id_fk"
		}).onDelete("cascade"),
]);

export const passwordResets = pgTable("password_resets", {
	id: text().primaryKey().notNull(),
	adminId: text().notNull(),
	token: text().notNull(),
	isUsed: boolean().default(false).notNull(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	expiresAt: timestamp({ mode: 'string' }).notNull(),
}, (table) => [
	index("idx_password_reset_created_at").using("btree", table.createdAt.asc().nullsLast().op("timestamp_ops")),
	index("idx_password_reset_expires_at").using("btree", table.expiresAt.asc().nullsLast().op("timestamp_ops")),
	index("idx_password_reset_is_used").using("btree", table.isUsed.asc().nullsLast().op("bool_ops")),
	foreignKey({
			columns: [table.adminId],
			foreignColumns: [admins.id],
			name: "password_resets_adminId_admins_id_fk"
		}).onDelete("cascade"),
	unique("password_resets_token_unique").on(table.token),
]);
