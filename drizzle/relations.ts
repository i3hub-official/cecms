import { relations } from "drizzle-orm/relations";
import { admins, adminSchool, centers, adminSessions, apiKeys, apiRateLimits, apiUsageLogs, auditLogs, disputeCenters, emailVerifications, adminActivities, passwordResets } from "./schema";

export const adminSchoolRelations = relations(adminSchool, ({one}) => ({
	admin: one(admins, {
		fields: [adminSchool.adminId],
		references: [admins.id]
	}),
	center: one(centers, {
		fields: [adminSchool.schoolId],
		references: [centers.id]
	}),
}));

export const adminsRelations = relations(admins, ({many}) => ({
	adminSchool: many(adminSchool),
	adminSessions: many(adminSessions),
	apiKeys: many(apiKeys),
	auditLogs: many(auditLogs),
	disputeCenters_createdById: many(disputeCenters, {
		relationName: "disputeCenters_createdById_admins_id"
	}),
	disputeCenters_modifiedById: many(disputeCenters, {
		relationName: "disputeCenters_modifiedById_admins_id"
	}),
	disputeCenters_deletedById: many(disputeCenters, {
		relationName: "disputeCenters_deletedById_admins_id"
	}),
	emailVerifications: many(emailVerifications),
	centers_createdById: many(centers, {
		relationName: "centers_createdById_admins_id"
	}),
	centers_modifiedById: many(centers, {
		relationName: "centers_modifiedById_admins_id"
	}),
	adminActivities: many(adminActivities),
	passwordResets: many(passwordResets),
}));

export const centersRelations = relations(centers, ({one, many}) => ({
	adminSchool: many(adminSchool),
	admin_createdById: one(admins, {
		fields: [centers.createdById],
		references: [admins.id],
		relationName: "centers_createdById_admins_id"
	}),
	admin_modifiedById: one(admins, {
		fields: [centers.modifiedById],
		references: [admins.id],
		relationName: "centers_modifiedById_admins_id"
	}),
}));

export const adminSessionsRelations = relations(adminSessions, ({one}) => ({
	admin: one(admins, {
		fields: [adminSessions.adminId],
		references: [admins.id]
	}),
}));

export const apiKeysRelations = relations(apiKeys, ({one, many}) => ({
	admin: one(admins, {
		fields: [apiKeys.adminId],
		references: [admins.id]
	}),
	apiRateLimits: many(apiRateLimits),
	apiUsageLogs: many(apiUsageLogs),
}));

export const apiRateLimitsRelations = relations(apiRateLimits, ({one}) => ({
	apiKey: one(apiKeys, {
		fields: [apiRateLimits.apiKeyId],
		references: [apiKeys.id]
	}),
}));

export const apiUsageLogsRelations = relations(apiUsageLogs, ({one}) => ({
	apiKey: one(apiKeys, {
		fields: [apiUsageLogs.apiKeyId],
		references: [apiKeys.id]
	}),
}));

export const auditLogsRelations = relations(auditLogs, ({one}) => ({
	admin: one(admins, {
		fields: [auditLogs.adminId],
		references: [admins.id]
	}),
}));

export const disputeCentersRelations = relations(disputeCenters, ({one}) => ({
	admin_createdById: one(admins, {
		fields: [disputeCenters.createdById],
		references: [admins.id],
		relationName: "disputeCenters_createdById_admins_id"
	}),
	admin_modifiedById: one(admins, {
		fields: [disputeCenters.modifiedById],
		references: [admins.id],
		relationName: "disputeCenters_modifiedById_admins_id"
	}),
	admin_deletedById: one(admins, {
		fields: [disputeCenters.deletedById],
		references: [admins.id],
		relationName: "disputeCenters_deletedById_admins_id"
	}),
}));

export const emailVerificationsRelations = relations(emailVerifications, ({one}) => ({
	admin: one(admins, {
		fields: [emailVerifications.adminId],
		references: [admins.id]
	}),
}));

export const adminActivitiesRelations = relations(adminActivities, ({one}) => ({
	admin: one(admins, {
		fields: [adminActivities.adminId],
		references: [admins.id]
	}),
}));

export const passwordResetsRelations = relations(passwordResets, ({one}) => ({
	admin: one(admins, {
		fields: [passwordResets.adminId],
		references: [admins.id]
	}),
}));