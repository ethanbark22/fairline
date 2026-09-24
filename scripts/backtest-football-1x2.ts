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
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { logLoss } from "@/lib/backtest/metrics";
import type { MatchWithOdds } from "@/lib/backtest/historical-data";
import {
  baselineRatesBySeason,
  calibrationTable,
  f4,
  inSeasons,
  loadDefaultMatches,
  marketProbabilities,
  mean,
  pairedGap,
  pct,
  scoredBy,
  signedPct,
  summarise,
} from "@/lib/backtest/report-helpers";
import { simulateValueBets } from "@/lib/backtest/value-bets";
import { outcomeOf, runWalkForward, v1WalkForwardModel, type Outcome } from "@/lib/backtest/walk-forward";
import {
  FOOTBALL_1X2_V1,
  FOOTBALL_1X2_V1_PARAMS,
  type Football1x2Params,
} from "@/lib/models/football/football-1x2-v1";
import type { OutcomeProbabilities } from "@/lib/models/football/poisson";

const FIT_SEASONS = { from: "2000-01", to: "2011-12" };
const TEST_SEASONS = { from: "2012-13", to: "2025-26" };
const OUTCOMES: Outcome[] = ["home", "draw", "away"];

const matches = loadDefaultMatches();

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
            const scored = runWalkForward(history, v1WalkForwardModel(params))
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
  const predictions = runWalkForward(matches, v1WalkForwardModel(FOOTBALL_1X2_V1_PARAMS));
  const baselines = baselineRatesBySeason(matches);
  const test: Row[] = predictions
    .filter((p) => inSeasons(p.match.season, TEST_SEASONS))
    .map((p) => ({
      match: p.match,
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
