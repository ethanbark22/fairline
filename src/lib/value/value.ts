/**
 * Value maths: the numbers that decide whether a price is worth taking.
 *
 * All prices are decimal odds (e.g. 2.50 means a £1 stake returns £2.50
 * in total if it wins). All probabilities are between 0 and 1.
 *
 * These functions are the single source of truth for these numbers.
 * Claude never calculates them; it only explains them.
 */

/** Throws if `price` is not a usable decimal price (a finite number above 1). */
export function assertValidPrice(price: number): void {
  if (!Number.isFinite(price) || price <= 1) {
    throw new RangeError(`Decimal price must be a finite number above 1, got ${price}`);
  }
}

/** Throws if `probability` is not strictly between 0 and 1. */
export function assertValidProbability(probability: number): void {
  if (!Number.isFinite(probability) || probability <= 0 || probability >= 1) {
    throw new RangeError(`Probability must be between 0 and 1 (exclusive), got ${probability}`);
  }
}

/**
 * Raw implied probability of a single price: 1 / price.
 * This still includes the bookmaker's margin, so for a full market the
 * implied probabilities add up to more than 1.
 */
export function impliedProbability(price: number): number {
  assertValidPrice(price);
  return 1 / price;
}

/**
 * The bookmaker's margin (also called overround) for one complete market,
 * e.g. the home, draw and away prices from a single bookmaker.
 * Returns 0.05 for a 5% margin.
 */
export function bookmakerMargin(prices: readonly number[]): number {
  assertCompleteMarket(prices);
  const total = prices.reduce((sum, price) => sum + impliedProbability(price), 0);
  return total - 1;
}

/**
 * Market probability: the implied probabilities of one complete market with
 * the bookmaker's margin removed, so they add up to exactly 1.
 *
 * Method: proportional (also called multiplicative or basic normalisation).
 * Each raw implied probability is divided by their total. It is simple and
 * transparent; it slightly overstates longshots compared with other methods.
 *
 * `prices` must be every outcome of the market from the same bookmaker at the
 * same moment. Results are returned in the same order as the prices.
 */
export function removeMargin(prices: readonly number[]): number[] {
  assertCompleteMarket(prices);
  const raw = prices.map(impliedProbability);
  const total = raw.reduce((sum, p) => sum + p, 0);
  return raw.map((p) => p / total);
}

/**
 * Edge: model probability minus market probability.
 * 0.037 means our model rates the selection 3.7 percentage points more
 * likely than the market does. Negative means the market rates it higher.
 */
export function edge(modelProbability: number, marketProbability: number): number {
  assertValidProbability(modelProbability);
  assertValidProbability(marketProbability);
  return modelProbability - marketProbability;
}

/**
 * Minimum price: the lowest decimal price at which the selection still
 * qualifies as value, given the model probability.
 *
 * With `requiredEdge` of 0 this is the break-even ("fair") price, 1 / p:
 * any price above it has positive expected value if the model is right.
 * A `requiredEdge` of 0.02 asks for a 2 percentage point cushion, giving
 * 1 / (p - 0.02).
 *
 * Returned unrounded. When showing it, round UP so we never display a
 * minimum that is lower than the true one.
 */
export function minimumPrice(modelProbability: number, requiredEdge = 0): number {
  assertValidProbability(modelProbability);
  if (!Number.isFinite(requiredEdge) || requiredEdge < 0) {
    throw new RangeError(`Required edge must be zero or more, got ${requiredEdge}`);
  }
  const target = modelProbability - requiredEdge;
  if (target <= 0) {
    throw new RangeError(
      `Required edge ${requiredEdge} is too large for model probability ${modelProbability}`,
    );
  }
  return 1 / target;
}

/** True when `price` is at or above the minimum price. */
export function priceQualifies(price: number, minimum: number): boolean {
  assertValidPrice(price);
  assertValidPrice(minimum);
  return price >= minimum;
}

function assertCompleteMarket(prices: readonly number[]): void {
  if (prices.length < 2) {
    throw new RangeError(`A market needs at least 2 outcomes, got ${prices.length}`);
  }
  prices.forEach(assertValidPrice);
}
