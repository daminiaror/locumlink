-- DropIndex
DROP INDEX "users_email_key";

-- AlterTable
ALTER TABLE "otps" ADD COLUMN "role" "Role";

-- DropIndex
DROP INDEX "otps_email_idx";

-- DropIndex
DROP INDEX "otps_email_purpose_idx";

-- CreateIndex
CREATE INDEX "otps_email_role_purpose_idx" ON "otps"("email", "role", "purpose");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_role_key" ON "users"("email", "role");
