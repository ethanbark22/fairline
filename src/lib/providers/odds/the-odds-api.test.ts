import { describe, expect, it } from "vitest";
import { TheOddsApiProvider } from "./the-odds-api";

const FAKE_KEY = "fake-key-for-tests";

function fakeFetch(body: unknown, status = 200, headers: Record<string, string> = {}) {
  const calls: string[] = [];
  const fn = async (url: string) => {
    calls.push(url);
    return new Response(JSON.stringify(body), { status, headers });
  };
  return { fn, calls };
}

const ODDS = [
  {
    id: "evt1",
    commence_time: "2030-01-01T15:00:00Z",
    home_team: "Home FC",
    away_team: "Away United",
    bookmakers: [
      {
        key: "book_a",
        title: "Book A",
        last_update: "2029-12-30T10:00:00Z",
        markets: [
          {
            key: "h2h",
            outcomes: [
              { name: "Away United", price: 3.6 },
              { name: "Home FC", price: 2.1 },
              { name: "Draw", price: 3.4 },
            ],
          },
        ],
      },
      {
        key: "book_incomplete",
        title: "Incomplete",
        last_update: "2029-12-30T10:00:00Z",
        markets: [{ key: "h2h", outcomes: [{ name: "Home FC", price: 2.0 }] }],
      },
    ],
  },
];

describe("TheOddsApiProvider", () => {
  it("maps outcomes to home / draw / away by team name, not by position", async () => {
    const { fn } = fakeFetch(ODDS, 200, { "x-requests-used": "12", "x-requests-remaining": "488", "x-requests-last": "1" });
    const { events, usage } = await new TheOddsApiProvider(FAKE_KEY, fn).getMatchWinnerOdds("soccer_epl", "uk");
    expect(events[0].bookmakers[0].prices).toEqual({ home: 2.1, draw: 3.4, away: 3.6 });
    expect(usage).toEqual({ used: 12, remaining: 488, lastCallCost: 1 });
  });

  it("drops a bookmaker without a complete home / draw / away market", async () => {
    const { fn } = fakeFetch(ODDS);
    const { events } = await new TheOddsApiProvider(FAKE_KEY, fn).getMatchWinnerOdds("soccer_epl", "uk");
    expect(events[0].bookmakers.map((b) => b.bookmakerKey)).toEqual(["book_a"]);
  });

  it("asks for one market, one region and decimal odds", async () => {
    const { fn, calls } = fakeFetch(ODDS);
    await new TheOddsApiProvider(FAKE_KEY, fn).getMatchWinnerOdds("soccer_epl", "eu");
    const url = new URL(calls[0]);
    expect(url.pathname).toBe("/v4/sports/soccer_epl/odds");
    expect(url.searchParams.get("markets")).toBe("h2h");
    expect(url.searchParams.get("regions")).toBe("eu");
    expect(url.searchParams.get("oddsFormat")).toBe("decimal");
  });

  it("rejects a malformed reply", async () => {
    const { fn } = fakeFetch([{ id: "x", bookmakers: "not a list" }]);
    await expect(new TheOddsApiProvider(FAKE_KEY, fn).getMatchWinnerOdds("soccer_epl", "uk")).rejects.toThrow();
  });

  it("rejects an impossible price", async () => {
    const bad = structuredClone(ODDS);
    bad[0].bookmakers[0].markets[0].outcomes[0].price = 0.9;
    const { fn } = fakeFetch(bad);
    await expect(new TheOddsApiProvider(FAKE_KEY, fn).getMatchWinnerOdds("soccer_epl", "uk")).rejects.toThrow();
  });

  it("never puts the key in an error message", async () => {
    const { fn } = fakeFetch({ message: "nope" }, 401);
    const error = await new TheOddsApiProvider(FAKE_KEY, fn).getEvents("soccer_epl").catch((e: Error) => e);
    expect(error).toBeInstanceOf(Error);
    expect((error as Error).message).toContain("HTTP 401");
    expect((error as Error).message).not.toContain(FAKE_KEY);
  });

  it("refuses to start without a key", () => {
    expect(() => new TheOddsApiProvider("")).toThrow(/ODDS_API_KEY/);
  });
});
