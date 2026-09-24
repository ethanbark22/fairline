import { describe, expect, it } from "vitest";
import { simulateValueBets } from "./value-bets";

describe("simulateValueBets", () => {
  const forecast = {
    probabilities: { home: 0.5, draw: 0.3, away: 0.2 },
    // Home at 2.20 beats the minimum 1 / (0.5 - 0.02) = 2.083; draw and away do not.
    prices: { home: 2.2, draw: 3.2, away: 4.5 },
  };

  it("bets only where the price beats the minimum price", () => {
    const won = simulateValueBets([{ ...forecast, outcome: "home" }], 0.02);
    expect(won).toEqual({ bets: 1, wins: 1, profit: expect.closeTo(1.2, 12), roi: expect.closeTo(1.2, 12) });
  });

  it("counts a losing bet as -£1", () => {
    const lost = simulateValueBets([{ ...forecast, outcome: "away" }], 0.02);
    expect(lost).toEqual({ bets: 1, wins: 0, profit: -1, roi: -1 });
  });

  it("places nothing when the required edge is too high", () => {
    expect(simulateValueBets([{ ...forecast, outcome: "home" }], 0.1).bets).toBe(0);
  });

  it("skips outcomes rated less likely than the required edge", () => {
    const tiny = { probabilities: { home: 0.97, draw: 0.02, away: 0.01 }, prices: { home: 1.05, draw: 60, away: 90 } };
    expect(() => simulateValueBets([{ ...tiny, outcome: "home" }], 0.02)).not.toThrow();
  });
});
