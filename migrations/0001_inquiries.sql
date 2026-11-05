CREATE TABLE IF NOT EXISTS studio_inquiries (
  id TEXT PRIMARY KEY,
  created_at INTEGER NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  topic TEXT NOT NULL,
  message TEXT NOT NULL,
  fingerprint TEXT NOT NULL,
  notification_status TEXT NOT NULL DEFAULT 'pending' CHECK (notification_status IN ('pending','sending','sent','failed')),
  notification_attempts INTEGER NOT NULL DEFAULT 0,
  next_attempt_at INTEGER NOT NULL,
  lease_until INTEGER NOT NULL DEFAULT 0,
  notification_id TEXT,
  notified_at INTEGER
);
CREATE INDEX IF NOT EXISTS studio_inquiries_pending ON studio_inquiries(notification_status, next_attempt_at);
