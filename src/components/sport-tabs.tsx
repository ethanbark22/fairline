const SPORTS = [
  { name: "Football", available: true },
  { name: "Tennis", available: false },
  { name: "Horse Racing", available: false },
  { name: "Basketball", available: false },
  { name: "Darts", available: false },
  { name: "Cricket", available: false },
];

const COMPETITIONS = [
  { name: "Premier League", available: true },
  { name: "Champions League", available: false },
  { name: "Championship", available: false },
  { name: "FA Cup", available: false },
];

/**
 * Sportsbook-style sport and competition pickers. Only Football / Premier
 * League actually has data (sample data for now) — everything else is
 * shown but locked, so the page looks and feels like a real sportsbook
 * without claiming coverage we don't have yet. See CLAUDE.md: don't claim
 * a market is supported until a data provider actually backs it.
 */
export function SportTabs() {
  return (
    <div className="mt-6 flex gap-2 overflow-x-auto pb-1">
      {SPORTS.map((sport) => (
        <button
          key={sport.name}
          type="button"
          disabled={!sport.available}
          title={sport.available ? undefined : `${sport.name} — coming soon`}
          className={`flex shrink-0 items-center gap-1.5 rounded-full border-2 px-4 py-2 text-sm font-bold uppercase tracking-wide transition ${
            sport.available
              ? "border-accent bg-accent text-accent-foreground shadow-[0_0_14px_var(--accent)] hover:brightness-110 active:scale-95"
              : "cursor-not-allowed border-line bg-surface-2 text-muted opacity-60"
          }`}
        >
          {sport.name}
          {!sport.available && (
            <span className="rounded-full bg-black/20 px-1.5 py-0.5 text-[9px] font-semibold normal-case tracking-normal">
              Soon
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

export function CompetitionChips() {
  return (
    <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
      {COMPETITIONS.map((c) => (
        <button
          key={c.name}
          type="button"
          disabled={!c.available}
          title={c.available ? undefined : `${c.name} — coming soon`}
          className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
            c.available
              ? "border-brand bg-brand/15 text-brand hover:bg-brand/25 active:scale-95"
              : "cursor-not-allowed border-line text-muted opacity-60"
          }`}
        >
          {c.name}
          {!c.available && <span className="ml-1 text-[10px]">(soon)</span>}
        </button>
      ))}
    </div>
  );
}
