"use client";

import Link from "next/link";
import { useAuth } from "@/components/auth/auth-context";

/** A slim bar on every page: the wordmark, and sign-in status on the right. */
export function SiteHeader() {
  const { user, loading, signOut } = useAuth();

  return (
    <header className="border-b border-line bg-surface px-4 py-2.5">
      <div className="mx-auto flex max-w-5xl items-center justify-between">
        <Link href="/" className="font-display text-sm font-semibold">
          Fair<span className="text-brand">line</span>
        </Link>

        <div className="text-sm">
          {loading ? null : user ? (
            <div className="flex items-center gap-3">
              <span className="text-muted">{user.displayName ?? user.email}</span>
              <button type="button" onClick={() => signOut()} className="text-brand underline">
                Log out
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link href="/signin" className="text-muted hover:text-foreground">
                Sign in
              </Link>
              <Link href="/signup" className="text-brand underline">
                Sign up
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
