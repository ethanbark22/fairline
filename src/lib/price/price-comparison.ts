/**
 * Price-comparison maths: turning Pinnacle's prices into a fair-price
 * reference, and describing how a price has moved.
 *
 * All prices are decimal odds (e.g. 2.50 means a £1 stake returns £2.50
 * in total if it wins). These functions are the single source of truth;
 * Claude never calculates them, it only narrates them.
 */

import { removeMargin } from "@/lib/value/value";

export interface FairPrice {
  /** Pinnacle's implied probability with its margin removed. */
  probability: number;
  /** 1 / probability, i.e. the break-even decimal price at that probability. */
  price: number;
}

/**
 * Turns a full set of Pinnacle decimal prices (one per outcome, same market,
 * same moment) into fair, margin-removed probabilities and prices, in the
 * same order as the input.
 */
export function pinnacleFairPrices(pinnaclePrices: readonly number[]): FairPrice[] {
  const probabilities = removeMargin(pinnaclePrices);
  return probabilities.map((probability) => ({
    probability,
    price: 1 / probability,
  }));
}

export type PriceDirection = "up" | "down" | "unchanged";

export interface PriceMovementSummary {
  direction: PriceDirection;
  /** currentPrice - openingPrice, in decimal price points. */
  changeAbsolute: number;
  /** changeAbsolute relative to openingPrice, e.g. 0.05 means the price rose 5%. */
  changePct: number;
}

/**
 * Describes how a single outcome's best price has moved between two
 * captures. A rising decimal price means the market thinks the outcome has
 * become less likely since the opening capture, and vice versa.
 */
export function summarisePriceMovement(
  openingPrice: number,
  currentPrice: number,
): PriceMovementSummary {
  if (!Number.isFinite(openingPrice) || openingPrice <= 1) {
    throw new RangeError(`openingPrice must be a finite number above 1, got ${openingPrice}`);
  }
  if (!Number.isFinite(currentPrice) || currentPrice <= 1) {
    throw new RangeError(`currentPrice must be a finite number above 1, got ${currentPrice}`);
  }
  const changeAbsolute = currentPrice - openingPrice;
  const changePct = changeAbsolute / openingPrice;
  const direction: PriceDirection = changeAbsolute > 0 ? "up" : changeAbsolute < 0 ? "down" : "unchanged";
  return { direction, changeAbsolute, changePct };
}
