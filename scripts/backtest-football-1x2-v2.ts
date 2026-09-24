/**
 * Backtest for football_1x2_v2 on past Premier League seasons, reported next
 * to v1 and Pinnacle's closing prices.
 *
 *   npm run data:fetch                download the free historical data (once)
 *   npm run backtest:v2 -- --fit      pick v2's two settings using seasons up to 2017-18 only
 *   npm run backtest:v2               score on 2018-19 onwards and write
 *                                     docs/backtests/football_1x2_v2.md
 *
 * Pinnacle closing prices only exist from 2012-13, so v2 is tested on a later
 * window than v1: its market weight has to be learned on 2012-13 to 2017-18.
 */
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import type { MatchWithOdds } from "@/lib/backtest/historical-data";
import { logLoss } from "@/lib/backtest/metrics";
import {
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
import {
  outcomeOf,
  runWalkForward,
  v1WalkForwardModel,
  type Outcome,
  type WalkForwardModel,
} from "@/lib/backtest/walk-forward";
import { FOOTBALL_1X2_V1_PARAMS } from "@/lib/models/football/football-1x2-v1";
import {
  blend,
  Football1x2V2,
  FOOTBALL_1X2_V2,
  FOOTBALL_1X2_V2_PARAMS,
  TrackedHomeRatings,
  type Football1x2V2Params,
} from "@/lib/models/football/football-1x2-v2";
import type { OutcomeProbabilities } from "@/lib/models/football/poisson";

/** Home advantage learning rate is chosen on these (ratings only, no odds needed). */
const RATINGS_FIT_SEASONS = { from: "2000-01", to: "2017-18" };
/** Market weight is chosen on these (the first seasons with Pinnacle closing prices). */
const MARKET_FIT_SEASONS = { from: "2012-13", to: "2017-18" };
/** Never used for choosing anything. */
const TEST_SEASONS = { from: "2018-19", to: "2025-26" };
const OUTCOMES: Outcome[] = ["home", "draw", "away"];

const matches = loadDefaultMatches();
const pinnacleOf = (m: MatchWithOdds) =>
  m.odds.pinnacleClose ? marketProbabilities(m.odds.pinnacleClose) : undefined;

function trackedRatingsModel(learningRate: number): WalkForwardModel<MatchWithOdds> {
  const model = new TrackedHomeRatings(FOOTBALL_1X2_V1_PARAMS, learningRate);
  return {
    startSeason: (teams) => model.startSeason(teams),
    predict: (m) => model.predict(m.homeTeam, m.awayTeam).probabilities,
    recordResult: (m) => model.recordResult(m),
  };
}

/** Also records home advantage at the start of each season, for the report. */
function v2Model(params: Readonly<Football1x2V2Params>, homeAdvantageBySeason?: Map<string, number>) {
  const model = new Football1x2V2(params);
  const adapter: WalkForwardModel<MatchWithOdds> = {
    startSeason: (teams) => model.startSeason(teams),
    predict: (m) => {
      const prediction = model.predict(m.homeTeam, m.awayTeam, pinnacleOf(m));
      if (homeAdvantageBySeason && !homeAdvantageBySeason.has(m.season)) {
        homeAdvantageBySeason.set(m.season, prediction.homeAdvantage);
      }
      return prediction.probabilities;
    },
    recordResult: (m) => model.recordResult(m),
  };
  return adapter;
}

function fit() {
  const history = matches.filter((m) => m.season <= RATINGS_FIT_SEASONS.to);

  let bestRate: { rate: number; score: number } | undefined;
  for (const rate of [0, 0.25, 0.5, 1, 2, 4, 8]) {
    const scored = runWalkForward(history, trackedRatingsModel(rate))
      .filter((p) => inSeasons(p.match.season, RATINGS_FIT_SEASONS))
      .map((p) => ({ probabilities: p.probabilities, outcome: outcomeOf(p.match) }));
    const score = logLoss(scored);
    console.log(`learning rate ${rate}: log loss ${score.toFixed(5)}`);
    if (!bestRate || score < bestRate.score) bestRate = { rate, score };
  }

  const rated = runWalkForward(history, trackedRatingsModel(bestRate!.rate)).filter(
    (p) => inSeasons(p.match.season, MARKET_FIT_SEASONS) && p.match.odds.pinnacleClose,
  );
  let bestWeight: { weight: number; score: number } | undefined;
  for (let i = 0; i <= 20; i++) {
    const weight = i / 20;
    const score = logLoss(
      rated.map((p) => ({
        probabilities: blend(pinnacleOf(p.match)!, p.probabilities, weight),
        outcome: outcomeOf(p.match),
      })),
    );
    if (!bestWeight || score < bestWeight.score) bestWeight = { weight, score };
  }
  console.log(`Best learning rate (${RATINGS_FIT_SEASONS.from} to ${RATINGS_FIT_SEASONS.to}): ${bestRate!.rate}`);
  console.log(
    `Best market weight (${MARKET_FIT_SEASONS.from} to ${MARKET_FIT_SEASONS.to}): ${bestWeight!.weight} ` +
      `(log loss ${bestWeight!.score.toFixed(5)})`,
  );
}

interface Row {
  match: MatchWithOdds;
  outcome: Outcome;
  v1: OutcomeProbabilities;
  ratings: OutcomeProbabilities;
  v2: OutcomeProbabilities;
  pinnacle: OutcomeProbabilities;
}

function buildResults() {
  const homeAdvantageBySeason = new Map<string, number>();
  const byId = <T>(preds: { match: MatchWithOdds; probabilities: T }[]) =>
    new Map(preds.map((p) => [p.match.id, p.probabilities]));
  const v1 = byId(runWalkForward(matches, v1WalkForwardModel<MatchWithOdds>()));
  const ratings = byId(runWalkForward(matches, trackedRatingsModel(FOOTBALL_1X2_V2_PARAMS.homeAdvantageLearningRate)));
  const v2 = byId(runWalkForward(matches, v2Model(FOOTBALL_1X2_V2_PARAMS, homeAdvantageBySeason)));

  const rows: Row[] = matches
    .filter((m) => inSeasons(m.season, TEST_SEASONS) && m.odds.pinnacleClose)
    .map((m) => ({
      match: m,
      outcome: outcomeOf(m),
      v1: v1.get(m.id)!,
      ratings: ratings.get(m.id)!,
      v2: v2.get(m.id)!,
      pinnacle: pinnacleOf(m)!,
    }));
  const withAverage = rows.filter((r) => r.match.odds.averageClose);
  const withMax = rows.filter((r) => r.match.odds.maxClose);
  const average = (r: Row) => marketProbabilities(r.match.odds.averageClose!);

  return {
    modelVersion: FOOTBALL_1X2_V2,
    params: FOOTBALL_1X2_V2_PARAMS,
    ratingsFitSeasons: RATINGS_FIT_SEASONS,
    marketFitSeasons: MARKET_FIT_SEASONS,
    testSeasons: TEST_SEASONS,
    pinnacle: {
      matches: rows.length,
      v1: summarise(rows, (r) => r.v1),
      ratings: summarise(rows, (r) => r.ratings),
      v2: summarise(rows, (r) => r.v2),
      bookmaker: summarise(rows, (r) => r.pinnacle),
      v1Gap: pairedGap(rows, (r) => r.v1, (r) => r.pinnacle),
      v2Gap: pairedGap(rows, (r) => r.v2, (r) => r.pinnacle),
    },
    average: {
      matches: withAverage.length,
      v2: summarise(withAverage, (r) => r.v2),
      bookmaker: summarise(withAverage, average),
      gap: pairedGap(withAverage, (r) => r.v2, average),
    },
    seasons: [...new Set(rows.map((r) => r.match.season))].map((season) => {
      const inSeason = rows.filter((r) => r.match.season === season);
      return {
        season,
        matches: inSeason.length,
        v1: logLoss(scoredBy(inSeason, (r) => r.v1)),
        v2: logLoss(scoredBy(inSeason, (r) => r.v2)),
        bookmaker: logLoss(scoredBy(inSeason, (r) => r.pinnacle)),
      };
    }),
    outcomeRates: OUTCOMES.map((o) => ({
      outcome: o,
      actual: rows.filter((r) => r.outcome === o).length / rows.length,
      v1: mean(rows.map((r) => r.v1[o])),
      ratings: mean(rows.map((r) => r.ratings[o])),
      v2: mean(rows.map((r) => r.v2[o])),
      bookmaker: mean(rows.map((r) => r.pinnacle[o])),
    })),
    homeAdvantage: [...homeAdvantageBySeason]
      .filter(([season]) => season >= "2000-01")
      .map(([season, points]) => ({ season, points })),
    valueBets: [0, 0.02, 0.05].map((requiredEdge) => ({
      requiredEdge,
      pinnacle: simulateValueBets(
        rows.map((r) => ({ probabilities: r.v2, prices: r.match.odds.pinnacleClose!, outcome: r.outcome })),
        requiredEdge,
      ),
      average: simulateValueBets(
        withAverage.map((r) => ({ probabilities: r.v2, prices: r.match.odds.averageClose!, outcome: r.outcome })),
        requiredEdge,
      ),
      best: simulateValueBets(
        withMax.map((r) => ({ probabilities: r.v2, prices: r.match.odds.maxClose!, outcome: r.outcome })),
        requiredEdge,
      ),
    })),
  };
}

type Results = ReturnType<typeof buildResults>;

function scoreRow(name: string, s: Results["pinnacle"]["v2"]): string {
  return `| ${name} | ${f4(s.logLoss)} | ${f4(s.brier)} | ${pct(s.accuracy)} | ${pct(s.calibrationError)} |`;
}

function renderMarkdown(r: Results): string {
  const p = r.pinnacle;
  const a = r.average;
  return `# Backtest: ${FOOTBALL_1X2_V2} (with v1 and Pinnacle for comparison)

Generated by \`npm run backtest:v2\`. Data: Premier League results and closing odds
from football-data.co.uk (see \`docs/DATA_PROVIDERS.md\`).

- Home advantage learning rate chosen on ${RATINGS_FIT_SEASONS.from} to ${RATINGS_FIT_SEASONS.to}.
- Market weight chosen on ${MARKET_FIT_SEASONS.from} to ${MARKET_FIT_SEASONS.to}.
- Scored on ${TEST_SEASONS.from} to ${TEST_SEASONS.to}, which played no part in choosing anything.
- Walk-forward: each day's matches are predicted using only earlier results.
- **v2 uses Pinnacle's closing price as its market input.** In live use it will
  only have the latest price at the time of the analysis, which is usually a
  little less accurate, so these results are a best case for v2.

Parameters: \`${JSON.stringify({ homeAdvantageLearningRate: r.params.homeAdvantageLearningRate, marketWeight: r.params.marketWeight })}\`
(ratings settings as v1).

## Against Pinnacle's closing prices (${p.matches} matches)

| | Log loss (lower is better) | Brier (lower is better) | Accuracy | Calibration error |
| --- | --: | --: | --: | --: |
${scoreRow("v1 (ratings only)", p.v1)}
${scoreRow("v2 ratings part (tracked home advantage)", p.ratings)}
${scoreRow(`**v2 (${pct(r.params.marketWeight, 0)} market)**`, p.v2)}
${scoreRow("Pinnacle closing", p.bookmaker)}

Log loss minus Pinnacle's, per match (positive = worse than Pinnacle):

- v1: ${f4(p.v1Gap.mean)} (95% range ${f4(p.v1Gap.low)} to ${f4(p.v1Gap.high)})
- v2: ${f4(p.v2Gap.mean)} (95% range ${f4(p.v2Gap.low)} to ${f4(p.v2Gap.high)})

## Against the average closing price (${a.matches} matches, 2019-20 onwards)

| | Log loss | Brier | Accuracy | Calibration error |
| --- | --: | --: | --: | --: |
${scoreRow("v2", a.v2)}
${scoreRow("Average closing", a.bookmaker)}

v2 minus average-closing log loss per match: ${f4(a.gap.mean)} (95% range ${f4(a.gap.low)} to ${f4(a.gap.high)}).
Part of any advantage here comes from v2 using Pinnacle's price, which is sharper than the average.

## Calibration (v2 vs Pinnacle)

${calibrationTable(p.v2.calibration, p.bookmaker.calibration, "v2")}

## How often each result was predicted vs happened

| Outcome | Happened | v1 | v2 ratings part | v2 | Pinnacle |
| --- | --: | --: | --: | --: | --: |
${r.outcomeRates.map((o) => `| ${o.outcome} | ${pct(o.actual)} | ${pct(o.v1)} | ${pct(o.ratings)} | ${pct(o.v2)} | ${pct(o.bookmaker)} |`).join("\n")}

## Season by season (log loss, lower is better)

| Season | Matches | v1 | v2 | Pinnacle closing |
| --- | --: | --: | --: | --: |
${r.seasons.map((s) => `| ${s.season} | ${s.matches} | ${f4(s.v1)} | ${f4(s.v2)} | ${f4(s.bookmaker)} |`).join("\n")}

## Home advantage tracked by v2 (rating points, at the start of each season)

v1 uses a fixed ${FOOTBALL_1X2_V1_PARAMS.homeAdvantage}.

| Season | Home advantage |
| --- | --: |
${r.homeAdvantage.map((h) => `| ${h.season} | ${h.points.toFixed(0)} |`).join("\n")}

## If you had bet £1 whenever the price beat v2's minimum price

Pretend bets at closing prices. For research only. "Best price" is the highest
closing price across all tracked bookmakers for that outcome (2019-20 onwards).
It is an optimistic case: those bookmakers may not be available in the UK,
and bookmakers often limit accounts that keep taking their best prices.

| Required edge | Pinnacle: bets | Return | Average price: bets | Return | Best price: bets | Won | Profit | Return |
| --- | --: | --: | --: | --: | --: | --: | --: | --: |
${r.valueBets
  .map(
    (v) =>
      `| ${pct(v.requiredEdge, 0)} | ${v.pinnacle.bets} | ${signedPct(v.pinnacle.roi)} | ${v.average.bets} | ${signedPct(
        v.average.roi,
      )} | ${v.best.bets} | ${v.best.wins} | £${v.best.profit.toFixed(0)} | ${signedPct(v.best.roi)} |`,
  )
  .join("\n")}
`;
}

function report() {
  const results = buildResults();
  const outDir = join(process.cwd(), "docs", "backtests");
  writeFileSync(join(outDir, `${FOOTBALL_1X2_V2}.json`), JSON.stringify(results, null, 2) + "\n");
  writeFileSync(join(outDir, `${FOOTBALL_1X2_V2}.md`), renderMarkdown(results));
  console.log(renderMarkdown(results));
}

if (process.argv.includes("--fit")) fit();
else report();
