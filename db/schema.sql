-- App tables as they exist in the database (after migrations in
-- db/migrations). Kept for reference; the API's field rules in
-- api/_lib/entities.js must match these.
--
-- The "user", "session", "account" and "verification" tables are managed by
-- better-auth. The app adds these columns to "user":
--   theme, primary_color, background, text_on_primary, font, radius,
--   timezone TEXT; onboarded BOOLEAN DEFAULT false
--
-- Foreign keys do NOT cascade: the API deletes goals and activities before
-- their quarter.

CREATE TABLE quarters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES "user" (id),
  name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',          -- active | completed
  theme_snapshot TEXT DEFAULT 'light',
  accent_color_snapshot TEXT DEFAULT 'violet',
  quarter_reflection TEXT
);

CREATE TABLE goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES "user" (id),
  quarter_id UUID NOT NULL REFERENCES quarters (id),
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'active',          -- active | completed | abandoned
  completed_date DATE,
  abandoned_date DATE
);

CREATE TABLE activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES "user" (id),
  quarter_id UUID NOT NULL REFERENCES quarters (id),
  date DATE NOT NULL,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  completed BOOLEAN NOT NULL DEFAULT false,
  completion_timestamp TIMESTAMP WITH TIME ZONE,
  recurrence_group TEXT
);

-- Indexes and constraints: see db/migrations/001_google_only_and_integrity.sql
