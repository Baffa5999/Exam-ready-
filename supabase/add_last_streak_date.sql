-- Run this in your Supabase SQL Editor (Dashboard → SQL Editor → New query)
-- Adds the last_streak_date column needed for accurate daily streak tracking.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS last_streak_date date;

-- Backfill existing rows: assume their last active date was today
-- so the next time they open the app it starts counting correctly.
UPDATE profiles
SET last_streak_date = CURRENT_DATE
WHERE last_streak_date IS NULL;
