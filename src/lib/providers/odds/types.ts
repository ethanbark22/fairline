/**
 * OddsProvider: the interface every prices source (The Odds API, or the
 * sample data used to build screens before we sign up) implements.
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
