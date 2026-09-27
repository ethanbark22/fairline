"use client";

import Link from "next/link";
import { useAuth } from "@/components/auth/auth-context";

/** A bold sportsbook-style top bar on every page: the logo on the left, sign-in status on the right. */
export function SiteHeader() {
  const { user, loading, signOut } = useAuth();

  return (
    <header className="border-b-4 border-accent bg-header-bg px-4 py-3 text-header-foreground shadow-lg">
      <div className="mx-auto flex max-w-5xl items-center justify-between">
        <Link href="/" className="flex items-center gap-2 transition hover:opacity-90 active:scale-95">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-base font-black text-accent-foreground shadow-[0_0_12px_var(--accent)]">
            F
          </span>
          <span className="font-display text-xl font-extrabold tracking-tight uppercase">
            Fair<span className="text-accent">line</span>
          </span>
        </Link>

        <div className="text-sm font-semibold">
          {loading ? null : user ? (
            <div className="flex items-center gap-3">
              <span className="text-header-foreground/80">{user.displayName ?? user.email}</span>
              <button
                type="button"
                onClick={() => signOut()}
                className="rounded-full border border-header-foreground/30 px-3 py-1 text-xs uppercase tracking-wide transition hover:border-accent hover:text-accent active:scale-95"
              >
                Log out
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/signin"
                className="rounded-full px-3 py-1.5 text-xs uppercase tracking-wide text-header-foreground/80 transition hover:text-accent active:scale-95"
              >
                Sign in
              </Link>
              <Link
                href="/signup"
                className="rounded-full bg-accent px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-accent-foreground shadow-[0_0_10px_var(--accent)] transition hover:brightness-110 active:scale-95"
              >
                Sign up
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
