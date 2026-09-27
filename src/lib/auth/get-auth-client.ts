import type { AuthClient } from "./types";
import { SampleAuthClient } from "./sample-client";
import { SupabaseAuthClient } from "./supabase-client";

/**
 * True when a real Supabase project is connected (both env vars set).
 * Exported so the UI can show "sample accounts" messaging accurately.
 */
export const HAS_SUPABASE_PROJECT = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

let client: AuthClient | null = null;

/** One shared client for the whole app. Picks Supabase once it's configured; sample data until then. */
export function getAuthClient(): AuthClient {
  if (!client) {
    client = HAS_SUPABASE_PROJECT
      ? new SupabaseAuthClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
      : new SampleAuthClient();
  }
  return client;
}
