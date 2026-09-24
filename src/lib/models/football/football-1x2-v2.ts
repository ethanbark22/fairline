/**
 * football_1x2_v2: starts from the bookmakers' view and lets our ratings
 * nudge it.
 *
 * 1. Market view: the bookmaker's home / draw / away prices with the margin
 *    removed (in the backtest, Pinnacle's closing prices).
 * 2. Ratings view: the v1 ratings model, except home advantage is no longer
 *    fixed. After every match it moves a little towards what is actually
 *    happening, so it follows long-term changes (such as home advantage
 *    shrinking over the years, or empty stadiums in 2020-21).
 * 3. The two views are combined, with the market given most of the weight
 *    (a weighted geometric average, rescaled so the three add up to 1).
 *
 * If no market price is available, v2 falls back to the ratings view alone
 * and says so (usedMarket: false).
 */
import {
  Football1x2V1,
  FOOTBALL_1X2_V1_PARAMS,
  type Football1x2Params,
} from "./football-1x2-v1";
import type { OutcomeProbabilities } from "./poisson";

export const FOOTBALL_1X2_V2 = "football_1x2_v2";

export interface Football1x2V2Params {
  /** Settings for the ratings part; same meaning as in v1. */
  ratings: Readonly<Football1x2Params>;
  /** Rating points home advantage moves per unit of home "surprise". 0 = fixed, as in v1. */
  homeAdvantageLearningRate: number;
  /** Share of the final answer taken from the market (0 to 1). */
  marketWeight: number;
}

/**
 * Chosen by scripts/backtest-football-1x2-v2.ts --fit using only seasons up
 * to 2017-18. The test seasons (2018-19 onwards) played no part.
 * Changing these means a new model version.
 */
export const FOOTBALL_1X2_V2_PARAMS: Readonly<Football1x2V2Params> = Object.freeze({
  ratings: FOOTBALL_1X2_V1_PARAMS,
  homeAdvantageLearningRate: 0.25,
  // The fit found that any weight on our ratings made forecasts worse than
  // Pinnacle's closing price alone, so the market gets all of it. The ratings
  // are still used when no market price exists.
  marketWeight: 1,
});

/** The v1 ratings model with a home advantage that follows recent results. */
export class TrackedHomeRatings extends Football1x2V1 {
  constructor(
    params: Readonly<Football1x2Params>,
    private readonly learningRate: number,
  ) {
    super(params);
  }

  currentHomeAdvantage(): number {
    return this.homeAdvantage;
  }

  protected override afterResult(surprise: number): void {
    this.homeAdvantage += this.learningRate * surprise;
  }
}

export interface Football1x2V2Prediction {
  modelVersion: typeof FOOTBALL_1X2_V2;
  probabilities: OutcomeProbabilities;
  ratingsProbabilities: OutcomeProbabilities;
  marketProbabilities?: OutcomeProbabilities;
  usedMarket: boolean;
  homeAdvantage: number;
}

export class Football1x2V2 {
  readonly version = FOOTBALL_1X2_V2;
  private readonly ratings: TrackedHomeRatings;

  constructor(readonly params: Readonly<Football1x2V2Params> = FOOTBALL_1X2_V2_PARAMS) {
    if (!(params.marketWeight >= 0 && params.marketWeight <= 1)) {
      throw new RangeError(`marketWeight must be between 0 and 1, got ${params.marketWeight}`);
    }
    this.ratings = new TrackedHomeRatings(params.ratings, params.homeAdvantageLearningRate);
  }

  startSeason(teams: readonly string[]): void {
    this.ratings.startSeason(teams);
  }

  /**
   * `marketProbabilities` must already have the bookmaker margin removed
   * (see removeMargin in lib/value).
   */
  predict(homeTeam: string, awayTeam: string, marketProbabilities?: OutcomeProbabilities): Football1x2V2Prediction {
    const ratingsProbabilities = this.ratings.predict(homeTeam, awayTeam).probabilities;
    return {
      modelVersion: FOOTBALL_1X2_V2,
      probabilities: marketProbabilities
        ? blend(marketProbabilities, ratingsProbabilities, this.params.marketWeight)
        : ratingsProbabilities,
      ratingsProbabilities,
      marketProbabilities,
      usedMarket: marketProbabilities !== undefined,
      homeAdvantage: this.ratings.currentHomeAdvantage(),
    };
  }

  recordResult(result: Parameters<Football1x2V1["recordResult"]>[0]): void {
    this.ratings.recordResult(result);
  }
}

/** Weighted geometric average of two forecasts, rescaled to add up to 1. */
export function blend(
  market: OutcomeProbabilities,
  ratings: OutcomeProbabilities,
  marketWeight: number,
): OutcomeProbabilities {
  const w = marketWeight;
  const home = market.home ** w * ratings.home ** (1 - w);
  const draw = market.draw ** w * ratings.draw ** (1 - w);
  const away = market.away ** w * ratings.away ** (1 - w);
  const total = home + draw + away;
  return { home: home / total, draw: draw / total, away: away / total };
}
