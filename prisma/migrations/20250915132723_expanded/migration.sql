-- AlterTable
ALTER TABLE "public"."admin_sessions" ADD COLUMN     "deviceType" TEXT,
ADD COLUMN     "ipAddress" TEXT,
ADD COLUMN     "location" TEXT,
ADD COLUMN     "userAgent" TEXT;

-- CreateIndex
CREATE INDEX "idx_admin_session_ip_address" ON "public"."admin_sessions"("ipAddress");

-- CreateIndex
CREATE INDEX "idx_admin_session_device_type" ON "public"."admin_sessions"("deviceType");
