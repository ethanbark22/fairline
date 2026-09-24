/**
 * Shared pieces for the backtest scripts: loading the downloaded data,
 * scoring forecasts against bookmakers, and formatting the reports.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  accuracy,
  brierScore,
  calibration,
  calibrationError,
  logLoss,
  type CalibrationBin,
  type ScoredForecast,
} from "./metrics";
import { loadHistoricalMatches, type MatchWithOdds, type OutcomePrices } from "./historical-data";
import { outcomeOf, type Outcome } from "./walk-forward";
import type { OutcomeProbabilities } from "@/lib/models/football/poisson";
import { removeMargin } from "@/lib/value/value";

/** Reads data/historical/ (run `npm run data:fetch` first). */
export function loadDefaultMatches(): MatchWithOdds[] {
  const dataDir = join(process.cwd(), "data", "historical");
  return loadHistoricalMatches(
    readFileSync(join(dataDir, "results.csv"), "utf8"),
    readFileSync(join(dataDir, "results_with_odds.csv"), "utf8"),
  );
}

export const inSeasons = (season: string, range: { from: string; to: string }) =>
  season >= range.from && season <= range.to;

type Scored = { outcome: Outcome };

export function marketProbabilities(prices: OutcomePrices): OutcomeProbabilities {
  const [home, draw, away] = removeMargin([prices.home, prices.draw, prices.away]);
  return { home, draw, away };
}

export function scoredBy<R extends Scored>(rows: R[], pick: (r: R) => OutcomeProbabilities): ScoredForecast[] {
  return rows.map((r) => ({ probabilities: pick(r), outcome: r.outcome }));
}

export function summarise<R extends Scored>(rows: R[], pick: (r: R) => OutcomeProbabilities) {
  const scored = scoredBy(rows, pick);
  const bins = calibration(scored);
  return {
    logLoss: logLoss(scored),
    brier: brierScore(scored),
    accuracy: accuracy(scored),
    calibrationError: calibrationError(bins),
    calibration: bins,
  };
}

/** Model log loss minus bookmaker log loss per match: average and a 95% range. */
export function pairedGap<R extends Scored>(
  rows: R[],
  a: (r: R) => OutcomeProbabilities,
  b: (r: R) => OutcomeProbabilities,
) {
  const diffs = rows.map((r) => -Math.log(a(r)[r.outcome]) + Math.log(b(r)[r.outcome]));
  const m = mean(diffs);
  const sd = Math.sqrt(diffs.reduce((s, d) => s + (d - m) ** 2, 0) / (diffs.length - 1));
  const margin = (1.96 * sd) / Math.sqrt(diffs.length);
  return { mean: m, low: m - margin, high: m + margin };
}

/** Home / draw / away rates from every match before each season (no peeking). */
export function baselineRatesBySeason(all: MatchWithOdds[]): Map<string, OutcomeProbabilities> {
  const seasons = [...new Set(all.map((m) => m.season))].sort();
  const rates = new Map<string, OutcomeProbabilities>();
  for (const season of seasons) {
    const before = all.filter((m) => m.season < season);
    if (before.length === 0) continue;
    const count = (o: Outcome) => before.filter((m) => outcomeOf(m) === o).length / before.length;
    rates.set(season, { home: count("home"), draw: count("draw"), away: count("away") });
  }
  return rates;
}

export function mean(xs: number[]): number {
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

export const pct = (x: number, dp = 1) => `${(x * 100).toFixed(dp)}%`;
export const signedPct = (x: number, dp = 1) => `${x >= 0 ? "+" : ""}${(x * 100).toFixed(dp)}%`;
export const f4 = (x: number) => x.toFixed(4);

export function calibrationTable(model: CalibrationBin[], bookmaker: CalibrationBin[], modelName = "Model"): string {
  const rows = model.map((b) => {
    const bk = bookmaker.find((x) => Math.abs(x.from - b.from) < 1e-9);
    return `| ${pct(b.from, 0)} to ${pct(b.to, 0)} | ${b.count} | ${pct(b.predicted)} | ${pct(b.actual)} | ${
      bk ? `${bk.count} | ${pct(bk.predicted)} | ${pct(bk.actual)}` : "0 | – | –"
    } |`;
  });
  return [
    `| Band | ${modelName}: count | ${modelName}: said | Happened | Pinnacle: count | Pinnacle: said | Happened |`,
    "| --- | --: | --: | --: | --: | --: | --: |",
    ...rows,
  ].join("\n");
}
