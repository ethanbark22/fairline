/**
 * AuthClient: the interface the sign-up/sign-in screens talk to. Swappable
 * between a real Supabase Auth client and a sample one that works without
 * any account or network call, the same pattern as FootballStatsProvider
 * and OddsProvider (see docs/PLAN.md).
 */

export interface AuthUser {
  id: string;
  email: string;
  /** Optional, collected at sign-up; falls back to the email in the UI. */
  displayName: string | null;
  /** Must be true — enforced by AuthClient implementations, never just the UI. */
  ageConfirmed: boolean;
}

export interface AuthClient {
  signUp(email: string, password: string, ageConfirmed: boolean, displayName?: string): Promise<AuthUser>;
  signIn(email: string, password: string): Promise<AuthUser>;
  signOut(): Promise<void>;
  getCurrentUser(): Promise<AuthUser | null>;
}
