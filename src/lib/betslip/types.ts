import type { MarketKey } from "@/lib/providers/odds/types";

/**
 * A single leg in the betslip: one outcome, from one market, from one
 * fixture, at the price it was added at. This is what the betslip UI stores
 * client-side — nothing here is saved to a database, and nothing here
 * places a real bet.
 *
 * A slip can hold at most one leg per (fixtureId, market) pair — picking a
 * different outcome in the same market swaps the leg, the same way
 * clicking a different price does on a real bookmaker's slip. Different
 * markets on the same fixture are separate legs (e.g. Match Winner and
 * Total Corners on the same match), and the correlation check treats them
 * as related.
 */
export interface BetslipSelection {
  fixtureId: string;
  competition: string;
  homeTeam: string;
  awayTeam: string;
  /** ISO date-time. */
  kickoff: string;
  market: MarketKey;
  /** Display label for the market, e.g. "Total Corners O/U 9.5". */
  marketLabel: string;
  outcome: string;
  price: number;
  bookmaker: string;
}
