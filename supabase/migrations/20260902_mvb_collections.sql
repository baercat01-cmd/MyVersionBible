-- Named verse collections, with per-verse review state for memorising.
-- RLS: deny by default; each user can only touch their own rows.
create table if not exists public.mvb_collections (
  id uuid primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null default '',
  description text not null default '',
  items jsonb not null default '[]'::jsonb,
  memorize boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted boolean not null default false
);

create index if not exists mvb_collections_user_updated on public.mvb_collections (user_id, updated_at);

alter table public.mvb_collections enable row level security;

create policy "mvb_collections_select_own" on public.mvb_collections
  for select using (auth.uid() = user_id);

create policy "mvb_collections_insert_own" on public.mvb_collections
  for insert with check (auth.uid() = user_id);

create policy "mvb_collections_update_own" on public.mvb_collections
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "mvb_collections_delete_own" on public.mvb_collections
  for delete using (auth.uid() = user_id);
