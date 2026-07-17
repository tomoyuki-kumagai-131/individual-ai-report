-- Defense-in-depth Row Level Security.
--
-- The Next.js app talks to these tables through Drizzle using a direct
-- Postgres role, which BYPASSES RLS — every server query is already scoped by
-- user_id (see src/db/queries/*). These policies protect the tables from the
-- anon/authenticated PostgREST roles reachable with the public anon key.
--
-- Run this AFTER `npm run db:push` (or applying the drizzle migration) in the
-- Supabase SQL editor.

alter table public.posts enable row level security;
alter table public.reports enable row level security;

-- posts: a user can only see and mutate their own rows.
create policy "posts_select_own" on public.posts
  for select using (auth.uid() = user_id);
create policy "posts_insert_own" on public.posts
  for insert with check (auth.uid() = user_id);
create policy "posts_update_own" on public.posts
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "posts_delete_own" on public.posts
  for delete using (auth.uid() = user_id);

-- reports: read-only to the owner (writes happen server-side via Drizzle).
create policy "reports_select_own" on public.reports
  for select using (auth.uid() = user_id);
