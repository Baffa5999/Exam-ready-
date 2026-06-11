-- ExamReady audiobook setup
-- Run this in the Supabase SQL Editor before enabling live audiobook progress.

-- Table for chapters (static content)
CREATE TABLE IF NOT EXISTS audiobook_chapters (
  id SERIAL PRIMARY KEY,
  chapter_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  duration_seconds INTEGER NOT NULL,
  audio_url TEXT NOT NULL,
  UNIQUE(chapter_number)
);

CREATE UNIQUE INDEX IF NOT EXISTS audiobook_chapters_chapter_number_key
  ON audiobook_chapters (chapter_number);

-- Insert chapters for "The Life Changer" (example data – replace with real)
INSERT INTO audiobook_chapters (chapter_number, title, duration_seconds, audio_url) VALUES
(1, 'The Arrival', 930, 'https://your-cdn.com/chapter1.mp3'),
(2, 'The Family Meeting', 885, 'https://your-cdn.com/chapter2.mp3'),
(3, 'Salma at the University', 970, 'https://your-cdn.com/chapter3.mp3'),
(4, 'The Unexpected Visitor', 1020, 'https://your-cdn.com/chapter4.mp3'),
(5, 'Dr. Dabo''s Advice', 840, 'https://your-cdn.com/chapter5.mp3'),
(6, 'The Examination Hall', 910, 'https://your-cdn.com/chapter6.mp3'),
(7, 'The Missing Phone', 950, 'https://your-cdn.com/chapter7.mp3'),
(8, 'The Confrontation', 890, 'https://your-cdn.com/chapter8.mp3'),
(9, 'The Resolution', 920, 'https://your-cdn.com/chapter9.mp3'),
(10, 'Graduation Day', 880, 'https://your-cdn.com/chapter10.mp3'),
(11, 'The Life Changer – Reflection', 800, 'https://your-cdn.com/chapter11.mp3'),
(12, 'Author''s Note', 720, 'https://your-cdn.com/chapter12.mp3')
ON CONFLICT (chapter_number) DO UPDATE SET
  title = EXCLUDED.title,
  duration_seconds = EXCLUDED.duration_seconds,
  audio_url = EXCLUDED.audio_url;

-- Table for user progress
CREATE TABLE IF NOT EXISTS user_audio_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) NOT NULL,
  chapter_id INTEGER REFERENCES audiobook_chapters(id) NOT NULL,
  progress_seconds INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT false,
  last_listened TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, chapter_id)
);

-- Enable RLS
ALTER TABLE user_audio_progress ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Users can read own progress" ON user_audio_progress;
DROP POLICY IF EXISTS "Users can insert own progress" ON user_audio_progress;
DROP POLICY IF EXISTS "Users can update own progress" ON user_audio_progress;

CREATE POLICY "Users can read own progress"
  ON user_audio_progress FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress"
  ON user_audio_progress FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress"
  ON user_audio_progress FOR UPDATE USING (auth.uid() = user_id);
