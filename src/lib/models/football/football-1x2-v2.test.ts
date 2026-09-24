import { describe, expect, it } from "vitest";
import { Football1x2V1, FOOTBALL_1X2_V1_PARAMS } from "./football-1x2-v1";
import { blend, Football1x2V2, FOOTBALL_1X2_V2, FOOTBALL_1X2_V2_PARAMS, TrackedHomeRatings } from "./football-1x2-v2";

const MARKET = { home: 0.5, draw: 0.3, away: 0.2 };
const RATINGS = { home: 0.3, draw: 0.3, away: 0.4 };
const TEAMS = ["A", "B", "C", "D"];

describe("blend", () => {
  it("returns the market alone at weight 1 and the ratings alone at weight 0", () => {
    const m = blend(MARKET, RATINGS, 1);
    const r = blend(MARKET, RATINGS, 0);
    for (const o of ["home", "draw", "away"] as const) {
      expect(m[o]).toBeCloseTo(MARKET[o], 12);
      expect(r[o]).toBeCloseTo(RATINGS[o], 12);
    }
  });

  it("lands between the two and adds up to 1", () => {
    const p = blend(MARKET, RATINGS, 0.5);
    expect(p.home + p.draw + p.away).toBeCloseTo(1, 12);
    expect(p.home).toBeLessThan(MARKET.home);
    expect(p.home).toBeGreaterThan(RATINGS.home);
  });
});

describe("TrackedHomeRatings", () => {
  it("with a learning rate of 0 behaves exactly like v1", () => {
    const v1 = new Football1x2V1();
    const tracked = new TrackedHomeRatings(FOOTBALL_1X2_V1_PARAMS, 0);
    for (const m of [v1, tracked]) {
      m.startSeason(TEAMS);
      m.recordResult({ homeTeam: "A", awayTeam: "B", homeGoals: 0, awayGoals: 2 });
      m.recordResult({ homeTeam: "C", awayTeam: "D", homeGoals: 1, awayGoals: 1 });
    }
    expect(tracked.predict("B", "C")).toEqual(v1.predict("B", "C"));
    expect(tracked.currentHomeAdvantage()).toBe(FOOTBALL_1X2_V1_PARAMS.homeAdvantage);
  });

  it("lowers home advantage when home sides keep doing worse than expected", () => {
    const tracked = new TrackedHomeRatings(FOOTBALL_1X2_V1_PARAMS, 1);
    tracked.startSeason(TEAMS);
    for (let i = 0; i < 10; i++) tracked.recordResult({ homeTeam: "A", awayTeam: "B", homeGoals: 0, awayGoals: 1 });
    expect(tracked.currentHomeAdvantage()).toBeLessThan(FOOTBALL_1X2_V1_PARAMS.homeAdvantage);
  });

  it("raises home advantage when home sides keep doing better than expected", () => {
    const tracked = new TrackedHomeRatings(FOOTBALL_1X2_V1_PARAMS, 1);
    tracked.startSeason(TEAMS);
    for (let i = 0; i < 10; i++) tracked.recordResult({ homeTeam: "C", awayTeam: "D", homeGoals: 2, awayGoals: 0 });
    expect(tracked.currentHomeAdvantage()).toBeGreaterThan(FOOTBALL_1X2_V1_PARAMS.homeAdvantage);
  });
});

describe("football_1x2_v2", () => {
  function model(marketWeight = 0.7) {
    const m = new Football1x2V2({ ...FOOTBALL_1X2_V2_PARAMS, marketWeight });
    m.startSeason(TEAMS);
    return m;
  }

  it("reports its version and that it used the market", () => {
    const p = model().predict("A", "B", MARKET);
    expect(p.modelVersion).toBe(FOOTBALL_1X2_V2);
    expect(p.usedMarket).toBe(true);
    expect(p.probabilities.home + p.probabilities.draw + p.probabilities.away).toBeCloseTo(1, 12);
  });

  it("starts from the market and is pulled towards the ratings", () => {
    const p = model(0.7).predict("A", "B", MARKET);
    expect(p.probabilities).toEqual(blend(MARKET, p.ratingsProbabilities, 0.7));
  });

  it("falls back to the ratings, and says so, when there is no market price", () => {
    const p = model().predict("A", "B");
    expect(p.usedMarket).toBe(false);
    expect(p.probabilities).toEqual(p.ratingsProbabilities);
  });

  it("with the fitted settings, returns the market's probabilities", () => {
    const m = new Football1x2V2();
    m.startSeason(TEAMS);
    const p = m.predict("A", "B", MARKET).probabilities;
    expect(p.home).toBeCloseTo(MARKET.home, 12);
    expect(p.away).toBeCloseTo(MARKET.away, 12);
  });

  it("rejects a market weight outside 0 to 1", () => {
    expect(() => new Football1x2V2({ ...FOOTBALL_1X2_V2_PARAMS, marketWeight: 1.5 })).toThrow(RangeError);
  });

  it("has frozen settings", () => {
    expect(Object.isFrozen(FOOTBALL_1X2_V2_PARAMS)).toBe(true);
  });
});
