-- ============================================================================
-- Stark Health — Migration 003: Health Data Cache
-- Run this in your Supabase SQL Editor
-- ============================================================================

-- Daily health metrics cache (WHOOP + Withings merged per day)
create table if not exists public.health_cache (
  user_id    uuid references auth.users on delete cascade not null,
  date       date not null,
  data       jsonb not null,
  synced_at  timestamptz default now(),
  primary key (user_id, date)
);

alter table public.health_cache enable row level security;

create policy "Users can view own health cache"
  on public.health_cache for select using (auth.uid() = user_id);
create policy "Users can insert own health cache"
  on public.health_cache for insert with check (auth.uid() = user_id);
create policy "Users can update own health cache"
  on public.health_cache for update using (auth.uid() = user_id);
create policy "Users can delete own health cache"
  on public.health_cache for delete using (auth.uid() = user_id);

-- Workout cache (Hevy workouts)
create table if not exists public.workout_cache (
  user_id     uuid references auth.users on delete cascade not null,
  workout_id  text not null,
  data        jsonb not null,
  synced_at   timestamptz default now(),
  primary key (user_id, workout_id)
);

alter table public.workout_cache enable row level security;

create policy "Users can view own workout cache"
  on public.workout_cache for select using (auth.uid() = user_id);
create policy "Users can insert own workout cache"
  on public.workout_cache for insert with check (auth.uid() = user_id);
create policy "Users can update own workout cache"
  on public.workout_cache for update using (auth.uid() = user_id);
create policy "Users can delete own workout cache"
  on public.workout_cache for delete using (auth.uid() = user_id);
