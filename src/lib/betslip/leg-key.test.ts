import { describe, expect, it } from "vitest";
import { encodeLegsParam, parseLegsParam } from "./leg-key";
import type { BetslipSelection } from "./types";

function selection(overrides: Partial<BetslipSelection>): BetslipSelection {
  return {
    fixtureId: "fx-1",
    competition: "Premier League",
    homeTeam: "Arsenal",
    awayTeam: "Chelsea",
    kickoff: "2026-10-04T14:00:00Z",
    market: "match_winner",
    marketLabel: "Match Winner",
    outcome: "Home",
    price: 2.05,
    bookmaker: "Bet365",
    ...overrides,
  };
}

describe("encodeLegsParam / parseLegsParam", () => {
  it("round-trips a single leg", () => {
    const encoded = encodeLegsParam([selection({})]);
    expect(parseLegsParam(encoded)).toEqual([{ fixtureId: "fx-1", market: "match_winner", outcome: "Home" }]);
  });

  it("round-trips several legs, preserving order", () => {
    const legs = [
      selection({ fixtureId: "fx-1", market: "match_winner", outcome: "Home" }),
      selection({ fixtureId: "fx-1", market: "total_corners", outcome: "Over" }),
      selection({ fixtureId: "fx-4", market: "total_cards", outcome: "Under" }),
    ];
    expect(parseLegsParam(encodeLegsParam(legs))).toEqual([
      { fixtureId: "fx-1", market: "match_winner", outcome: "Home" },
      { fixtureId: "fx-1", market: "total_corners", outcome: "Over" },
      { fixtureId: "fx-4", market: "total_cards", outcome: "Under" },
    ]);
  });

  it("returns an empty array for empty, missing or null input", () => {
    expect(parseLegsParam("")).toEqual([]);
    expect(parseLegsParam(undefined)).toEqual([]);
    expect(parseLegsParam(null)).toEqual([]);
  });

  it("skips malformed segments instead of throwing", () => {
    expect(parseLegsParam("fx-1:match_winner:Home|garbage|fx-2::")).toEqual([
      { fixtureId: "fx-1", market: "match_winner", outcome: "Home" },
    ]);
  });
});
