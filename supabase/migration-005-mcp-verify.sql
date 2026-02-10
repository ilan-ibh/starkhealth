-- ============================================================================
-- Stark Health — Migration 005: MCP Token Verification Function
-- Run this in your Supabase SQL Editor
-- ============================================================================

-- Verify MCP token and return user profile (bypasses RLS)
CREATE OR REPLACE FUNCTION public.verify_mcp_token(token text)
RETURNS TABLE (
  id uuid,
  anthropic_api_key text,
  ai_model text
) AS $$
  SELECT id, anthropic_api_key, ai_model
  FROM public.profiles
  WHERE mcp_token = token
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

-- Get provider tokens for a user (bypasses RLS for MCP server)
CREATE OR REPLACE FUNCTION public.get_provider_tokens(p_user_id uuid)
RETURNS TABLE (
  provider text,
  access_token text,
  refresh_token text,
  expires_at timestamptz
) AS $$
  SELECT provider, access_token, refresh_token, expires_at
  FROM public.provider_tokens
  WHERE user_id = p_user_id;
$$ LANGUAGE sql SECURITY DEFINER;

-- Get cached health data for a user (bypasses RLS for MCP server)
CREATE OR REPLACE FUNCTION public.get_health_cache(p_user_id uuid)
RETURNS TABLE (
  date date,
  data jsonb,
  synced_at timestamptz
) AS $$
  SELECT date, data, synced_at
  FROM public.health_cache
  WHERE user_id = p_user_id
  ORDER BY date ASC;
$$ LANGUAGE sql SECURITY DEFINER;

-- Get cached workouts for a user (bypasses RLS for MCP server)
CREATE OR REPLACE FUNCTION public.get_workout_cache(p_user_id uuid)
RETURNS TABLE (
  workout_id text,
  data jsonb,
  synced_at timestamptz
) AS $$
  SELECT workout_id, data, synced_at
  FROM public.workout_cache
  WHERE user_id = p_user_id;
$$ LANGUAGE sql SECURITY DEFINER;
