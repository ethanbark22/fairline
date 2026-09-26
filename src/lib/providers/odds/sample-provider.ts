/**
 * SampleOddsProvider: clearly labelled made-up prices, used to build and
 * review the fixtures list and match page before we sign up with The Odds
 * API (see docs/PLAN.md). Implements the same OddsProvider interface a real
 * provider will, so swapping one for the other later needs no changes to
 * any page.
 *
 * None of the prices below are real bookmaker prices.
 */

import { SAMPLE_TEAMS } from "@/lib/sample-data/teams";
import type {
  FixtureSummary,
  MarketPriceComparison,
  OddsProvider,
  OutcomePriceComparison,
  PriceComparison,
} from "./types";

const COMPETITION = "Premier League";

const SAMPLE_FIXTURES: FixtureSummary[] = [
  {
    fixtureId: "fx-1",
    competition: COMPETITION,
    homeTeam: SAMPLE_TEAMS.arsenal,
    awayTeam: SAMPLE_TEAMS.chelsea,
    kickoff: "2026-10-04T14:00:00Z",
  },
  {
    fixtureId: "fx-2",
    competition: COMPETITION,
    homeTeam: SAMPLE_TEAMS.liverpool,
    awayTeam: SAMPLE_TEAMS["man-city"],
    kickoff: "2026-10-04T16:30:00Z",
  },
  {
    fixtureId: "fx-3",
    competition: COMPETITION,
    homeTeam: SAMPLE_TEAMS.newcastle,
    awayTeam: SAMPLE_TEAMS["man-utd"],
    kickoff: "2026-10-05T15:00:00Z",
  },
  {
    fixtureId: "fx-4",
    competition: COMPETITION,
    homeTeam: SAMPLE_TEAMS.chelsea,
    awayTeam: SAMPLE_TEAMS.newcastle,
    kickoff: "2026-10-05T17:30:00Z",
  },
];

interface OutcomeInput {
  outcome: string;
  bookmaker: string;
  price: number;
  pinnaclePrice: number;
  opening: number;
  current: number;
}

/** Builds one outcome's full price-comparison record from short-hand numbers, so the sample data below stays readable. */
function outcome(capturedAt: string, openingCapturedAt: string, input: OutcomeInput): OutcomePriceComparison {
  return {
    outcome: input.outcome,
    bestUk: { outcome: input.outcome, bookmaker: input.bookmaker, price: input.price, capturedAt },
    pinnaclePrice: input.pinnaclePrice,
    opening: { price: input.opening, capturedAt: openingCapturedAt },
    current: { price: input.current, capturedAt },
  };
}

