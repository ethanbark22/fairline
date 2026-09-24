/**
 * Walk-forward replay: goes through past matches in date order, predicting
 * each day's matches using only results from earlier days, then feeding
 * that day's results in. Nothing from the future can reach a prediction.
 */
import {
  Football1x2V1,
  FOOTBALL_1X2_V1_PARAMS,
  type Football1x2Params,
} from "@/lib/models/football/football-1x2-v1";
import type { OutcomeProbabilities } from "@/lib/models/football/poisson";

export type Outcome = "home" | "draw" | "away";

export interface HistoricalMatch {
  id: string;
  season: string; // e.g. "2012-13"
  date: string; // YYYY-MM-DD
  homeTeam: string;
  awayTeam: string;
  homeGoals: number;
  awayGoals: number;
}

export interface WalkForwardPrediction<M extends HistoricalMatch = HistoricalMatch> {
  match: M;
  probabilities: OutcomeProbabilities;
}

/** Anything that can be replayed: told the teams each season, asked for a prediction, then told the result. */
export interface WalkForwardModel<M extends HistoricalMatch = HistoricalMatch> {
  startSeason(teams: readonly string[]): void;
  predict(match: M): OutcomeProbabilities;
  recordResult(match: M): void;
}

export function v1WalkForwardModel<M extends HistoricalMatch = HistoricalMatch>(
  params: Readonly<Football1x2Params> = FOOTBALL_1X2_V1_PARAMS,
): WalkForwardModel<M> {
  const model = new Football1x2V1(params);
  return {
    startSeason: (teams) => model.startSeason(teams),
    predict: (m) => model.predict(m.homeTeam, m.awayTeam).probabilities,
    recordResult: (m) => model.recordResult(m),
  };
}

export function outcomeOf(match: Pick<HistoricalMatch, "homeGoals" | "awayGoals">): Outcome {
  if (match.homeGoals > match.awayGoals) return "home";
  if (match.homeGoals < match.awayGoals) return "away";
  return "draw";
}

export function runWalkForward<M extends HistoricalMatch>(
  matches: readonly M[],
  model: WalkForwardModel<M> = v1WalkForwardModel(),
): WalkForwardPrediction<M>[] {
  const sorted = [...matches].sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));
  const predictions: WalkForwardPrediction<M>[] = [];

  // Each season's team list comes from its fixture list, which is public
  // before the season starts, so using it is not peeking.
  const teamsBySeason = new Map<string, Set<string>>();
  for (const m of sorted) {
    const teams = teamsBySeason.get(m.season) ?? new Set<string>();
    teams.add(m.homeTeam).add(m.awayTeam);
    teamsBySeason.set(m.season, teams);
  }

  let season: string | undefined;
  let i = 0;
  while (i < sorted.length) {
    const date = sorted[i].date;
    const day: M[] = [];
    while (i < sorted.length && sorted[i].date === date) day.push(sorted[i++]);

    for (const m of day) {
      if (m.season !== season) {
        if (season !== undefined && m.season < season) {
          throw new Error(`Season ${m.season} starts after season ${season}: check the data`);
        }
        season = m.season;
        model.startSeason([...teamsBySeason.get(season)!]);
      }
    }
    // Predict the whole day first, then learn from it: we do not have
    // reliable kick-off times, so no same-day result is used.
    for (const m of day) {
      predictions.push({ match: m, probabilities: model.predict(m) });
    }
    for (const m of day) model.recordResult(m);
  }
  return predictions;
}
