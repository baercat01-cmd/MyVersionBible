-- MyVersionBible notes table, in the shared Supabase project.
-- RLS: deny by default; each user can only touch their own rows.
create table if not exists public.mvb_notes (
  id uuid primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  kind text not null check (kind in ('verse', 'study', 'journal')),
  title text not null default '',
  content text not null default '',
  template text,
  sections jsonb,
  refs jsonb not null default '[]'::jsonb,
  tags jsonb not null default '[]'::jsonb,
  color text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted boolean not null default false
);

create index if not exists mvb_notes_user_updated on public.mvb_notes (user_id, updated_at);

alter table public.mvb_notes enable row level security;

create policy "mvb_notes_select_own" on public.mvb_notes
  for select using (auth.uid() = user_id);

create policy "mvb_notes_insert_own" on public.mvb_notes
  for insert with check (auth.uid() = user_id);

create policy "mvb_notes_update_own" on public.mvb_notes
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "mvb_notes_delete_own" on public.mvb_notes
  for delete using (auth.uid() = user_id);
