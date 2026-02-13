-- ============================================================================
-- Stark Health — Migration 007: Goals
-- Run this in your Supabase SQL Editor
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.goals (
  id          uuid default gen_random_uuid() primary key,
  user_id     uuid references auth.users on delete cascade not null,
  metric      text not null,
  label       text not null,
  target_value numeric not null,
  direction   text not null check (direction in ('increase', 'decrease')),
  target_date date,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own goals" ON public.goals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own goals" ON public.goals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own goals" ON public.goals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own goals" ON public.goals FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER on_goal_updated BEFORE UPDATE ON public.goals
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- RPC for MCP access to goals
CREATE OR REPLACE FUNCTION public.get_goals_by_token(mcp_tok text)
RETURNS TABLE (id uuid, metric text, label text, target_value numeric, direction text, target_date date) AS $$
  SELECT g.id, g.metric, g.label, g.target_value, g.direction, g.target_date
  FROM public.goals g
  INNER JOIN public.profiles p ON p.id = g.user_id
  WHERE p.mcp_token = mcp_tok AND p.mcp_token IS NOT NULL;
$$ LANGUAGE sql SECURITY DEFINER;
