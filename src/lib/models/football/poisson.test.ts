import { describe, expect, it } from "vitest";
import { outcomeProbabilities } from "./poisson";

describe("outcomeProbabilities", () => {
  it("adds up to 1", () => {
    const p = outcomeProbabilities(1.7, 1.1);
    expect(p.home + p.draw + p.away).toBeCloseTo(1, 12);
  });

  it("is symmetric when both sides expect the same goals", () => {
    const p = outcomeProbabilities(1.3, 1.3);
    expect(p.home).toBeCloseTo(p.away, 12);
  });

  it("matches the textbook draw chance for 1 v 1 expected goals", () => {
    // P(draw) = e^-2 * sum 1/(k!)^2 = 0.308508...
    expect(outcomeProbabilities(1, 1).draw).toBeCloseTo(0.308508, 5);
  });

  it("gives the side expecting more goals a higher chance of winning", () => {
    const p = outcomeProbabilities(2.2, 0.8);
    expect(p.home).toBeGreaterThan(p.away);
    expect(p.home).toBeGreaterThan(0.6);
  });

  it("rejects impossible expected goals", () => {
    expect(() => outcomeProbabilities(0, 1)).toThrow(RangeError);
    expect(() => outcomeProbabilities(1, NaN)).toThrow(RangeError);
  });
});
