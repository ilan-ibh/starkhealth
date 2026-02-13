-- ============================================================================
-- Stark Health — Migration 006: Cron Token Refresh Functions
-- Run this in your Supabase SQL Editor
-- ============================================================================

-- Get all provider tokens expiring within a given number of minutes
CREATE OR REPLACE FUNCTION public.get_expiring_tokens(minutes_until_expiry int)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  provider text,
  access_token text,
  refresh_token text,
  expires_at timestamptz
) AS $$
  SELECT id, user_id, provider, access_token, refresh_token, expires_at
  FROM public.provider_tokens
  WHERE refresh_token IS NOT NULL
    AND expires_at IS NOT NULL
    AND expires_at < (now() + (minutes_until_expiry || ' minutes')::interval);
$$ LANGUAGE sql SECURITY DEFINER;

-- Update a provider token after refresh
CREATE OR REPLACE FUNCTION public.update_provider_token(
  p_id uuid,
  p_access_token text,
  p_refresh_token text,
  p_expires_at timestamptz
) RETURNS void AS $$
  UPDATE public.provider_tokens
  SET access_token = p_access_token,
      refresh_token = p_refresh_token,
      expires_at = p_expires_at,
      updated_at = now()
  WHERE id = p_id;
$$ LANGUAGE sql SECURITY DEFINER;
