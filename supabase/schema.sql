-- ============================================================================
-- Stark Health — Database Schema
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard)
-- ============================================================================

-- Profiles table (one row per user)
create table public.profiles (
  id            uuid references auth.users on delete cascade primary key,
  anthropic_api_key text,
  units         text default 'metric' check (units in ('metric', 'imperial')),
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- Enable Row Level Security
alter table public.profiles enable row level security;

-- Users can only read their own profile
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

-- Users can only update their own profile
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Users can insert their own profile
create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Auto-create a profile row when a new user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Updated_at auto-update
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger on_profile_updated
  before update on public.profiles
  for each row execute function public.handle_updated_at();
