-- Older Supabase projects may grant ALL to authenticated by default. RLS
-- governs row operations but does not protect TRUNCATE or other table powers.
-- Revoke those inherited grants before restoring the four required operations.
revoke all on public.learner_progress from anon, authenticated;
grant select, insert, update, delete on public.learner_progress to authenticated;
