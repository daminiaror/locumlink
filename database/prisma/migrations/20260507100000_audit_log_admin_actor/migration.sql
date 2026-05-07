-- AlterTable
ALTER TABLE "audit_logs" ADD COLUMN "adminActorId" TEXT;

-- CreateIndex
CREATE INDEX "audit_logs_adminActorId_idx" ON "audit_logs"("adminActorId");

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_adminActorId_fkey" FOREIGN KEY ("adminActorId") REFERENCES "admins"("id") ON DELETE SET NULL ON UPDATE CASCADE;
