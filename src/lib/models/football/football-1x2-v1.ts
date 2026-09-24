/**
 * football_1x2_v1: a transparent ratings model for football match results
 * (home / draw / away).
 *
 * 1. Every team has an Elo rating (a single strength number; 1500 is average).
 *    After each match, the winner takes rating points from the loser. Bigger
 *    surprises and bigger winning margins move ratings more.
 * 2. The rating gap, plus a home advantage, becomes an expected goal
 *    difference ("supremacy"). Together with the league's recent average
 *    goals per game, that gives expected goals for each side.
 * 3. The Poisson goals model turns expected goals into home / draw / away
 *    probabilities.
 *
 * The model only ever sees results you have given it through recordResult,
 * so it cannot use information from after the match it is predicting.
 */
import { outcomeProbabilities, type OutcomeProbabilities } from "./poisson";

export const FOOTBALL_1X2_V1 = "football_1x2_v1";

export interface Football1x2Params {
  /** How far ratings move after a match. */
  kFactor: number;
  /** Home advantage, in rating points. */
  homeAdvantage: number;
  /** Expected goal difference for every 100 rating points of gap. */
  supremacyPer100: number;
  /** How far below average a newly promoted team starts, in rating points. */
  promotedGap: number;
  /** Share of each team's distance from average kept into a new season (0 to 1). */
  seasonCarryOver: number;
}

/**
 * Chosen by scripts/backtest-football-1x2.ts --fit using only seasons
 * 2000-01 to 2011-12. The test seasons (2012-13 onwards) played no part.
 * Changing these means a new model version.
 */
export const FOOTBALL_1X2_V1_PARAMS: Readonly<Football1x2Params> = Object.freeze({
  kFactor: 15,
  homeAdvantage: 100,
  supremacyPer100: 0.5,
  promotedGap: 100,
  seasonCarryOver: 0.9,
});

export interface MatchResult {
  homeTeam: string;
  awayTeam: string;
  homeGoals: number;
  awayGoals: number;
}

export interface Football1x2Prediction {
  modelVersion: typeof FOOTBALL_1X2_V1;
  probabilities: OutcomeProbabilities;
  expectedGoals: { home: number; away: number };
  ratings: { home: number; away: number };
}

const AVERAGE_RATING = 1500;
/** Matches used for the league's recent average goals (about two seasons). */
const GOALS_WINDOW = 760;
/** Used until the model has seen any results. */
const DEFAULT_GOALS_PER_GAME = 2.6;
/** Expected goals never go below this, so heavy mismatches stay sensible. */
const MIN_EXPECTED_GOALS = 0.15;

export class Football1x2V1 {
  readonly version = FOOTBALL_1X2_V1;
  private ratings = new Map<string, number>();
  private recentGoals: number[] = [];

  constructor(readonly params: Readonly<Football1x2Params> = FOOTBALL_1X2_V1_PARAMS) {}

  /**
   * Call before each season with that season's teams (known in advance from
   * the fixture list). Returning teams keep part of their rating; new or
   * promoted teams start below average; then ratings are re-centred on 1500.
   */
  startSeason(teams: readonly string[]): void {
    const next = new Map<string, number>();
    for (const team of teams) {
      const previous = this.ratings.get(team);
      next.set(
        team,
        previous === undefined
          ? AVERAGE_RATING - this.params.promotedGap
          : AVERAGE_RATING + this.params.seasonCarryOver * (previous - AVERAGE_RATING),
      );
    }
    const mean = [...next.values()].reduce((a, b) => a + b, 0) / next.size;
    for (const [team, rating] of next) next.set(team, rating - mean + AVERAGE_RATING);
    this.ratings = next;
  }

  rating(team: string): number {
    const r = this.ratings.get(team);
    if (r === undefined) throw new Error(`Unknown team "${team}": call startSeason first`);
    return r;
  }

  predict(homeTeam: string, awayTeam: string): Football1x2Prediction {
    const home = this.rating(homeTeam);
    const away = this.rating(awayTeam);
    const gap = home + this.params.homeAdvantage - away;
    const supremacy = (this.params.supremacyPer100 * gap) / 100;
    const totalGoals = this.averageGoals();
    const homeGoals = Math.max(MIN_EXPECTED_GOALS, (totalGoals + supremacy) / 2);
    const awayGoals = Math.max(MIN_EXPECTED_GOALS, (totalGoals - supremacy) / 2);
    return {
      modelVersion: FOOTBALL_1X2_V1,
      probabilities: outcomeProbabilities(homeGoals, awayGoals),
      expectedGoals: { home: homeGoals, away: awayGoals },
      ratings: { home, away },
    };
  }

  recordResult(result: MatchResult): void {
    const home = this.rating(result.homeTeam);
    const away = this.rating(result.awayTeam);
    const expectedHome = 1 / (1 + 10 ** (-(home + this.params.homeAdvantage - away) / 400));
    const actualHome =
      result.homeGoals > result.awayGoals ? 1 : result.homeGoals === result.awayGoals ? 0.5 : 0;
    const change =
      this.params.kFactor * marginMultiplier(result.homeGoals - result.awayGoals) * (actualHome - expectedHome);
    this.ratings.set(result.homeTeam, home + change);
    this.ratings.set(result.awayTeam, away - change);

    this.recentGoals.push(result.homeGoals + result.awayGoals);
    if (this.recentGoals.length > GOALS_WINDOW) this.recentGoals.shift();
  }

  private averageGoals(): number {
    if (this.recentGoals.length === 0) return DEFAULT_GOALS_PER_GAME;
    return this.recentGoals.reduce((a, b) => a + b, 0) / this.recentGoals.length;
  }
}

/** Bigger wins move ratings more (the World Football Elo convention). */
function marginMultiplier(goalDifference: number): number {
  const margin = Math.abs(goalDifference);
  if (margin <= 1) return 1;
  if (margin === 2) return 1.5;
  return (11 + margin) / 8;
}