const SAMPLE_PRICES: Record<string, MarketPriceComparison[]> = {
  "fx-1": [
    {
      market: "match_winner",
      marketLabel: "Match Winner",
      outcomes: [
        outcome("2026-10-03T09:00:00Z", "2026-09-27T09:00:00Z", { outcome: "Home", bookmaker: "Bet365", price: 2.05, pinnaclePrice: 2.02, opening: 1.95, current: 2.05 }),
        outcome("2026-10-03T09:00:00Z", "2026-09-27T09:00:00Z", { outcome: "Draw", bookmaker: "William Hill", price: 3.7, pinnaclePrice: 3.65, opening: 3.8, current: 3.7 }),
        outcome("2026-10-03T09:00:00Z", "2026-09-27T09:00:00Z", { outcome: "Away", bookmaker: "Betfair", price: 3.9, pinnaclePrice: 3.85, opening: 4.2, current: 3.9 }),
      ],
    },
    {
      market: "total_corners",
      marketLabel: "Total Corners",
      line: 9.5,
      outcomes: [
        outcome("2026-10-03T09:00:00Z", "2026-09-27T09:00:00Z", { outcome: "Over", bookmaker: "Bet365", price: 1.85, pinnaclePrice: 1.83, opening: 1.91, current: 1.85 }),
        outcome("2026-10-03T09:00:00Z", "2026-09-27T09:00:00Z", { outcome: "Under", bookmaker: "Sky Bet", price: 1.95, pinnaclePrice: 1.93, opening: 1.88, current: 1.95 }),
      ],
    },
    {
      market: "total_cards",
      marketLabel: "Total Cards",
      line: 4.5,
      outcomes: [
        outcome("2026-10-03T09:00:00Z", "2026-09-27T09:00:00Z", { outcome: "Over", bookmaker: "William Hill", price: 2.1, pinnaclePrice: 2.05, opening: 1.98, current: 2.1 }),
        outcome("2026-10-03T09:00:00Z", "2026-09-27T09:00:00Z", { outcome: "Under", bookmaker: "Betfair", price: 1.72, pinnaclePrice: 1.76, opening: 1.83, current: 1.72 }),
      ],
    },
  ],
  "fx-2": [
    {
      market: "match_winner",
      marketLabel: "Match Winner",
      outcomes: [
        outcome("2026-10-03T09:00:00Z", "2026-09-27T09:00:00Z", { outcome: "Home", bookmaker: "Paddy Power", price: 2.3, pinnaclePrice: 2.28, opening: 2.15, current: 2.3 }),
        outcome("2026-10-03T09:00:00Z", "2026-09-27T09:00:00Z", { outcome: "Draw", bookmaker: "Bet365", price: 3.5, pinnaclePrice: 3.6, opening: 3.5, current: 3.5 }),
        outcome("2026-10-03T09:00:00Z", "2026-09-27T09:00:00Z", { outcome: "Away", bookmaker: "Sky Bet", price: 3.2, pinnaclePrice: 3.15, opening: 3.4, current: 3.2 }),
      ],
    },
    {
      market: "total_corners",
      marketLabel: "Total Corners",
      line: 10.5,
      outcomes: [
        outcome("2026-10-03T09:00:00Z", "2026-09-27T09:00:00Z", { outcome: "Over", bookmaker: "Paddy Power", price: 1.9, pinnaclePrice: 1.87, opening: 1.95, current: 1.9 }),
        outcome("2026-10-03T09:00:00Z", "2026-09-27T09:00:00Z", { outcome: "Under", bookmaker: "Coral", price: 1.9, pinnaclePrice: 1.88, opening: 1.85, current: 1.9 }),
      ],
    },
    {
      market: "total_cards",
      marketLabel: "Total Cards",
      line: 3.5,
      outcomes: [
        outcome("2026-10-03T09:00:00Z", "2026-09-27T09:00:00Z", { outcome: "Over", bookmaker: "Bet365", price: 1.8, pinnaclePrice: 1.78, opening: 1.75, current: 1.8 }),
        outcome("2026-10-03T09:00:00Z", "2026-09-27T09:00:00Z", { outcome: "Under", bookmaker: "William Hill", price: 1.95, pinnaclePrice: 1.98, opening: 2.0, current: 1.95 }),
      ],
    },
  ],
  "fx-3": [
    {
      market: "match_winner",
      marketLabel: "Match Winner",
      outcomes: [
        outcome("2026-10-04T09:00:00Z", "2026-09-28T09:00:00Z", { outcome: "Home", bookmaker: "Ladbrokes", price: 2.75, pinnaclePrice: 2.7, opening: 2.6, current: 2.75 }),
        outcome("2026-10-04T09:00:00Z", "2026-09-28T09:00:00Z", { outcome: "Draw", bookmaker: "Coral", price: 3.4, pinnaclePrice: 3.45, opening: 3.3, current: 3.4 }),
        outcome("2026-10-04T09:00:00Z", "2026-09-28T09:00:00Z", { outcome: "Away", bookmaker: "Bet365", price: 2.7, pinnaclePrice: 2.75, opening: 2.9, current: 2.7 }),
      ],
    },
    {
      market: "total_corners",
      marketLabel: "Total Corners",
      line: 9.5,
      outcomes: [
        outcome("2026-10-04T09:00:00Z", "2026-09-28T09:00:00Z", { outcome: "Over", bookmaker: "Ladbrokes", price: 1.95, pinnaclePrice: 1.92, opening: 1.9, current: 1.95 }),
        outcome("2026-10-04T09:00:00Z", "2026-09-28T09:00:00Z", { outcome: "Under", bookmaker: "Bet365", price: 1.85, pinnaclePrice: 1.84, opening: 1.9, current: 1.85 }),
      ],
    },
    {
      market: "total_cards",
      marketLabel: "Total Cards",
      line: 5.5,
      outcomes: [
        outcome("2026-10-04T09:00:00Z", "2026-09-28T09:00:00Z", { outcome: "Over", bookmaker: "Coral", price: 1.75, pinnaclePrice: 1.73, opening: 1.8, current: 1.75 }),
        outcome("2026-10-04T09:00:00Z", "2026-09-28T09:00:00Z", { outcome: "Under", bookmaker: "Ladbrokes", price: 2.0, pinnaclePrice: 2.03, opening: 1.95, current: 2.0 }),
      ],
    },
  ],
  "fx-4": [
    {
      market: "match_winner",
      marketLabel: "Match Winner",
      outcomes: [
        outcome("2026-10-04T09:00:00Z", "2026-09-28T09:00:00Z", { outcome: "Home", bookmaker: "William Hill", price: 1.95, pinnaclePrice: 1.92, opening: 2.05, current: 1.95 }),
        outcome("2026-10-04T09:00:00Z", "2026-09-28T09:00:00Z", { outcome: "Draw", bookmaker: "Bet365", price: 3.8, pinnaclePrice: 3.75, opening: 3.7, current: 3.8 }),
        outcome("2026-10-04T09:00:00Z", "2026-09-28T09:00:00Z", { outcome: "Away", bookmaker: "Sky Bet", price: 4.3, pinnaclePrice: 4.4, opening: 4.0, current: 4.3 }),
      ],
    },
    {
      market: "total_corners",
      marketLabel: "Total Corners",
      line: 9.5,
      outcomes: [
        outcome("2026-10-04T09:00:00Z", "2026-09-28T09:00:00Z", { outcome: "Over", bookmaker: "William Hill", price: 1.8, pinnaclePrice: 1.79, opening: 1.85, current: 1.8 }),
        outcome("2026-10-04T09:00:00Z", "2026-09-28T09:00:00Z", { outcome: "Under", bookmaker: "Sky Bet", price: 2.0, pinnaclePrice: 1.98, opening: 1.93, current: 2.0 }),
      ],
    },
    {
      market: "total_cards",
      marketLabel: "Total Cards",
      line: 4.5,
      outcomes: [
        outcome("2026-10-04T09:00:00Z", "2026-09-28T09:00:00Z", { outcome: "Over", bookmaker: "Bet365", price: 1.9, pinnaclePrice: 1.88, opening: 1.84, current: 1.9 }),
        outcome("2026-10-04T09:00:00Z", "2026-09-28T09:00:00Z", { outcome: "Under", bookmaker: "William Hill", price: 1.85, pinnaclePrice: 1.87, opening: 1.92, current: 1.85 }),
      ],
    },
  ],
};

export class SampleOddsProvider implements OddsProvider {
  async getUpcomingFixtures(competition: string): Promise<FixtureSummary[]> {
    return SAMPLE_FIXTURES.filter((f) => f.competition === competition);
  }

  async getPriceComparison(fixtureId: string): Promise<PriceComparison> {
    const markets = SAMPLE_PRICES[fixtureId];
    if (!markets) {
      throw new RangeError(`No sample price data for fixture "${fixtureId}"`);
    }
    return { fixtureId, markets };
  }
}

export { SAMPLE_FIXTURES };
