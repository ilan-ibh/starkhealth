-- ============================================================================
-- Stark Health — Migration 005: MCP Token Verification Functions
-- Run this in your Supabase SQL Editor
-- ============================================================================

-- Drop old versions (if upgrading)
DROP FUNCTION IF EXISTS public.verify_mcp_token(text);
DROP FUNCTION IF EXISTS public.get_provider_tokens(uuid);
DROP FUNCTION IF EXISTS public.get_health_cache(uuid);
DROP FUNCTION IF EXISTS public.get_workout_cache(uuid);

-- Verify MCP token and return user profile (bypasses RLS)
CREATE OR REPLACE FUNCTION public.verify_mcp_token(token text)
RETURNS TABLE (id uuid, anthropic_api_key text, ai_model text) AS $$
  SELECT id, anthropic_api_key, ai_model
  FROM public.profiles
  WHERE mcp_token = token AND mcp_token IS NOT NULL
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

-- Get provider tokens — REQUIRES valid MCP token (not just a user_id)
CREATE OR REPLACE FUNCTION public.get_provider_tokens_by_token(mcp_tok text)
RETURNS TABLE (provider text, access_token text, refresh_token text, expires_at timestamptz) AS $$
  SELECT pt.provider, pt.access_token, pt.refresh_token, pt.expires_at
  FROM public.provider_tokens pt
  INNER JOIN public.profiles p ON p.id = pt.user_id
  WHERE p.mcp_token = mcp_tok AND p.mcp_token IS NOT NULL;
$$ LANGUAGE sql SECURITY DEFINER;

-- Get cached health data — REQUIRES valid MCP token
CREATE OR REPLACE FUNCTION public.get_health_cache_by_token(mcp_tok text)
RETURNS TABLE (date date, data jsonb, synced_at timestamptz) AS $$
  SELECT hc.date, hc.data, hc.synced_at
  FROM public.health_cache hc
  INNER JOIN public.profiles p ON p.id = hc.user_id
  WHERE p.mcp_token = mcp_tok AND p.mcp_token IS NOT NULL
  ORDER BY hc.date ASC;
$$ LANGUAGE sql SECURITY DEFINER;

-- Get cached workouts — REQUIRES valid MCP token
CREATE OR REPLACE FUNCTION public.get_workout_cache_by_token(mcp_tok text)
RETURNS TABLE (workout_id text, data jsonb, synced_at timestamptz) AS $$
  SELECT wc.workout_id, wc.data, wc.synced_at
  FROM public.workout_cache wc
  INNER JOIN public.profiles p ON p.id = wc.user_id
  WHERE p.mcp_token = mcp_tok AND p.mcp_token IS NOT NULL
  ORDER BY wc.synced_at ASC;
$$ LANGUAGE sql SECURITY DEFINER;
