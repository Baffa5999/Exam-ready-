-- Video Lessons setup for ExamReady
-- Run this in the Supabase SQL editor with an owner/service-role connection.
-- Creates the video_lessons table + RLS policies used by the Video Lessons feature.

create table if not exists public.video_lessons (
  id uuid primary key default gen_random_uuid(),
  subject text not null,
  topic text not null,
  subtopic text not null,
  title text not null,
  youtube_video_id text not null,
  duration_minutes int not null default 0,
  thumbnail_url text,
  created_at timestamptz not null default now()
);

-- Indexes for common lookups
create index if not exists video_lessons_subject_idx on video_lessons(subject);
create index if not exists video_lessons_topic_idx on video_lessons(topic);
create index if not exists video_lessons_subtopic_idx on video_lessons(subtopic);
create index if not exists video_lessons_created_idx on video_lessons(created_at desc);

alter table public.video_lessons enable row level security;

-- SELECT: any authenticated user can read video lessons.
drop policy if exists video_lessons_select on video_lessons;
create policy video_lessons_select on video_lessons for select
  to authenticated
  using (true);

-- INSERT/UPDATE/DELETE: only admins can manage video content.
-- Adjust the email below to match your admin email.
drop policy if exists video_lessons_insert on video_lessons;
create policy video_lessons_insert on video_lessons for insert
  to authenticated
  with check (auth.jwt() ->> 'email' = 'usmanbaffa7002@gmail.com');

drop policy if exists video_lessons_update on video_lessons;
create policy video_lessons_update on video_lessons for update
  to authenticated
  using (auth.jwt() ->> 'email' = 'usmanbaffa7002@gmail.com');

drop policy if exists video_lessons_delete on video_lessons;
create policy video_lessons_delete on video_lessons for delete
  to authenticated
  using (auth.jwt() ->> 'email' = 'usmanbaffa7002@gmail.com');
