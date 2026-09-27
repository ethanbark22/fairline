/**
 * SupabaseAuthClient: the real implementation, using Supabase Auth's own
 * client SDK. Passwords never touch our code — Supabase's server hashes and
 * checks them. The 18+ confirmation is stored as user metadata (there's no
 * separate `profiles` table yet; see docs/PLAN.md, migration 0005_users,
 * for when one gets added).
 *
 * Not used until NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
 * are set — see get-auth-client.ts. Until then the sample client runs
 * everything, so this file can exist and be reviewed without a Supabase
 * project or any cost.
 */

import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";
import type { AuthClient, AuthUser } from "./types";

function toAuthUser(user: User): AuthUser {
  return {
    id: user.id,
    email: user.email ?? "",
    displayName: (user.user_metadata?.displayName as string | undefined) ?? null,
    ageConfirmed: user.user_metadata?.ageConfirmed === true,
  };
}

export class SupabaseAuthClient implements AuthClient {
  private readonly client: SupabaseClient;

  constructor(url: string, anonKey: string) {
    this.client = createClient(url, anonKey);
  }

  async signUp(email: string, password: string, ageConfirmed: boolean, displayName?: string): Promise<AuthUser> {
    if (!ageConfirmed) {
      throw new Error("You must confirm you are 18 or over to create an account.");
    }
    const { data, error } = await this.client.auth.signUp({
      email,
      password,
      options: { data: { ageConfirmed: true, displayName: displayName?.trim() || null } },
    });
    if (error) throw error;
    if (!data.user) throw new Error("Sign-up did not return a user.");
    return toAuthUser(data.user);
  }

  async signIn(email: string, password: string): Promise<AuthUser> {
    const { data, error } = await this.client.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return toAuthUser(data.user);
  }

  async signOut(): Promise<void> {
    const { error } = await this.client.auth.signOut();
    if (error) throw error;
  }

  async getCurrentUser(): Promise<AuthUser | null> {
    const { data, error } = await this.client.auth.getUser();
    if (error || !data.user) return null;
    return toAuthUser(data.user);
  }
}
