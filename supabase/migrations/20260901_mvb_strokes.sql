-- Freehand stylus strokes drawn over a chapter, in the shared Supabase project.
-- Points are stored normalised to the width of the text column (x in 0..1, y in
-- the same unit), so a drawing lands in the same place on every device.
-- RLS: deny by default; each user can only touch their own rows.
create table if not exists public.mvb_strokes (
  id uuid primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  page_key text not null,
  translation text not null,
  book integer not null,
  chapter integer not null,
  tool text not null default 'pen' check (tool in ('pen', 'marker')),
  color text not null default '#3f76b5',
  width double precision not null default 0.006,
  points jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted boolean not null default false
);

create index if not exists mvb_strokes_user_updated on public.mvb_strokes (user_id, updated_at);
create index if not exists mvb_strokes_user_page on public.mvb_strokes (user_id, page_key);

alter table public.mvb_strokes enable row level security;

create policy "mvb_strokes_select_own" on public.mvb_strokes
  for select using (auth.uid() = user_id);

create policy "mvb_strokes_insert_own" on public.mvb_strokes
  for insert with check (auth.uid() = user_id);

create policy "mvb_strokes_update_own" on public.mvb_strokes
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "mvb_strokes_delete_own" on public.mvb_strokes
  for delete using (auth.uid() = user_id);
