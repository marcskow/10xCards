import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./database.types";

/**
 * Client-side Supabase client for browser-based operations.
 * Uses SSR-compatible browser client for proper cookie handling.
 *
 * Note: Uses PUBLIC_ env vars that are exposed to the client.
 */
export const supabaseClient = createBrowserClient<Database>(
  import.meta.env.PUBLIC_SUPABASE_URL || import.meta.env.SUPABASE_URL,
  import.meta.env.PUBLIC_SUPABASE_ANON_KEY || import.meta.env.SUPABASE_KEY
);

/**
 * Type alias for the Supabase client.
 * Import this type instead of importing from @supabase/supabase-js directly.
 */
export type SupabaseClient = typeof supabaseClient;
