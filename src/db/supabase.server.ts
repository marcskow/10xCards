import { createServerClient } from "@supabase/ssr";
import type { AstroCookies } from "astro";
import type { Database } from "./database.types";

/**
 * Creates a Supabase client for server-side rendering with cookie management.
 * This client handles session persistence via HTTP-only cookies.
 *
 * @param cookies - Astro cookies object for reading/writing cookies
 * @returns Configured Supabase server client
 */
export function createSupabaseServerClient(cookies: AstroCookies) {
  return createServerClient<Database>(import.meta.env.SUPABASE_URL, import.meta.env.SUPABASE_KEY, {
    cookies: {
      get(key: string) {
        return cookies.get(key)?.value;
      },
      set(key: string, value: string, options) {
        cookies.set(key, value, options);
      },
      remove(key: string, options) {
        cookies.delete(key, options);
      },
    },
  });
}

/**
 * Type alias for the Supabase server client.
 * Use this type when passing the client as a parameter.
 */
export type SupabaseServerClient = ReturnType<typeof createSupabaseServerClient>;
