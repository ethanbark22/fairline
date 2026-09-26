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
import type { FixtureSummary, OddsProvider, OutcomePriceComparison, PriceComparison } from "./types";

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
];

// outcome -> { bestUk bookmaker/price, raw Pinnacle price, opening/current best-UK price }
const SAMPLE_PRICES: Record<string, OutcomePriceComparison[]> = {
  "fx-1": [
    {
      outcome: "Home",
      bestUk: { outcome: "Home", bookmaker: "Bet365", price: 2.05, capturedAt: "2026-10-03T09:00:00Z" },
      pinnaclePrice: 2.02,
      opening: { price: 1.95, capturedAt: "2026-09-27T09:00:00Z" },
      current: { price: 2.05, capturedAt: "2026-10-03T09:00:00Z" },
    },
    {
      outcome: "Draw",
      bestUk: { outcome: "Draw", bookmaker: "William Hill", price: 3.7, capturedAt: "2026-10-03T09:00:00Z" },
      pinnaclePrice: 3.65,
      opening: { price: 3.8, capturedAt: "2026-09-27T09:00:00Z" },
      current: { price: 3.7, capturedAt: "2026-10-03T09:00:00Z" },
    },
    {
      outcome: "Away",
      bestUk: { outcome: "Away", bookmaker: "Betfair", price: 3.9, capturedAt: "2026-10-03T09:00:00Z" },
      pinnaclePrice: 3.85,
      opening: { price: 4.2, capturedAt: "2026-09-27T09:00:00Z" },
      current: { price: 3.9, capturedAt: "2026-10-03T09:00:00Z" },
    },
  ],
  "fx-2": [
    {
      outcome: "Home",
      bestUk: { outcome: "Home", bookmaker: "Paddy Power", price: 2.3, capturedAt: "2026-10-03T09:00:00Z" },
      pinnaclePrice: 2.28,
      opening: { price: 2.15, capturedAt: "2026-09-27T09:00:00Z" },
      current: { price: 2.3, capturedAt: "2026-10-03T09:00:00Z" },
    },
    {
      outcome: "Draw",
      bestUk: { outcome: "Draw", bookmaker: "Bet365", price: 3.5, capturedAt: "2026-10-03T09:00:00Z" },
      pinnaclePrice: 3.6,
      opening: { price: 3.5, capturedAt: "2026-09-27T09:00:00Z" },
      current: { price: 3.5, capturedAt: "2026-10-03T09:00:00Z" },
    },
    {
      outcome: "Away",
      bestUk: { outcome: "Away", bookmaker: "Sky Bet", price: 3.2, capturedAt: "2026-10-03T09:00:00Z" },
      pinnaclePrice: 3.15,
      opening: { price: 3.4, capturedAt: "2026-09-27T09:00:00Z" },
      current: { price: 3.2, capturedAt: "2026-10-03T09:00:00Z" },
    },
  ],
  "fx-3": [
    {
      outcome: "Home",
      bestUk: { outcome: "Home", bookmaker: "Ladbrokes", price: 2.75, capturedAt: "2026-10-04T09:00:00Z" },
      pinnaclePrice: 2.7,
      opening: { price: 2.6, capturedAt: "2026-09-28T09:00:00Z" },
      current: { price: 2.75, capturedAt: "2026-10-04T09:00:00Z" },
    },
    {
      outcome: "Draw",
      bestUk: { outcome: "Draw", bookmaker: "Coral", price: 3.4, capturedAt: "2026-10-04T09:00:00Z" },
      pinnaclePrice: 3.45,
      opening: { price: 3.3, capturedAt: "2026-09-28T09:00:00Z" },
      current: { price: 3.4, capturedAt: "2026-10-04T09:00:00Z" },
    },
    {
      outcome: "Away",
      bestUk: { outcome: "Away", bookmaker: "Bet365", price: 2.7, capturedAt: "2026-10-04T09:00:00Z" },
      pinnaclePrice: 2.75,
      opening: { price: 2.9, capturedAt: "2026-09-28T09:00:00Z" },
      current: { price: 2.7, capturedAt: "2026-10-04T09:00:00Z" },
    },
  ],
};

export class SampleOddsProvider implements OddsProvider {
  async getUpcomingFixtures(competition: string): Promise<FixtureSummary[]> {
    return SAMPLE_FIXTURES.filter((f) => f.competition === competition);
  }

  async getPriceComparison(fixtureId: string): Promise<PriceComparison> {
    const outcomes = SAMPLE_PRICES[fixtureId];
    if (!outcomes) {
      throw new RangeError(`No sample price data for fixture "${fixtureId}"`);
    }
    return { fixtureId, outcomes };
  }
}

export { SAMPLE_FIXTURES };
