-- Battle system setup for ExamReady
-- Run this in the Supabase SQL editor with an owner/service-role connection.
-- Creates the battles table + RLS policies used by the Battle feature.

create table if not exists public.battles (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  creator_id uuid not null references auth.users(id) on delete cascade,
  opponent_id uuid references auth.users(id) on delete set null,
  status text not null default 'waiting'
    check (status in ('waiting', 'in_progress', 'completed', 'expired', 'cancelled')),
  subject text,
  question_count int not null default 10,
  question_ids jsonb not null default '[]'::jsonb,
  creator_answers jsonb not null default '{}'::jsonb,
  opponent_answers jsonb not null default '{}'::jsonb,
  creator_score int not null default 0,
  opponent_score int not null default 0,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '15 minutes'),
  started_at timestamptz,
  completed_at timestamptz
);

-- Indexes for common lookups
create index if not exists battles_code_idx on battles(code);
create index if not exists battles_creator_idx on battles(creator_id);
create index if not exists battles_opponent_idx on battles(opponent_id);
create index if not exists battles_status_idx on battles(status);
create index if not exists battles_created_idx on battles(created_at desc);

alter table public.battles enable row level security;

-- SELECT:
--  - Involved users (creator or opponent) can always read the battle.
--  - 'waiting' battles are also readable so a user can look one up by
--    code to join. Codes are 6-digit random, not enumerable.
drop policy if exists battles_select on battles;
create policy battles_select on battles for select
  using (
    auth.uid() = creator_id
    or auth.uid() = opponent_id
    or status = 'waiting'
  );

-- INSERT: any authenticated user can create a battle (they become creator).
drop policy if exists battles_insert on battles;
create policy battles_insert on battles for insert
  with check (auth.uid() = creator_id);

-- UPDATE:
--  - Involved users can update their battle (submit answers, etc).
--  - A waiting battle with no opponent can also be updated by the joining
--    user so they can set opponent_id + flip status to in_progress.
drop policy if exists battles_update on battles;
create policy battles_update on battles for update
  using (
    auth.uid() = creator_id
    or auth.uid() = opponent_id
    or (status = 'waiting' and opponent_id is null)
  );

-- DELETE: creator can cancel their own un-joined battle.
drop policy if exists battles_delete on battles;
create policy battles_delete on battles for delete
  using (auth.uid() = creator_id and status = 'waiting' and opponent_id is null);
