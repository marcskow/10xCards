-- /******************************************************************
--  * Migration: Disable RLS for Development
--  *
--  * Description:
--  * This migration temporarily disables Row-Level Security (RLS) on the
--  * core tables for development purposes. This allows for easier data
--  * access and testing without the restrictions of user-specific policies.
--  *
--  * IMPORTANT: RLS should be re-enabled before deploying to production.
--  *
--  * Affected Tables:
--  * - public.sets
--  * - public.cards
--  * - public.generation_sessions
--  ******************************************************************/

-- Disable RLS for the sets table.
-- This command preserves the existing policies but stops enforcing them.
alter table public.sets disable row level security;

-- Disable RLS for the cards table.
-- This command preserves the existing policies but stops enforcing them.
alter table public.cards disable row level security;

-- Disable RLS for the generation_sessions table.
-- This command preserves the existing policies but stops enforcing them.
alter table public.generation_sessions disable row level security;
