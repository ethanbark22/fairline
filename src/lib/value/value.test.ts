import { describe, expect, it } from "vitest";
import {
  bookmakerMargin,
  edge,
  impliedProbability,
  minimumPrice,
  priceQualifies,
  removeMargin,
} from "./value";

// Worked example used across tests: a made-up home / draw / away market.
const HOME_DRAW_AWAY = [2.1, 3.4, 3.6];

describe("impliedProbability", () => {
  it("is 1 / price", () => {
    expect(impliedProbability(2)).toBe(0.5);
    expect(impliedProbability(4)).toBe(0.25);
    expect(impliedProbability(2.1)).toBeCloseTo(0.476190, 6);
  });

  it("rejects prices that are not above 1", () => {
    for (const bad of [1, 0.5, 0, -2, NaN, Infinity]) {
      expect(() => impliedProbability(bad)).toThrow(RangeError);
    }
  });
});

describe("bookmakerMargin", () => {
  it("is zero for a fair market", () => {
    expect(bookmakerMargin([2, 2])).toBeCloseTo(0, 12);
    expect(bookmakerMargin([3, 3, 3])).toBeCloseTo(0, 12);
  });

  it("measures the overround of a real-looking 1X2 market", () => {
    expect(bookmakerMargin(HOME_DRAW_AWAY)).toBeCloseTo(0.048086, 6);
  });

  it("needs a complete market", () => {
    expect(() => bookmakerMargin([2])).toThrow(RangeError);
    expect(() => bookmakerMargin([])).toThrow(RangeError);
    expect(() => bookmakerMargin([2, 1])).toThrow(RangeError);
  });
});

describe("removeMargin", () => {
  it("returns probabilities that add up to exactly 1, in the same order", () => {
    const probs = removeMargin(HOME_DRAW_AWAY);
    expect(probs).toHaveLength(3);
    expect(probs.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 12);
    expect(probs[0]).toBeCloseTo(0.454343, 6);
    expect(probs[1]).toBeCloseTo(0.280624, 6);
    expect(probs[2]).toBeCloseTo(0.265033, 6);
  });

  it("gives each market probability lower than its raw implied probability", () => {
    const probs = removeMargin(HOME_DRAW_AWAY);
    HOME_DRAW_AWAY.forEach((price, i) => {
      expect(probs[i]).toBeLessThan(impliedProbability(price));
    });
  });

  it("leaves a fair market unchanged", () => {
    const probs = removeMargin([2, 4, 4]);
    expect(probs[0]).toBeCloseTo(0.5, 12);
    expect(probs[1]).toBeCloseTo(0.25, 12);
    expect(probs[2]).toBeCloseTo(0.25, 12);
  });

  it("rejects incomplete or invalid markets", () => {
    expect(() => removeMargin([2.1])).toThrow(RangeError);
    expect(() => removeMargin([2.1, NaN, 3.6])).toThrow(RangeError);
  });
});

describe("edge", () => {
  it("is model probability minus market probability (brief example)", () => {
    expect(edge(0.618, 0.581)).toBeCloseTo(0.037, 12);
  });

  it("is negative when the market rates the selection higher", () => {
    expect(edge(0.4, 0.45)).toBeCloseTo(-0.05, 12);
  });

  it("works with a margin-removed market probability", () => {
    const [home] = removeMargin(HOME_DRAW_AWAY);
    expect(edge(0.5, home)).toBeCloseTo(0.045657, 6);
  });

  it("rejects probabilities outside 0 to 1", () => {
    expect(() => edge(1.2, 0.5)).toThrow(RangeError);
    expect(() => edge(0.5, 0)).toThrow(RangeError);
    expect(() => edge(NaN, 0.5)).toThrow(RangeError);
  });
});

describe("minimumPrice", () => {
  it("is the break-even price 1 / p with no required edge", () => {
    expect(minimumPrice(0.5)).toBe(2);
    expect(minimumPrice(0.618)).toBeCloseTo(1.618123, 6);
  });

  it("asks for a higher price when a cushion of edge is required", () => {
    expect(minimumPrice(0.618, 0.02)).toBeCloseTo(1.672241, 6);
    expect(minimumPrice(0.618, 0.02)).toBeGreaterThan(minimumPrice(0.618));
  });

  it("at the minimum price, expected profit per £1 is exactly zero", () => {
    const p = 0.37;
    const price = minimumPrice(p);
    const expectedProfit = p * (price - 1) - (1 - p);
    expect(expectedProfit).toBeCloseTo(0, 12);
  });

  it("rejects bad inputs", () => {
    expect(() => minimumPrice(0)).toThrow(RangeError);
    expect(() => minimumPrice(1)).toThrow(RangeError);
    expect(() => minimumPrice(0.5, -0.01)).toThrow(RangeError);
    expect(() => minimumPrice(0.05, 0.05)).toThrow(RangeError);
  });
});

describe("priceQualifies", () => {
  it("passes at or above the minimum and fails below it", () => {
    const min = minimumPrice(0.618, 0.02); // about 1.672
    expect(priceQualifies(1.72, min)).toBe(true);
    expect(priceQualifies(min, min)).toBe(true);
    expect(priceQualifies(1.65, min)).toBe(false);
  });
});
