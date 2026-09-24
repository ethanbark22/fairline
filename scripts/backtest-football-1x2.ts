/**
 * Backtest for football_1x2_v1 on past Premier League seasons.
 *
 *   npm run data:fetch            download the free historical data (once)
 *   npm run backtest -- --fit     pick parameters using 2000-01 to 2011-12 only
 *   npm run backtest              score the fixed parameters on 2012-13 onwards
 *                                 and write docs/backtests/football_1x2_v1.md
 *
 * Every prediction is made walk-forward: only results from earlier days are
 * used. Parameters are chosen on the fitting seasons, never on test seasons.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  accuracy,
  brierScore,
  calibration,
  calibrationError,
  logLoss,
  type CalibrationBin,
  type ScoredForecast,
} from "@/lib/backtest/metrics";
import { loadHistoricalMatches, type MatchWithOdds, type OutcomePrices } from "@/lib/backtest/historical-data";
import { simulateValueBets } from "@/lib/backtest/value-bets";
import { outcomeOf, runWalkForward, type Outcome } from "@/lib/backtest/walk-forward";
import {
  FOOTBALL_1X2_V1,
  FOOTBALL_1X2_V1_PARAMS,
  type Football1x2Params,
} from "@/lib/models/football/football-1x2-v1";
import type { OutcomeProbabilities } from "@/lib/models/football/poisson";
import { removeMargin } from "@/lib/value/value";

const FIT_SEASONS = { from: "2000-01", to: "2011-12" };
const TEST_SEASONS = { from: "2012-13", to: "2025-26" };
const OUTCOMES: Outcome[] = ["home", "draw", "away"];

const dataDir = join(process.cwd(), "data", "historical");
const matches = loadHistoricalMatches(
  readFileSync(join(dataDir, "results.csv"), "utf8"),
  readFileSync(join(dataDir, "results_with_odds.csv"), "utf8"),
);

const inSeasons = (season: string, range: { from: string; to: string }) =>
  season >= range.from && season <= range.to;

function fit() {
  const history = matches.filter((m) => m.season <= FIT_SEASONS.to);
  const grid = {
    kFactor: [10, 15, 20, 25, 30, 40],
    homeAdvantage: [40, 60, 80, 100, 120, 140],
    supremacyPer100: [0.3, 0.4, 0.5, 0.6, 0.7, 0.8],
    promotedGap: [50, 100, 150, 200],
    seasonCarryOver: [0.6, 0.7, 0.8, 0.9, 1],
  };
  let best: { params: Football1x2Params; score: number } | undefined;
  for (const kFactor of grid.kFactor)
    for (const homeAdvantage of grid.homeAdvantage)
      for (const supremacyPer100 of grid.supremacyPer100)
        for (const promotedGap of grid.promotedGap)
          for (const seasonCarryOver of grid.seasonCarryOver) {
            const params = { kFactor, homeAdvantage, supremacyPer100, promotedGap, seasonCarryOver };
            const scored = runWalkForward(history, params)
              .filter((p) => inSeasons(p.match.season, FIT_SEASONS))
              .map((p) => ({ probabilities: p.probabilities, outcome: outcomeOf(p.match) }));
            const score = logLoss(scored);
            if (!best || score < best.score) best = { params, score };
          }
  console.log(`Best on ${FIT_SEASONS.from} to ${FIT_SEASONS.to}: log loss ${best!.score.toFixed(4)}`);
  console.log(JSON.stringify(best!.params, null, 2));
}

interface Row {
  match: MatchWithOdds;
  outcome: Outcome;
  model: OutcomeProbabilities;
  baseline: OutcomeProbabilities;
}

function report() {
  const results = buildResults();
  const outDir = join(process.cwd(), "docs", "backtests");
  writeFileSync(join(outDir, `${FOOTBALL_1X2_V1}.json`), JSON.stringify(results, null, 2) + "\n");
  writeFileSync(join(outDir, `${FOOTBALL_1X2_V1}.md`), renderMarkdown(results));
  console.log(renderMarkdown(results));
}

type Results = ReturnType<typeof buildResults>;

function buildResults() {
  const predictions = runWalkForward(matches, FOOTBALL_1X2_V1_PARAMS);
  const baselines = baselineRatesBySeason(matches);
  const test: Row[] = predictions
    .filter((p) => inSeasons(p.match.season, TEST_SEASONS))
    .map((p) => ({
      match: p.match as MatchWithOdds,
      outcome: outcomeOf(p.match),
      model: p.probabilities,
      baseline: baselines.get(p.match.season)!,
    }));

  const withPinnacle = test.filter((r) => r.match.odds.pinnacleClose);
  const withAverage = test.filter((r) => r.match.odds.averageClose);
  const pinnacle = (r: Row) => marketProbabilities(r.match.odds.pinnacleClose!);
  const average = (r: Row) => marketProbabilities(r.match.odds.averageClose!);

  const pinnacleSummary = {
    matches: withPinnacle.length,
    model: summarise(withPinnacle, (r) => r.model),
    bookmaker: summarise(withPinnacle, pinnacle),
    baseline: summarise(withPinnacle, (r) => r.baseline),
    gap: pairedGap(withPinnacle, (r) => r.model, pinnacle),
  };
  const averageSummary = {
    matches: withAverage.length,
    model: summarise(withAverage, (r) => r.model),
    bookmaker: summarise(withAverage, average),
    gap: pairedGap(withAverage, (r) => r.model, average),
  };
  const seasons = [...new Set(withPinnacle.map((r) => r.match.season))].map((season) => {
    const rows = withPinnacle.filter((r) => r.match.season === season);
    return {
      season,
      matches: rows.length,
      model: logLoss(scoredBy(rows, (r) => r.model)),
      bookmaker: logLoss(scoredBy(rows, pinnacle)),
    };
  });
  const outcomeRates = OUTCOMES.map((o) => ({
    outcome: o,
    actual: withPinnacle.filter((r) => r.outcome === o).length / withPinnacle.length,
    model: mean(withPinnacle.map((r) => r.model[o])),
    bookmaker: mean(withPinnacle.map((r) => pinnacle(r)[o])),
  }));
  const valueBets = [0, 0.02, 0.05].map((requiredEdge) => ({
    requiredEdge,
    pinnacle: simulateValueBets(
      withPinnacle.map((r) => ({ probabilities: r.model, prices: r.match.odds.pinnacleClose!, outcome: r.outcome })),
      requiredEdge,
    ),
    average: simulateValueBets(
      withAverage.map((r) => ({ probabilities: r.model, prices: r.match.odds.averageClose!, outcome: r.outcome })),
      requiredEdge,
    ),
  }));

  return {
    modelVersion: FOOTBALL_1X2_V1,
    params: FOOTBALL_1X2_V1_PARAMS,
    fitSeasons: FIT_SEASONS,
    testSeasons: TEST_SEASONS,
    pinnacle: pinnacleSummary,
    average: averageSummary,
    seasons,
    outcomeRates,
    valueBets,
  };
}

function marketProbabilities(prices: OutcomePrices): OutcomeProbabilities {
  const [home, draw, away] = removeMargin([prices.home, prices.draw, prices.away]);
  return { home, draw, away };
}

function scoredBy(rows: Row[], pick: (r: Row) => OutcomeProbabilities): ScoredForecast[] {
  return rows.map((r) => ({ probabilities: pick(r), outcome: r.outcome }));
}

function summarise(rows: Row[], pick: (r: Row) => OutcomeProbabilities) {
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
function pairedGap(rows: Row[], a: (r: Row) => OutcomeProbabilities, b: (r: Row) => OutcomeProbabilities) {
  const diffs = rows.map((r) => -Math.log(a(r)[r.outcome]) + Math.log(b(r)[r.outcome]));
  const m = mean(diffs);
  const sd = Math.sqrt(diffs.reduce((s, d) => s + (d - m) ** 2, 0) / (diffs.length - 1));
  const margin = (1.96 * sd) / Math.sqrt(diffs.length);
  return { mean: m, low: m - margin, high: m + margin };
}

/** Home / draw / away rates from every match before each season (no peeking). */
function baselineRatesBySeason(all: MatchWithOdds[]): Map<string, OutcomeProbabilities> {
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

function mean(xs: number[]): number {
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

const pct = (x: number, dp = 1) => `${(x * 100).toFixed(dp)}%`;
const signedPct = (x: number, dp = 1) => `${x >= 0 ? "+" : ""}${(x * 100).toFixed(dp)}%`;
const f4 = (x: number) => x.toFixed(4);

function calibrationTable(model: CalibrationBin[], bookmaker: CalibrationBin[]): string {
  const rows = model.map((b) => {
    const bk = bookmaker.find((x) => Math.abs(x.from - b.from) < 1e-9);
    return `| ${pct(b.from, 0)} to ${pct(b.to, 0)} | ${b.count} | ${pct(b.predicted)} | ${pct(b.actual)} | ${
      bk ? `${bk.count} | ${pct(bk.predicted)} | ${pct(bk.actual)}` : "0 | – | –"
    } |`;
  });
  return [
    "| Band | Model: count | Model: said | Happened | Pinnacle: count | Pinnacle: said | Happened |",
    "| --- | --: | --: | --: | --: | --: | --: |",
    ...rows,
  ].join("\n");
}

function renderMarkdown(r: Results): string {
  const p = r.pinnacle;
  const a = r.average;
  return `# Backtest: ${FOOTBALL_1X2_V1}

Generated by \`npm run backtest\`. Data: Premier League results and closing odds
from football-data.co.uk (see \`docs/DATA_PROVIDERS.md\`).

- Parameters chosen using seasons ${FIT_SEASONS.from} to ${FIT_SEASONS.to} only.
- Scored on seasons ${TEST_SEASONS.from} to ${TEST_SEASONS.to}, which played no part in choosing them.
- Walk-forward: each day's matches are predicted using only earlier results.
- Bookmaker probabilities are closing prices with the margin removed (proportional method).

Parameters: \`${JSON.stringify(r.params)}\`

## Against Pinnacle's closing prices (${p.matches} matches)

Pinnacle is widely seen as the sharpest bookmaker, and closing prices are the
hardest to beat.

| | Log loss (lower is better) | Brier (lower is better) | Accuracy | Calibration error |
| --- | --: | --: | --: | --: |
| Our model | ${f4(p.model.logLoss)} | ${f4(p.model.brier)} | ${pct(p.model.accuracy)} | ${pct(p.model.calibrationError)} |
| Pinnacle closing | ${f4(p.bookmaker.logLoss)} | ${f4(p.bookmaker.brier)} | ${pct(p.bookmaker.accuracy)} | ${pct(p.bookmaker.calibrationError)} |
| Naive (past home/draw/away rates) | ${f4(p.baseline.logLoss)} | ${f4(p.baseline.brier)} | ${pct(p.baseline.accuracy)} | ${pct(p.baseline.calibrationError)} |

Model minus Pinnacle log loss per match: ${f4(p.gap.mean)} (95% range ${f4(p.gap.low)} to ${f4(p.gap.high)}).
Positive means the model is worse.

## Against the average closing price (${a.matches} matches, 2019-20 onwards)

| | Log loss | Brier | Accuracy | Calibration error |
| --- | --: | --: | --: | --: |
| Our model | ${f4(a.model.logLoss)} | ${f4(a.model.brier)} | ${pct(a.model.accuracy)} | ${pct(a.model.calibrationError)} |
| Average closing | ${f4(a.bookmaker.logLoss)} | ${f4(a.bookmaker.brier)} | ${pct(a.bookmaker.accuracy)} | ${pct(a.bookmaker.calibrationError)} |

Model minus average-closing log loss per match: ${f4(a.gap.mean)} (95% range ${f4(a.gap.low)} to ${f4(a.gap.high)}).

## Calibration (Pinnacle matches)

Every probability given (home, draw and away for each match), grouped into bands.
Well calibrated means "said" and "happened" are close.

${calibrationTable(p.model.calibration, p.bookmaker.calibration)}

## How often each result was predicted vs happened

| Outcome | Happened | Model average | Pinnacle average |
| --- | --: | --: | --: |
${r.outcomeRates.map((o) => `| ${o.outcome} | ${pct(o.actual)} | ${pct(o.model)} | ${pct(o.bookmaker)} |`).join("\n")}

## Season by season (log loss, lower is better)

| Season | Matches | Model | Pinnacle closing |
| --- | --: | --: | --: |
${r.seasons.map((s) => `| ${s.season} | ${s.matches} | ${f4(s.model)} | ${f4(s.bookmaker)} |`).join("\n")}

## If you had bet £1 whenever the price beat the model's minimum price

Pretend bets at the closing price. For research only.

| Required edge | Pinnacle: bets | Won | Profit | Return | Average close: bets | Won | Profit | Return |
| --- | --: | --: | --: | --: | --: | --: | --: | --: |
${r.valueBets
  .map(
    (v) =>
      `| ${pct(v.requiredEdge, 0)} | ${v.pinnacle.bets} | ${v.pinnacle.wins} | £${v.pinnacle.profit.toFixed(0)} | ${signedPct(
        v.pinnacle.roi,
      )} | ${v.average.bets} | ${v.average.wins} | £${v.average.profit.toFixed(0)} | ${signedPct(v.average.roi)} |`,
  )
  .join("\n")}
`;
}

if (process.argv.includes("--fit")) fit();
else report();
