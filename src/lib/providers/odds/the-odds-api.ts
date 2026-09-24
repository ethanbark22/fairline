/**
 * The Odds API (v4). Server-side only: the key must never reach the browser,
 * appear in logs, or be included in error messages.
 *
 * Cost (checked 24 Sept 2026): /sports and /events are free; /odds costs
 * 1 credit per market per region, whatever the number of fixtures returned.
 */
import { z } from "zod";
import type { BookmakerPrices, EventOdds, OddsEvent, OddsProvider, ProviderUsage } from "./types";

const BASE_URL = "https://api.the-odds-api.com/v4";

const eventSchema = z.object({
  id: z.string().min(1),
  commence_time: z.string().min(1),
  home_team: z.string().min(1),
  away_team: z.string().min(1),
});

const outcomeSchema = z.object({ name: z.string(), price: z.number().gt(1) });

const oddsEventSchema = eventSchema.extend({
  bookmakers: z.array(
    z.object({
      key: z.string().min(1),
      title: z.string(),
      last_update: z.string(),
      markets: z.array(z.object({ key: z.string(), outcomes: z.array(outcomeSchema) })),
    }),
  ),
});

type FetchLike = (url: string) => Promise<Response>;

export class TheOddsApiProvider implements OddsProvider {
  constructor(
    private readonly apiKey: string,
    private readonly fetchFn: FetchLike = (url) => fetch(url),
  ) {
    if (!apiKey) throw new Error("ODDS_API_KEY is not set");
  }

  async getEvents(competitionKey: string) {
    const { body, usage } = await this.get(`/sports/${competitionKey}/events`, {});
    const events: OddsEvent[] = z.array(eventSchema).parse(body).map(toEvent);
    return { events, usage };
  }

  async getMatchWinnerOdds(competitionKey: string, region: string) {
    const { body, usage } = await this.get(`/sports/${competitionKey}/odds`, {
      regions: region,
      markets: "h2h",
      oddsFormat: "decimal",
    });
    const events: EventOdds[] = z
      .array(oddsEventSchema)
      .parse(body)
      .map((e) => ({
        ...toEvent(e),
        bookmakers: e.bookmakers
          .map((b) => toBookmakerPrices(b, e.home_team, e.away_team))
          .filter((b): b is BookmakerPrices => b !== undefined),
      }));
    return { events, usage };
  }

  private async get(path: string, params: Record<string, string>) {
    const query = new URLSearchParams({ ...params, apiKey: this.apiKey });
    const response = await this.fetchFn(`${BASE_URL}${path}?${query}`);
    const usage = readUsage(response.headers);
    if (!response.ok) {
      // Deliberately leaves out the URL, which contains the key.
      throw new Error(`The Odds API ${path} failed with HTTP ${response.status}`);
    }
    return { body: (await response.json()) as unknown, usage };
  }
}

function toEvent(e: z.infer<typeof eventSchema>): OddsEvent {
  return { providerEventId: e.id, commenceTime: e.commence_time, homeTeam: e.home_team, awayTeam: e.away_team };
}

/** Returns undefined unless the bookmaker has a complete, unambiguous home / draw / away market. */
function toBookmakerPrices(
  b: z.infer<typeof oddsEventSchema>["bookmakers"][number],
  homeTeam: string,
  awayTeam: string,
): BookmakerPrices | undefined {
  const market = b.markets.find((m) => m.key === "h2h");
  if (!market || market.outcomes.length !== 3) return undefined;
  const price = (name: string) => market.outcomes.find((o) => o.name === name)?.price;
  const home = price(homeTeam);
  const draw = price("Draw");
  const away = price(awayTeam);
  if (home === undefined || draw === undefined || away === undefined) return undefined;
  return { bookmakerKey: b.key, bookmakerTitle: b.title, lastUpdate: b.last_update, prices: { home, draw, away } };
}

function readUsage(headers: Headers): ProviderUsage {
  const num = (name: string) => {
    const value = headers.get(name);
    return value === null || value.trim() === "" || !Number.isFinite(Number(value)) ? null : Number(value);
  };
  return {
    used: num("x-requests-used"),
    remaining: num("x-requests-remaining"),
    lastCallCost: num("x-requests-last"),
  };
}
