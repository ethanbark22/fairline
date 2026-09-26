import { describe, expect, it } from "vitest";
import type { EventOdds } from "@/lib/providers/odds/types";
import { removeMargin } from "@/lib/value/value";
import { compareWithPinnacle } from "./compare-with-pinnacle";

const NOW = new Date("2030-01-01T00:00:00Z");
const base = { providerEventId: "evt1", commenceTime: "2030-01-02T15:00:00Z", homeTeam: "Home FC", awayTeam: "Away United" };
const book = (key: string, home: number, draw: number, away: number, lastUpdate = "2030-01-01T00:00:00Z") => ({
  bookmakerKey: key,
  bookmakerTitle: key.toUpperCase(),
  lastUpdate,
  prices: { home, draw, away },
});

// Made-up Pinnacle prices: 2.00 / 3.60 / 4.00 (margin about 5.8%).
const PINNACLE: EventOdds[] = [{ ...base, bookmakers: [book("pinnacle", 2.0, 3.6, 4.0)] }];
const UK: EventOdds[] = [
  {
    ...base,
    bookmakers: [
      book("book_a", 2.1, 3.4, 3.6),
      book("book_b", 1.95, 3.5, 3.9),
      book("betfair_ex_uk", 2.5, 4.5, 5.0), // exchange: must be ignored
    ],
  },
];

describe("compareWithPinnacle", () => {
  const { comparisons, skipped } = compareWithPinnacle(UK, PINNACLE, NOW);
  const home = comparisons.find((c) => c.outcome === "home")!;

  it("makes one comparison per outcome", () => {
    expect(comparisons.map((c) => c.outcome)).toEqual(["home", "draw", "away"]);
    expect(skipped).toEqual([]);
  });

  it("removes Pinnacle's margin to get the fair price", () => {
    const fair = removeMargin([2.0, 3.6, 4.0]);
    expect(home.fairProbability).toBeCloseTo(fair[0], 12);
    expect(home.fairPrice).toBeCloseTo(1 / fair[0], 12);
    expect(home.fairPrice).toBeGreaterThan(2.0);
  });

  it("picks the best UK bookmaker price, ignoring exchanges", () => {
    expect(home.bestUk).toMatchObject({ bookmakerKey: "book_a", price: 2.1 });
    const away = comparisons.find((c) => c.outcome === "away")!;
    expect(away.bestUk).toMatchObject({ bookmakerKey: "book_b", price: 3.9 });
  });

  it("works out expected value as best price x fair probability - 1", () => {
    expect(home.expectedValue).toBeCloseTo(2.1 * home.fairProbability - 1, 12);
    expect(home.expectedValue).toBeGreaterThan(0); // 2.10 beats the fair price of about 2.06
  });

  it("gives negative expected value when the UK price is below the fair price", () => {
    const draw = comparisons.find((c) => c.outcome === "draw")!;
    expect(draw.bestUk.price).toBeLessThan(draw.fairPrice);
    expect(draw.expectedValue).toBeLessThan(0);
  });

  it("skips fixtures with no Pinnacle price or that have already started", () => {
    const started = [{ ...UK[0], commenceTime: "2029-12-31T15:00:00Z" }];
    expect(compareWithPinnacle(started, PINNACLE, NOW).skipped[0].reason).toBe("already started");
    expect(compareWithPinnacle(UK, [], NOW).skipped[0].reason).toBe("no Pinnacle price");
  });
});
