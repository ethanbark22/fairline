import { describe, expect, it } from "vitest";
import { accuracy, brierScore, calibration, calibrationError, logLoss, mostLikely, type ScoredForecast } from "./metrics";

const even = { home: 1 / 3, draw: 1 / 3, away: 1 / 3 };

describe("logLoss", () => {
  it("is ln 3 for a know-nothing forecast", () => {
    expect(logLoss([{ probabilities: even, outcome: "home" }])).toBeCloseTo(Math.log(3), 12);
  });

  it("rewards putting more probability on what happened", () => {
    const good = logLoss([{ probabilities: { home: 0.7, draw: 0.2, away: 0.1 }, outcome: "home" }]);
    const bad = logLoss([{ probabilities: { home: 0.1, draw: 0.2, away: 0.7 }, outcome: "home" }]);
    expect(good).toBeCloseTo(-Math.log(0.7), 12);
    expect(bad).toBeGreaterThan(good);
  });

  it("refuses an empty list", () => {
    expect(() => logLoss([])).toThrow(RangeError);
  });
});

describe("brierScore", () => {
  it("is 0 for a perfect forecast and 2 for a certain wrong one", () => {
    expect(brierScore([{ probabilities: { home: 1, draw: 0, away: 0 }, outcome: "home" }])).toBe(0);
    expect(brierScore([{ probabilities: { home: 1, draw: 0, away: 0 }, outcome: "away" }])).toBe(2);
  });

  it("is 2/3 for a know-nothing forecast", () => {
    expect(brierScore([{ probabilities: even, outcome: "draw" }])).toBeCloseTo(2 / 3, 12);
  });
});

describe("accuracy", () => {
  it("counts how often the favourite outcome happened", () => {
    const f: ScoredForecast[] = [
      { probabilities: { home: 0.5, draw: 0.3, away: 0.2 }, outcome: "home" },
      { probabilities: { home: 0.5, draw: 0.3, away: 0.2 }, outcome: "away" },
    ];
    expect(accuracy(f)).toBe(0.5);
    expect(mostLikely({ home: 0.2, draw: 0.3, away: 0.5 })).toBe("away");
  });
});

describe("calibration", () => {
  it("groups every outcome probability into bands and compares with reality", () => {
    const f: ScoredForecast[] = [
      { probabilities: { home: 0.55, draw: 0.25, away: 0.2 }, outcome: "home" },
      { probabilities: { home: 0.55, draw: 0.25, away: 0.2 }, outcome: "draw" },
    ];
    const bins = calibration(f);
    expect(bins.reduce((s, b) => s + b.count, 0)).toBe(6);
    const fifties = bins.find((b) => b.from === 0.5)!;
    expect(fifties.count).toBe(2);
    expect(fifties.predicted).toBeCloseTo(0.55, 12);
    expect(fifties.actual).toBe(0.5);
  });

  it("gives zero error when forecasts match reality exactly", () => {
    expect(calibrationError([{ from: 0.2, to: 0.3, count: 4, predicted: 0.25, actual: 0.25 }])).toBe(0);
  });

  it("weights the error by band size", () => {
    const err = calibrationError([
      { from: 0.2, to: 0.3, count: 3, predicted: 0.25, actual: 0.35 },
      { from: 0.5, to: 0.6, count: 1, predicted: 0.55, actual: 0.55 },
    ]);
    expect(err).toBeCloseTo(0.075, 12);
  });
});
