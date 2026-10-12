-- Run once against the Neon database BEFORE deploying the code that needs it
-- (Neon console > SQL Editor, or: psql "$DATABASE_URL" -f this-file).
-- Safe to run more than once.

BEGIN;

-- 1. Settings the app already lets you pick but had nowhere to store.
--    better-auth reads these as user.background / user.textOnPrimary.
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS background TEXT;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS text_on_primary TEXT;

-- 2. Every query filters by user (and usually quarter). Without these,
--    each request scans the whole table.
CREATE INDEX IF NOT EXISTS quarters_user_id_idx ON quarters (user_id);
CREATE INDEX IF NOT EXISTS goals_user_quarter_idx ON goals (user_id, quarter_id);
CREATE INDEX IF NOT EXISTS activities_user_quarter_date_idx
  ON activities (user_id, quarter_id, date);
-- Foreign keys from children to quarters, used when deleting a quarter.
CREATE INDEX IF NOT EXISTS goals_quarter_id_idx ON goals (quarter_id);
CREATE INDEX IF NOT EXISTS activities_quarter_id_idx ON activities (quarter_id);

-- 3. At most one active quarter per user, enforced by the database.
--    First close any extra active quarters (keeping the latest), which is
--    what the app already does on load.
UPDATE quarters q
SET status = 'completed'
WHERE q.status = 'active'
  AND EXISTS (
    SELECT 1 FROM quarters newer
    WHERE newer.user_id = q.user_id
      AND newer.status = 'active'
      AND (newer.start_date, newer.id) > (q.start_date, q.id)
  );
CREATE UNIQUE INDEX IF NOT EXISTS quarters_one_active_per_user
  ON quarters (user_id) WHERE status = 'active';

COMMIT;
