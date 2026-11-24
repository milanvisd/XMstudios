import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Server-side Supabase client.
 *
 * Read queries go through a fetch wrapper that opts into Next's data cache so
 * public pages can be statically rendered / revalidated instead of rendering
 * on every request. Mutations must use `createSupabaseWithToken` (or the
 * browser client) so nothing stale is cached.
 */
export const CONTENT_TAG = "content";
export const CONTENT_REVALIDATE = 60;

function getEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      "Supabase not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local"
    );
  }

  return { url, key };
}

const cachedFetch: typeof fetch = (input, init) =>
  fetch(input, {
    ...init,
    cache: "force-cache",
    next: { revalidate: CONTENT_REVALIDATE, tags: [CONTENT_TAG] },
  } as RequestInit);

let _client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (_client) return _client;

  const { url, key } = getEnv();
  _client = createClient(url, key, {
    global: { fetch: cachedFetch },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  return _client;
}

/**
 * Per-request client authenticated with a user's access token.
 * Never cached: used for uploads and other writes on the server.
 */
export function createSupabaseWithToken(token: string): SupabaseClient {
  const { url, key } = getEnv();

  return createClient(url, key, {
    global: {
      headers: { Authorization: `Bearer ${token}` },
      fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }),
    },
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
