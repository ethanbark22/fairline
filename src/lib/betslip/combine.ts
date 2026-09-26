/**
 * Accumulator maths for the betslip, and the correlation check the plan
 * requires (docs/PLAN.md, "How the analysis works" in CLAUDE.md): never
 * silently multiply leg probabilities together as if they were independent.
 */

import type { BetslipSelection } from "./types";

/**
 * The accumulator's combined decimal price: legs' prices multiplied
 * together, the same way a bookmaker's slip shows what a £1 stake would
 * return if every leg won. This is a price, not a probability claim — it's
 * definitional (how accumulator payouts work), so it's always safe to show.
 */
export function combinedPrice(prices: readonly number[]): number {
  if (prices.length === 0) {
    throw new RangeError("combinedPrice needs at least one price");
  }
  return prices.reduce((total, price) => {
    if (!Number.isFinite(price) || price <= 1) {
      throw new RangeError(`Decimal price must be a finite number above 1, got ${price}`);
    }
    return total * price;
  }, 1);
}

export interface CorrelationCheck {
  correlated: boolean;
  /** Team names involved in more than one leg, if any. */
  sharedTeams: string[];
  /** Fixture ids that appear more than once (shouldn't happen via the UI, but guarded here too). */
  sharedFixtures: string[];
}

/**
 * Looks for legs that are not independent of each other: the same match
 * appearing twice, or a team appearing in more than one leg (e.g. backing
 * a team to win one match and, separately, backing their next opponent).
 * When this is true, the combined price is still arithmetically correct,
 * but a combined "fair chance" from multiplying probabilities would not
 * be — the legs' outcomes can move together.
 */
export function checkCorrelation(selections: readonly BetslipSelection[]): CorrelationCheck {
  const teamCounts = new Map<string, number>();
  const fixtureCounts = new Map<string, number>();

  for (const s of selections) {
    fixtureCounts.set(s.fixtureId, (fixtureCounts.get(s.fixtureId) ?? 0) + 1);
    for (const team of [s.homeTeam, s.awayTeam]) {
      teamCounts.set(team, (teamCounts.get(team) ?? 0) + 1);
    }
  }

  const sharedTeams = [...teamCounts.entries()].filter(([, n]) => n > 1).map(([team]) => team);
  const sharedFixtures = [...fixtureCounts.entries()].filter(([, n]) => n > 1).map(([id]) => id);

  return {
    correlated: sharedTeams.length > 0 || sharedFixtures.length > 0,
    sharedTeams,
    sharedFixtures,
  };
}
