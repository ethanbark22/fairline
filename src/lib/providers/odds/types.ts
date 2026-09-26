import type { Outcome } from "@/lib/backtest/walk-forward";

/**
 * Types for the real The Odds API client (src/lib/providers/odds/the-odds-api.ts),
 * used by the standalone `npm run odds:compare` research tool. These are
 * shaped around that one provider's actual endpoints, which is why they're
 * more detailed than the app-facing OddsProvider interface below.
 */

export type MatchWinnerPrices = Record<Outcome, number>;

export interface OddsEvent {
  /** The provider's ID for the fixture (the same across regions). */
  providerEventId: string;
  commenceTime: string; // ISO timestamp
  homeTeam: string;
  awayTeam: string;
}

export interface BookmakerPrices {
  bookmakerKey: string;
  bookmakerTitle: string;
  /** When the provider last saw this bookmaker's prices change. */
  lastUpdate: string;
  prices: MatchWinnerPrices;
}

export interface EventOdds extends OddsEvent {
  bookmakers: BookmakerPrices[];
}

/** Credit usage reported by the provider after a call (null if not reported). */
export interface ProviderUsage {
  used: number | null;
  remaining: number | null;
  lastCallCost: number | null;
}

/** The real The Odds API client's shape — narrower and more API-specific than OddsProvider below. */
export interface TheOddsApiClient {
  /** Upcoming fixtures. Free on The Odds API. */
  getEvents(competitionKey: string): Promise<{ events: OddsEvent[]; usage: ProviderUsage }>;
  /** Match winner (home / draw / away) prices from one region's bookmakers. Costs credits. */
  getMatchWinnerOdds(
    competitionKey: string,
    region: string,
  ): Promise<{ events: EventOdds[]; usage: ProviderUsage }>;
}

/**
 * OddsProvider: the interface every prices source the app's screens use (The
 * Odds API, or the sample data used to build screens before we sign up)
 * implements. Nothing outside src/lib/providers depends on a specific
 * vendor, so the real provider can be swapped in behind this later.
 *
 * The app only ever talks to this interface. Pinnacle's fair price is
 * always derived from raw Pinnacle prices by our own lib/price functions,
 * never supplied pre-calculated, so the maths stays in one place.
 */

export interface FixtureSummary {
  fixtureId: string;
  competition: string;
  homeTeam: string;
  awayTeam: string;
  /** ISO date-time. */
  kickoff: string;
}

export interface BestUkPrice {
  outcome: string;
  bookmaker: string;
  price: number;
  /** ISO date-time this price was captured. */
  capturedAt: string;
}

export interface PriceMovementPoint {
  price: number;
  /** ISO date-time. */
  capturedAt: string;
}

export interface OutcomePriceComparison {
  outcome: string;
  bestUk: BestUkPrice;
  /** Raw Pinnacle decimal price for this outcome, before margin removal. */
  pinnaclePrice: number;
  /** The best UK price's opening and current capture, for "how has this moved". */
  opening: PriceMovementPoint;
  current: PriceMovementPoint;
}

export interface PriceComparison {
  fixtureId: string;
  outcomes: OutcomePriceComparison[];
}

export interface OddsProvider {
  getUpcomingFixtures(competition: string): Promise<FixtureSummary[]>;
  getPriceComparison(fixtureId: string): Promise<PriceComparison>;
}
