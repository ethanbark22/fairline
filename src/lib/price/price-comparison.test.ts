import { describe, expect, it } from "vitest";
import { pinnacleFairPrices, summarisePriceMovement } from "./price-comparison";

describe("pinnacleFairPrices", () => {
  it("removes the margin and returns matching probability + price pairs", () => {
    // Pinnacle prices with a small margin baked in.
    const result = pinnacleFairPrices([2.0, 3.5, 4.0]);
    expect(result).toHaveLength(3);
    const totalProbability = result.reduce((sum, r) => sum + r.probability, 0);
    expect(totalProbability).toBeCloseTo(1, 10);
    result.forEach((r) => {
      expect(r.price).toBeCloseTo(1 / r.probability, 10);
      expect(r.price).toBeGreaterThan(1);
    });
  });

  it("returns results in the same order as the input", () => {
    const result = pinnacleFairPrices([1.5, 10, 8]);
    // Shortest price (most likely outcome) has the smallest fair price.
    expect(result[0].price).toBeLessThan(result[1].price);
    expect(result[0].price).toBeLessThan(result[2].price);
  });
});

describe("summarisePriceMovement", () => {
  it("reports 'up' when the price has risen", () => {
    const movement = summarisePriceMovement(2.0, 2.2);
    expect(movement.direction).toBe("up");
    expect(movement.changeAbsolute).toBeCloseTo(0.2, 10);
    expect(movement.changePct).toBeCloseTo(0.1, 10);
  });

  it("reports 'down' when the price has fallen", () => {
    const movement = summarisePriceMovement(3.0, 2.7);
    expect(movement.direction).toBe("down");
    expect(movement.changeAbsolute).toBeCloseTo(-0.3, 10);
    expect(movement.changePct).toBeCloseTo(-0.1, 10);
  });

  it("reports 'unchanged' when the price is the same", () => {
    const movement = summarisePriceMovement(2.5, 2.5);
    expect(movement.direction).toBe("unchanged");
    expect(movement.changeAbsolute).toBe(0);
    expect(movement.changePct).toBe(0);
  });

  it("rejects prices at or below 1", () => {
    expect(() => summarisePriceMovement(1, 2)).toThrow(RangeError);
    expect(() => summarisePriceMovement(2, 0.5)).toThrow(RangeError);
  });
});
