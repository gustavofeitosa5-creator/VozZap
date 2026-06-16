-- ════════════════════════════════════════════════════════════════
-- VozZap — Migrations para adicionar Título, Categorias e Visibilidade
-- Execute no SQL Editor do Supabase
-- ════════════════════════════════════════════════════════════════

-- ───── 1. Adicionar colunas à tabela posts ─────
alter table public.posts
add column if not exists title text,
add column if not exists category text,
add column if not exists visibility text not null default 'public' check (visibility in ('public', 'friends_only', 'close_friends'));

-- ───── 2. Criar tabela de melhores amigos ─────
create table if not exists public.close_friends (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  close_friend_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, close_friend_id),
  check (user_id <> close_friend_id)
);

-- ───── 3. Criar índices ─────
create index if not exists idx_close_friends_user on public.close_friends (user_id);
create index if not exists idx_posts_visibility on public.posts (visibility);

-- ───── 4. Habilitar RLS na tabela close_friends ─────
alter table public.close_friends enable row level security;

-- ───── 5. Criar políticas para close_friends ─────
create policy "close_friends_select_self" on public.close_friends
  for select using (auth.uid() = user_id or auth.uid() = close_friend_id);
create policy "close_friends_insert_self" on public.close_friends
  for insert with check (auth.uid() = user_id);
create policy "close_friends_delete_self" on public.close_friends
  for delete using (auth.uid() = user_id);

-- ───── 6. Atualizar política de posts para respeitar visibilidade ─────
-- Mantém a policy existente, mas adiciona lógica opcional de visibilidade
-- Note: A validação de visibilidade será feita na aplicação

-- ═════════════════════════════════════════════════════════════════
-- PRÓXIMOS PASSOS:
-- 1. Execute este SQL no Supabase SQL Editor
-- 2. Reinicie o servidor de desenvolvimento
-- 3. O aplicativo agora terá suporte para título, categorias e visibilidade
-- ═════════════════════════════════════════════════════════════════

-- ───── 7. Adicionar colunas para suporte a edição de posts ─────
alter table public.posts
  add column if not exists edited boolean not null default false,
  add column if not exists updated_at timestamptz;

-- OBS: Rode esse SQL no Supabase para habilitar o flag de edição.
