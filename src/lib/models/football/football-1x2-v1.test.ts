import { describe, expect, it } from "vitest";
import { Football1x2V1, FOOTBALL_1X2_V1, FOOTBALL_1X2_V1_PARAMS } from "./football-1x2-v1";

function newModel(teams = ["A", "B", "C", "D"]) {
  const model = new Football1x2V1();
  model.startSeason(teams);
  return model;
}

describe("football_1x2_v1", () => {
  it("reports its version", () => {
    expect(newModel().predict("A", "B").modelVersion).toBe(FOOTBALL_1X2_V1);
  });

  it("gives probabilities that add up to 1", () => {
    const p = newModel().predict("A", "B").probabilities;
    expect(p.home + p.draw + p.away).toBeCloseTo(1, 12);
  });

  it("favours the home side between equal teams", () => {
    const p = newModel().predict("A", "B").probabilities;
    expect(p.home).toBeGreaterThan(p.away);
  });

  it("gives a stronger home side a higher home win chance", () => {
    const model = newModel();
    const before = model.predict("A", "B").probabilities.home;
    model.recordResult({ homeTeam: "A", awayTeam: "C", homeGoals: 3, awayGoals: 0 });
    model.recordResult({ homeTeam: "D", awayTeam: "A", homeGoals: 0, awayGoals: 2 });
    expect(model.predict("A", "B").probabilities.home).toBeGreaterThan(before);
  });

  it("moves rating points from loser to winner, keeping the total the same", () => {
    const model = newModel();
    model.recordResult({ homeTeam: "A", awayTeam: "B", homeGoals: 0, awayGoals: 1 });
    expect(model.rating("B")).toBeGreaterThan(1500);
    expect(model.rating("A")).toBeLessThan(1500);
    expect(model.rating("A") + model.rating("B")).toBeCloseTo(3000, 9);
  });

  it("moves ratings more for a bigger win", () => {
    const narrow = newModel();
    narrow.recordResult({ homeTeam: "A", awayTeam: "B", homeGoals: 1, awayGoals: 0 });
    const big = newModel();
    big.recordResult({ homeTeam: "A", awayTeam: "B", homeGoals: 4, awayGoals: 0 });
    expect(big.rating("A")).toBeGreaterThan(narrow.rating("A"));
  });

  it("starts promoted teams below the returning teams and keeps the average at 1500", () => {
    const model = newModel(["A", "B"]);
    model.recordResult({ homeTeam: "A", awayTeam: "B", homeGoals: 2, awayGoals: 2 });
    model.startSeason(["A", "B", "New"]);
    expect(model.rating("New")).toBeLessThan(model.rating("A"));
    expect(model.rating("New")).toBeLessThan(model.rating("B"));
    const mean = (model.rating("A") + model.rating("B") + model.rating("New")) / 3;
    expect(mean).toBeCloseTo(1500, 9);
  });

  it("pulls ratings part of the way back to average between seasons", () => {
    const model = newModel(["A", "B"]);
    model.recordResult({ homeTeam: "A", awayTeam: "B", homeGoals: 3, awayGoals: 0 });
    const gapBefore = model.rating("A") - model.rating("B");
    model.startSeason(["A", "B"]);
    const gapAfter = model.rating("A") - model.rating("B");
    expect(gapAfter).toBeCloseTo(gapBefore * FOOTBALL_1X2_V1_PARAMS.seasonCarryOver, 9);
  });

  it("refuses teams it has not been told about", () => {
    expect(() => newModel().predict("A", "Unknown")).toThrow(/Unknown team/);
  });

  it("has frozen parameters", () => {
    expect(Object.isFrozen(FOOTBALL_1X2_V1_PARAMS)).toBe(true);
  });
});
