import { describe, expect, it } from "vitest";
import { checkCorrelation, combinedPrice } from "./combine";
import type { BetslipSelection } from "./types";

function selection(overrides: Partial<BetslipSelection>): BetslipSelection {
  return {
    fixtureId: "fx-1",
    competition: "Premier League",
    homeTeam: "Arsenal",
    awayTeam: "Chelsea",
    kickoff: "2026-10-04T14:00:00Z",
    outcome: "Home",
    price: 2.0,
    bookmaker: "Bet365",
    ...overrides,
  };
}

describe("combinedPrice", () => {
  it("multiplies a single price unchanged", () => {
    expect(combinedPrice([2.5])).toBeCloseTo(2.5, 10);
  });

  it("multiplies several prices together", () => {
    expect(combinedPrice([2, 3, 1.5])).toBeCloseTo(9, 10);
  });

  it("rejects an empty slip", () => {
    expect(() => combinedPrice([])).toThrow(RangeError);
  });

  it("rejects a price at or below 1", () => {
    expect(() => combinedPrice([2, 1])).toThrow(RangeError);
  });
});

describe("checkCorrelation", () => {
  it("reports no correlation for legs from unrelated fixtures", () => {
    const result = checkCorrelation([
      selection({ fixtureId: "fx-1", homeTeam: "Arsenal", awayTeam: "Chelsea" }),
      selection({ fixtureId: "fx-2", homeTeam: "Liverpool", awayTeam: "Manchester City" }),
    ]);
    expect(result.correlated).toBe(false);
    expect(result.sharedTeams).toEqual([]);
    expect(result.sharedFixtures).toEqual([]);
  });

  it("flags legs that share a team across different fixtures", () => {
    const result = checkCorrelation([
      selection({ fixtureId: "fx-1", homeTeam: "Arsenal", awayTeam: "Chelsea", outcome: "Away" }),
      selection({ fixtureId: "fx-4", homeTeam: "Chelsea", awayTeam: "Newcastle United", outcome: "Home" }),
    ]);
    expect(result.correlated).toBe(true);
    expect(result.sharedTeams).toEqual(["Chelsea"]);
    expect(result.sharedFixtures).toEqual([]);
  });

  it("flags the same fixture appearing twice", () => {
    const result = checkCorrelation([
      selection({ fixtureId: "fx-1", outcome: "Home" }),
      selection({ fixtureId: "fx-1", outcome: "Draw" }),
    ]);
    expect(result.correlated).toBe(true);
    expect(result.sharedFixtures).toEqual(["fx-1"]);
  });

  it("treats a single leg as uncorrelated", () => {
    const result = checkCorrelation([selection({})]);
    expect(result.correlated).toBe(false);
  });

  it("treats an empty slip as uncorrelated", () => {
    expect(checkCorrelation([]).correlated).toBe(false);
  });
});
