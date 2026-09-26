/**
 * Compares the best UK bookmaker price for each outcome with Pinnacle's fair
 * price (Pinnacle's price with its margin removed). Pinnacle is used as the
 * reference because it is widely seen as the most accurate bookmaker.
 */
import type { Outcome } from "@/lib/backtest/walk-forward";
import type { BookmakerPrices, EventOdds } from "@/lib/providers/odds/types";
import { bookmakerMargin, expectedValue, fairPrice, removeMargin, removeMarginPower } from "@/lib/value/value";

export const REFERENCE_BOOKMAKER = "pinnacle";

/**
 * Betting exchanges: people bet against each other and the exchange takes a
 * commission on winnings, so their raw prices are not comparable with a
 * bookmaker's. Left out of the "best UK bookmaker" comparison.
 */
export const EXCHANGE_KEYS = new Set(["betfair_ex_uk", "betfair_ex_eu", "smarkets", "matchbook"]);

const OUTCOMES: Outcome[] = ["home", "draw", "away"];

export interface Comparison {
  providerEventId: string;
  commenceTime: string;
  homeTeam: string;
  awayTeam: string;
  outcome: Outcome;
  pinnaclePrice: number;
  pinnacleMargin: number;
  pinnacleLastUpdate: string;
  fairProbability: number;
  fairPrice: number;
  /** Fair probability from the power method, as a second opinion. */
  fairProbabilityPower: number;
  bestUk: { bookmakerKey: string; bookmakerTitle: string; price: number; lastUpdate: string };
  /** Best UK price x fair probability - 1. */
  expectedValue: number;
  /** The same, using the power method's fair probability. */
  expectedValuePower: number;
  /** How many UK bookmakers priced this outcome. */
  ukBookmakers: number;
}

export interface ComparisonResult {
  comparisons: Comparison[];
  /** Fixtures left out, and why. */
  skipped: { fixture: string; reason: string }[];
}

export function compareWithPinnacle(
  ukEvents: readonly EventOdds[],
  referenceEvents: readonly EventOdds[],
  now: Date = new Date(),
): ComparisonResult {
  const referenceById = new Map(referenceEvents.map((e) => [e.providerEventId, e]));
  const comparisons: Comparison[] = [];
  const skipped: ComparisonResult["skipped"] = [];

  for (const event of ukEvents) {
    const fixture = `${event.homeTeam} v ${event.awayTeam}`;
    if (new Date(event.commenceTime) <= now) {
      skipped.push({ fixture, reason: "already started" });
      continue;
    }
    const pinnacle = referenceById
      .get(event.providerEventId)
      ?.bookmakers.find((b) => b.bookmakerKey === REFERENCE_BOOKMAKER);
    if (!pinnacle) {
      skipped.push({ fixture, reason: "no Pinnacle price" });
      continue;
    }
    const books = event.bookmakers.filter((b) => !EXCHANGE_KEYS.has(b.bookmakerKey));
    if (books.length === 0) {
      skipped.push({ fixture, reason: "no UK bookmaker prices" });
      continue;
    }

    const pinnaclePrices = OUTCOMES.map((o) => pinnacle.prices[o]);
    const fair = removeMargin(pinnaclePrices);
    const fairPower = removeMarginPower(pinnaclePrices);
    const margin = bookmakerMargin(pinnaclePrices);

    OUTCOMES.forEach((outcome, i) => {
      const best = bestPrice(books, outcome);
      comparisons.push({
        providerEventId: event.providerEventId,
        commenceTime: event.commenceTime,
        homeTeam: event.homeTeam,
        awayTeam: event.awayTeam,
        outcome,
        pinnaclePrice: pinnacle.prices[outcome],
        pinnacleMargin: margin,
        pinnacleLastUpdate: pinnacle.lastUpdate,
        fairProbability: fair[i],
        fairPrice: fairPrice(fair[i]),
        fairProbabilityPower: fairPower[i],
        bestUk: {
          bookmakerKey: best.bookmakerKey,
          bookmakerTitle: best.bookmakerTitle,
          price: best.prices[outcome],
          lastUpdate: best.lastUpdate,
        },
        expectedValue: expectedValue(best.prices[outcome], fair[i]),
        expectedValuePower: expectedValue(best.prices[outcome], fairPower[i]),
        ukBookmakers: books.length,
      });
    });
  }
  return { comparisons, skipped };
}

/** Highest price for the outcome; ties go to the bookmaker whose price is most recent. */
function bestPrice(books: readonly BookmakerPrices[], outcome: Outcome): BookmakerPrices {
  return books.reduce((best, b) =>
    b.prices[outcome] > best.prices[outcome] ||
    (b.prices[outcome] === best.prices[outcome] && b.lastUpdate > best.lastUpdate)
      ? b
      : best,
  );
}
