import { describe, expect, it } from "vitest";
import { loadHistoricalMatches, parseCsv } from "./historical-data";

const RESULTS = `match_id,season,season_code,date,home_team,away_team,fthg,ftag,ftr
1213-arsenal-sunderland,2012-13,1213,2012-08-18,Arsenal,Sunderland,0,0,D
1213-fulham-norwich,2012-13,1213,2012-08-18,Fulham,Norwich,5,0,H`;

const ODDS = `match_id,pinnacle_1x2_home_close,pinnacle_1x2_draw_close,pinnacle_1x2_away_close,market_avg_1x2_home_close,market_avg_1x2_draw_close,market_avg_1x2_away_close
1213-arsenal-sunderland,1.35,5.2,10.5,,,
1213-fulham-norwich,2.1,3.4,1.0,,,`;

describe("parseCsv", () => {
  it("handles quoted fields containing commas and quotes", () => {
    const rows = parseCsv('a,b\n"x, y","say ""hi"""\n');
    expect(rows).toEqual([{ a: "x, y", b: 'say "hi"' }]);
  });
});

describe("loadHistoricalMatches", () => {
  it("joins results with closing odds", () => {
    const [first] = loadHistoricalMatches(RESULTS, ODDS);
    expect(first).toMatchObject({
      id: "1213-arsenal-sunderland",
      season: "2012-13",
      date: "2012-08-18",
      homeTeam: "Arsenal",
      awayTeam: "Sunderland",
      homeGoals: 0,
      awayGoals: 0,
    });
    expect(first.odds.pinnacleClose).toEqual({ home: 1.35, draw: 5.2, away: 10.5 });
    expect(first.odds.averageClose).toBeUndefined();
  });

  it("drops a set of odds containing an impossible price", () => {
    const [, second] = loadHistoricalMatches(RESULTS, ODDS);
    expect(second.odds.pinnacleClose).toBeUndefined();
  });

  it("stops on a missing score instead of treating it as 0", () => {
    const broken = RESULTS.replace("Fulham,Norwich,5,0", "Fulham,Norwich,,0");
    expect(() => loadHistoricalMatches(broken, ODDS)).toThrow(/Bad results row/);
  });
});
