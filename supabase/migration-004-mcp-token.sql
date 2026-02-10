-- ============================================================================
-- Stark Health — Migration 004: MCP Token
-- Run this in your Supabase SQL Editor
-- ============================================================================

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS mcp_token text;
