-- Practice question read access and student performance ownership policies.
-- Run this in the Supabase SQL editor with an owner/service-role connection.

alter table questions enable row level security;

drop policy if exists allow_read_questions on questions;
create policy allow_read_questions
on questions for select
using (true);

alter table student_performance enable row level security;

drop policy if exists allow_insert_performance on student_performance;
create policy allow_insert_performance
on student_performance for insert
with check (auth.uid() = user_id);

drop policy if exists allow_update_performance on student_performance;
create policy allow_update_performance
on student_performance for update
using (auth.uid() = user_id);

drop policy if exists allow_read_performance on student_performance;
create policy allow_read_performance
on student_performance for select
using (auth.uid() = user_id);
