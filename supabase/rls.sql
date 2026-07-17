-- Defense-in-depth Row Level Security.
--
-- The Next.js app talks to these tables through Drizzle using a direct
-- Postgres role, which BYPASSES RLS — every server query is already scoped by
-- user_id (see src/db/queries/*). These policies protect the tables from the
-- anon/authenticated PostgREST roles reachable with the public anon key.
--
-- `drizzle-kit push` strips RLS, so run this AFTER every push:
--   npm run db:push && npm run db:rls
-- Written idempotently (drop-then-create) so it is safe to re-run.

alter table public.posts enable row level security;
alter table public.reports enable row level security;
alter table public.profiles enable row level security;

-- posts: a user can only see and mutate their own rows.
drop policy if exists "posts_select_own" on public.posts;
create policy "posts_select_own" on public.posts
  for select using (auth.uid() = user_id);
drop policy if exists "posts_insert_own" on public.posts;
create policy "posts_insert_own" on public.posts
  for insert with check (auth.uid() = user_id);
drop policy if exists "posts_update_own" on public.posts;
create policy "posts_update_own" on public.posts
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "posts_delete_own" on public.posts;
create policy "posts_delete_own" on public.posts
  for delete using (auth.uid() = user_id);

-- reports: read-only to the owner (writes happen server-side via Drizzle).
drop policy if exists "reports_select_own" on public.reports;
create policy "reports_select_own" on public.reports
  for select using (auth.uid() = user_id);

-- profiles: read-only to the owner (writes happen server-side via Drizzle).
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = user_id);
