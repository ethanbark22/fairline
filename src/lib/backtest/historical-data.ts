/**
 * Reads the free historical Premier League files (results, and bookmaker
 * odds) that scripts/fetch-historical-data.ts downloads. Original source:
 * football-data.co.uk. See docs/DATA_PROVIDERS.md for the licence position.
 */
import type { HistoricalMatch, Outcome } from "./walk-forward";

export type OutcomePrices = Record<Outcome, number>;

export interface HistoricalOdds {
  /** Pinnacle's closing prices (the last price before kick-off). */
  pinnacleClose?: OutcomePrices;
  /** Average closing price across the bookmakers football-data tracks. */
  averageClose?: OutcomePrices;
}

export type MatchWithOdds = HistoricalMatch & { odds: HistoricalOdds };

/** Minimal CSV reader: handles quoted fields; returns rows as header -> value maps. */
export function parseCsv(text: string): Record<string, string>[] {
  const lines = text.split(/\r?\n/).filter((line) => line.trim() !== "");
  if (lines.length === 0) return [];
  const header = splitCsvLine(lines[0]);
  return lines.slice(1).map((line) => {
    const cells = splitCsvLine(line);
    return Object.fromEntries(header.map((h, i) => [h, cells[i] ?? ""]));
  });
}

function splitCsvLine(line: string): string[] {
  const cells: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (quoted) {
      if (ch === '"' && line[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") {
      cells.push(cell);
      cell = "";
    } else cell += ch;
  }
  cells.push(cell);
  return cells;
}

/**
 * Joins the results file and the odds file on match_id. Rows with missing
 * or impossible scores stop the load; odds that are missing or invalid
 * (price not above 1) are simply left out for that match.
 */
export function loadHistoricalMatches(resultsCsv: string, oddsCsv: string): MatchWithOdds[] {
  const oddsById = new Map(parseCsv(oddsCsv).map((row) => [row.match_id, row]));
  return parseCsv(resultsCsv).map((row) => {
    const homeGoals = Number(row.fthg);
    const awayGoals = Number(row.ftag);
    if (
      !row.match_id ||
      !/^\d{4}-\d{2}-\d{2}$/.test(row.date) ||
      !/^\d{4}-\d{2}$/.test(row.season) ||
      !row.home_team ||
      !row.away_team ||
      !/^\d+$/.test(row.fthg) ||
      !/^\d+$/.test(row.ftag)
    ) {
      throw new Error(`Bad results row: ${JSON.stringify(row)}`);
    }
    const oddsRow = oddsById.get(row.match_id) ?? {};
    return {
      id: row.match_id,
      season: row.season,
      date: row.date,
      homeTeam: row.home_team,
      awayTeam: row.away_team,
      homeGoals,
      awayGoals,
      odds: {
        pinnacleClose: readPrices(oddsRow, "pinnacle_1x2_{o}_close"),
        averageClose: readPrices(oddsRow, "market_avg_1x2_{o}_close"),
      },
    };
  });
}

function readPrices(row: Record<string, string>, pattern: string): OutcomePrices | undefined {
  const prices = {} as OutcomePrices;
  for (const o of ["home", "draw", "away"] as const) {
    const raw = row[pattern.replace("{o}", o)] ?? "";
    const price = Number(raw);
    if (raw.trim() === "" || !Number.isFinite(price) || price <= 1) return undefined;
    prices[o] = price;
  }
  return prices;
}
