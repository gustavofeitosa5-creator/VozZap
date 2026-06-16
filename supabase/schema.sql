-- ════════════════════════════════════════════════════════════════
-- VozZap — Schema completo (Database + Storage + RLS + Realtime)
-- Execute no SQL Editor do Supabase.
-- ════════════════════════════════════════════════════════════════

-- ───────────────────────── TABELAS ─────────────────────────

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  display_name text not null,
  bio text,
  avatar_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  caption text,
  audio_url text not null,
  duration integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.likes (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (post_id, user_id)
);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.follows (
  id uuid primary key default gen_random_uuid(),
  follower_id uuid not null references public.profiles(id) on delete cascade,
  following_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (follower_id, following_id),
  check (follower_id <> following_id)
);

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  user_a uuid not null references public.profiles(id) on delete cascade,
  user_b uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_a, user_b),
  check (user_a < user_b)
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_posts_created on public.posts (created_at desc);
create index if not exists idx_comments_post on public.comments (post_id);
create index if not exists idx_likes_post on public.likes (post_id);
create index if not exists idx_messages_convo on public.messages (conversation_id, created_at);

-- ───────────────────────── RLS ─────────────────────────

alter table public.profiles enable row level security;
alter table public.posts enable row level security;
alter table public.likes enable row level security;
alter table public.comments enable row level security;
alter table public.follows enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;

-- profiles
create policy "profiles_select_all" on public.profiles
  for select using (true);
create policy "profiles_insert_self" on public.profiles
  for insert with check (auth.uid() = id);
create policy "profiles_update_self" on public.profiles
  for update using (auth.uid() = id);

-- posts
create policy "posts_select_all" on public.posts
  for select using (true);
create policy "posts_insert_self" on public.posts
  for insert with check (auth.uid() = user_id);
create policy "posts_delete_self" on public.posts
  for delete using (auth.uid() = user_id);
create policy "posts_update_self" on public.posts
  for update using (auth.uid() = user_id)
  with check (auth.uid() = user_id and now() - created_at < interval '1 hour');

-- likes
create policy "likes_select_all" on public.likes
  for select using (true);
create policy "likes_insert_self" on public.likes
  for insert with check (auth.uid() = user_id);
create policy "likes_delete_self" on public.likes
  for delete using (auth.uid() = user_id);

-- comments
create policy "comments_select_all" on public.comments
  for select using (true);
create policy "comments_insert_self" on public.comments
  for insert with check (auth.uid() = user_id);
create policy "comments_delete_self" on public.comments
  for delete using (auth.uid() = user_id);

-- follows
create policy "follows_select_all" on public.follows
  for select using (true);
create policy "follows_insert_self" on public.follows
  for insert with check (auth.uid() = follower_id);
create policy "follows_delete_self" on public.follows
  for delete using (auth.uid() = follower_id);

-- conversations
create policy "conversations_select_member" on public.conversations
  for select using (auth.uid() = user_a or auth.uid() = user_b);
create policy "conversations_insert_member" on public.conversations
  for insert with check (auth.uid() = user_a or auth.uid() = user_b);

-- messages
create policy "messages_select_member" on public.messages
  for select using (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id
        and (auth.uid() = c.user_a or auth.uid() = c.user_b)
    )
  );
create policy "messages_insert_member" on public.messages
  for insert with check (
    auth.uid() = sender_id and exists (
      select 1 from public.conversations c
      where c.id = conversation_id
        and (auth.uid() = c.user_a or auth.uid() = c.user_b)
    )
  );

-- ───────────────────────── REALTIME ─────────────────────────
alter publication supabase_realtime add table public.messages;

-- ───────────────────────── STORAGE ─────────────────────────
insert into storage.buckets (id, name, public)
  values ('audios', 'audios', true) on conflict (id) do nothing;
insert into storage.buckets (id, name, public)
  values ('avatars', 'avatars', true) on conflict (id) do nothing;

-- Storage RLS: leitura pública, escrita só na própria pasta {uid}/...
create policy "audios_read" on storage.objects
  for select using (bucket_id = 'audios');
create policy "audios_insert_own" on storage.objects
  for insert with check (
    bucket_id = 'audios' and auth.uid()::text = (storage.foldername(name))[1]
  );
create policy "audios_delete_own" on storage.objects
  for delete using (
    bucket_id = 'audios' and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "avatars_read" on storage.objects
  for select using (bucket_id = 'avatars');
create policy "avatars_insert_own" on storage.objects
  for insert with check (
    bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]
  );
create policy "avatars_update_own" on storage.objects
  for update using (
    bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]
  );
create policy "avatars_delete_own" on storage.objects
  for delete using (
    bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]
  );
