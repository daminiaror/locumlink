-- Cursor pagination indexes

-- Partial index: active listings by status (non-deleted only)
CREATE INDEX "job_postings_status_id_not_deleted_idx"
  ON "job_postings" ("status", "id")
  WHERE "is_deleted" = false;

-- General status+id index for queries that include deleted rows
CREATE INDEX "job_postings_status_id_idx"
  ON "job_postings" ("status", "id");

CREATE INDEX "applications_job_posting_id_id_idx"
  ON "applications" ("jobPostingId", "id");

CREATE INDEX "applications_locum_profile_id_id_idx"
  ON "applications" ("locumProfileId", "id");

CREATE INDEX "messages_sender_recipient_id_idx"
  ON "messages" ("senderId", "recipientId", "id");

CREATE INDEX "notification_events_recipient_id_idx"
  ON "notification_events" ("recipientId", "id");
