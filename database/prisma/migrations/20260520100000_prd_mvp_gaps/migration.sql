-- PRD MVP Gaps Migration
-- Adds: PIPEDA consent, suspension note, rejection reason,
--       host photo ID, job leave type + full/half day,
--       application placedAt, audit outcome + actorRole,
--       REFERENCE_LETTER document type, EmailLog table

-- 1. User: PIPEDA consent + suspension fields
ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "consent_given_at"  TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "consent_version"   TEXT,
  ADD COLUMN IF NOT EXISTS "suspension_note"   TEXT,
  ADD COLUMN IF NOT EXISTS "suspended_at"      TIMESTAMP(3);

-- 2. LocumProfile: rejection reason fields
ALTER TABLE "locum_profiles"
  ADD COLUMN IF NOT EXISTS "rejection_reason"  TEXT,
  ADD COLUMN IF NOT EXISTS "rejected_at"       TIMESTAMP(3);

-- 3. HostProfile: photo ID upload fields
ALTER TABLE "host_profiles"
  ADD COLUMN IF NOT EXISTS "photo_id_file"          TEXT,
  ADD COLUMN IF NOT EXISTS "photo_id_original_name" TEXT;

-- 4. JobPosting: leave type + full/half day (PRD Section 2.2 required fields)
ALTER TABLE "job_postings"
  ADD COLUMN IF NOT EXISTS "leave_type"    TEXT,
  ADD COLUMN IF NOT EXISTS "full_half_day" TEXT;

-- 5. Application: placed timestamp (for fill rate + avg time-to-placement)
ALTER TABLE "applications"
  ADD COLUMN IF NOT EXISTS "placed_at" TIMESTAMP(3);

-- 6. AuditLog: outcome + actorRole (PRD Section 11.3 required fields)
ALTER TABLE "audit_logs"
  ADD COLUMN IF NOT EXISTS "outcome"     TEXT NOT NULL DEFAULT 'SUCCESS',
  ADD COLUMN IF NOT EXISTS "actor_role"  TEXT;

-- 7. DocumentType enum: add REFERENCE_LETTER
ALTER TYPE "DocumentType" ADD VALUE IF NOT EXISTS 'REFERENCE_LETTER';

-- 8. New EmailLog table (L2-E5.4 delivery logging)
CREATE TABLE IF NOT EXISTS "email_logs" (
  "id"                  TEXT         NOT NULL,
  "recipient"           TEXT         NOT NULL,
  "event_type"          TEXT         NOT NULL,
  "status"              TEXT         NOT NULL DEFAULT 'PENDING',
  "provider"            TEXT         NOT NULL DEFAULT 'zeptomail',
  "provider_message_id" TEXT,
  "error"               TEXT,
  "reference_id"        TEXT,
  "reference_type"      TEXT,
  "sent_at"             TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "delivered_at"        TIMESTAMP(3),
  CONSTRAINT "email_logs_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "email_logs_recipient_idx"  ON "email_logs"("recipient");
CREATE INDEX IF NOT EXISTS "email_logs_sent_at_idx"    ON "email_logs"("sent_at");
CREATE INDEX IF NOT EXISTS "email_logs_event_type_idx" ON "email_logs"("event_type");
