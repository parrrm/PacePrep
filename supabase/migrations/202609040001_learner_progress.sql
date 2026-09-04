create table if not exists public.learner_progress (
  user_id uuid primary key references auth.users(id) on delete cascade,
  progress jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint progress_is_object check (jsonb_typeof(progress) = 'object'),
  constraint progress_size_limit check (octet_length(progress::text) <= 1000000)
);

alter table public.learner_progress enable row level security;
revoke all on public.learner_progress from anon;
grant select, insert, update, delete on public.learner_progress to authenticated;

create policy "Read own progress" on public.learner_progress for select
  to authenticated using ((select auth.uid()) = user_id);
create policy "Insert own progress" on public.learner_progress for insert
  to authenticated with check ((select auth.uid()) = user_id);
create policy "Update own progress" on public.learner_progress for update
  to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "Delete own progress" on public.learner_progress for delete
  to authenticated using ((select auth.uid()) = user_id);
