-- ============================================================================
-- Stark Health — Migration 002: Provider Tokens
-- Run this in your Supabase SQL Editor
-- ============================================================================

-- Provider tokens table (OAuth tokens + API keys per user per provider)
create table if not exists public.provider_tokens (
  id            uuid default gen_random_uuid() primary key,
  user_id       uuid references auth.users on delete cascade not null,
  provider      text not null check (provider in ('whoop', 'withings', 'hevy')),
  access_token  text not null,
  refresh_token text,
  expires_at    timestamptz,
  scopes        text,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now(),
  unique(user_id, provider)
);

-- Enable RLS
alter table public.provider_tokens enable row level security;

-- Users can only access their own tokens
create policy "Users can view own tokens"
  on public.provider_tokens for select
  using (auth.uid() = user_id);

create policy "Users can insert own tokens"
  on public.provider_tokens for insert
  with check (auth.uid() = user_id);

create policy "Users can update own tokens"
  on public.provider_tokens for update
  using (auth.uid() = user_id);

create policy "Users can delete own tokens"
  on public.provider_tokens for delete
  using (auth.uid() = user_id);

-- Auto-update updated_at
create trigger on_provider_token_updated
  before update on public.provider_tokens
  for each row execute function public.handle_updated_at();
