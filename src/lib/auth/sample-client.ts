/**
 * SampleAuthClient: a working sign-up/sign-in flow with no Supabase project,
 * no network call and no real security — clearly labelled sample data, the
 * same as SampleFootballStatsProvider and SampleOddsProvider. Accounts are
 * stored in this browser only (localStorage), in plain text, and are lost
 * if the browser's site data is cleared. Never use this for real accounts;
 * see SupabaseAuthClient for the real implementation, which never touches
 * a password itself — Supabase's own server does that.
 */

import type { AuthClient, AuthUser } from "./types";

interface KeyValueStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

/** localStorage in the browser; an in-memory Map everywhere else (tests, SSR). */
function createDefaultStore(): KeyValueStore {
  if (typeof window !== "undefined" && window.localStorage) {
    return window.localStorage;
  }
  const memory = new Map<string, string>();
  return {
    getItem: (key) => memory.get(key) ?? null,
    setItem: (key, value) => {
      memory.set(key, value);
    },
  };
}

interface StoredAccount {
  id: string;
  email: string;
  /** Plain text — sample data only, never do this for real accounts. */
  password: string;
  displayName: string | null;
  ageConfirmed: boolean;
}

const USERS_KEY = "fairline:sample-auth:users";
const SESSION_KEY = "fairline:sample-auth:session";

function normaliseEmail(email: string): string {
  return email.trim().toLowerCase();
}

export class SampleAuthClient implements AuthClient {
  constructor(private readonly store: KeyValueStore = createDefaultStore()) {}

  private readUsers(): StoredAccount[] {
    const raw = this.store.getItem(USERS_KEY);
    return raw ? (JSON.parse(raw) as StoredAccount[]) : [];
  }

  private writeUsers(users: StoredAccount[]): void {
    this.store.setItem(USERS_KEY, JSON.stringify(users));
  }

  private toAuthUser(account: StoredAccount): AuthUser {
    return {
      id: account.id,
      email: account.email,
      displayName: account.displayName,
      ageConfirmed: account.ageConfirmed,
    };
  }

  async signUp(email: string, password: string, ageConfirmed: boolean, displayName?: string): Promise<AuthUser> {
    if (!ageConfirmed) {
      throw new Error("You must confirm you are 18 or over to create an account.");
    }
    if (!email.includes("@")) {
      throw new Error("Enter a valid email address.");
    }
    if (password.length < 8) {
      throw new Error("Password must be at least 8 characters.");
    }

    const normalised = normaliseEmail(email);
    const users = this.readUsers();
    if (users.some((u) => u.email === normalised)) {
      throw new Error("An account with that email already exists.");
    }

    const account: StoredAccount = {
      id: crypto.randomUUID(),
      email: normalised,
      password,
      displayName: displayName?.trim() || null,
      ageConfirmed: true,
    };
    this.writeUsers([...users, account]);
    this.store.setItem(SESSION_KEY, account.id);
    return this.toAuthUser(account);
  }

  async signIn(email: string, password: string): Promise<AuthUser> {
    const normalised = normaliseEmail(email);
    const account = this.readUsers().find((u) => u.email === normalised);
    if (!account || account.password !== password) {
      throw new Error("Email or password is incorrect.");
    }
    this.store.setItem(SESSION_KEY, account.id);
    return this.toAuthUser(account);
  }

  async signOut(): Promise<void> {
    this.store.setItem(SESSION_KEY, "");
  }

  async getCurrentUser(): Promise<AuthUser | null> {
    const sessionId = this.store.getItem(SESSION_KEY);
    if (!sessionId) return null;
    const account = this.readUsers().find((u) => u.id === sessionId);
    return account ? this.toAuthUser(account) : null;
  }
}
