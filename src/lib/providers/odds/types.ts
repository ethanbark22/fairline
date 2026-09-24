/**
 * The odds provider interface. Nothing outside src/lib/providers depends on a
 * specific vendor, so The Odds API can be swapped for another source later.
 */
import type { Outcome } from "@/lib/backtest/walk-forward";

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

export interface OddsProvider {
  /** Upcoming fixtures. Free on The Odds API. */
  getEvents(competitionKey: string): Promise<{ events: OddsEvent[]; usage: ProviderUsage }>;
  /** Match winner (home / draw / away) prices from one region's bookmakers. Costs credits. */
  getMatchWinnerOdds(
    competitionKey: string,
    region: string,
  ): Promise<{ events: EventOdds[]; usage: ProviderUsage }>;
}
