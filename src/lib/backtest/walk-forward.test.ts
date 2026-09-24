import { describe, expect, it } from "vitest";
import { outcomeOf, runWalkForward, type HistoricalMatch } from "./walk-forward";

let n = 0;
function match(season: string, date: string, homeTeam: string, awayTeam: string, homeGoals: number, awayGoals: number): HistoricalMatch {
  return { id: `m${n++}`, season, date, homeTeam, awayTeam, homeGoals, awayGoals };
}

const MATCHES: HistoricalMatch[] = [
  match("2020-21", "2020-09-01", "A", "B", 2, 0),
  match("2020-21", "2020-09-01", "C", "D", 1, 1),
  match("2020-21", "2020-09-08", "A", "C", 3, 1),
  match("2020-21", "2020-09-08", "B", "D", 0, 2),
  match("2020-21", "2020-09-15", "A", "D", 1, 0),
  match("2021-22", "2021-08-14", "A", "E", 2, 2),
  match("2021-22", "2021-08-14", "B", "C", 0, 1),
];

const home = (preds: ReturnType<typeof runWalkForward>, id: string) =>
  preds.find((p) => p.match.id === id)!.probabilities.home;

describe("runWalkForward", () => {
  it("predicts every match exactly once", () => {
    const preds = runWalkForward(MATCHES);
    expect(preds).toHaveLength(MATCHES.length);
    expect(new Set(preds.map((p) => p.match.id)).size).toBe(MATCHES.length);
  });

  it("never lets a later result change an earlier prediction", () => {
    const original = runWalkForward(MATCHES);
    const changedFuture = MATCHES.map((m) => (m.date >= "2020-09-15" ? { ...m, homeGoals: 0, awayGoals: 7 } : m));
    const replay = runWalkForward(changedFuture);
    for (const m of MATCHES.filter((m) => m.date < "2020-09-15")) {
      expect(home(replay, m.id)).toBe(home(original, m.id));
    }
  });

  it("does not use a same-day result, even from an earlier kick-off", () => {
    const original = runWalkForward(MATCHES);
    const changedSameDay = MATCHES.map((m) => (m.id === MATCHES[0].id ? { ...m, homeGoals: 0, awayGoals: 5 } : m));
    expect(home(runWalkForward(changedSameDay), MATCHES[1].id)).toBe(home(original, MATCHES[1].id));
  });

  it("does use earlier days' results", () => {
    const original = runWalkForward(MATCHES);
    const changedPast = MATCHES.map((m) => (m.id === MATCHES[0].id ? { ...m, homeGoals: 0, awayGoals: 5 } : m));
    expect(home(runWalkForward(changedPast), MATCHES[2].id)).not.toBe(home(original, MATCHES[2].id));
  });

  it("gives the same answer whatever order the matches arrive in", () => {
    const forward = runWalkForward(MATCHES);
    const reversed = runWalkForward([...MATCHES].reverse());
    for (const m of MATCHES) expect(home(reversed, m.id)).toBe(home(forward, m.id));
  });

  it("handles a team joining in a new season", () => {
    const preds = runWalkForward(MATCHES);
    const newTeamMatch = preds.find((p) => p.match.awayTeam === "E")!;
    expect(newTeamMatch.probabilities.home).toBeGreaterThan(newTeamMatch.probabilities.away);
  });
});

describe("outcomeOf", () => {
  it("reads the full-time score", () => {
    expect(outcomeOf({ homeGoals: 2, awayGoals: 1 })).toBe("home");
    expect(outcomeOf({ homeGoals: 1, awayGoals: 1 })).toBe("draw");
    expect(outcomeOf({ homeGoals: 0, awayGoals: 3 })).toBe("away");
  });
});
