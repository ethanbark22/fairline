/**
 * "What if you had followed the model?" Places a pretend £1 bet on every
 * outcome whose price was at or above the model's minimum price, and adds up
 * the profit or loss. For research only; past results do not predict future ones.
 */
import type { OutcomeProbabilities } from "@/lib/models/football/poisson";
import { minimumPrice, priceQualifies } from "@/lib/value/value";
import type { Outcome } from "./walk-forward";

export interface PricedForecast {
  probabilities: OutcomeProbabilities;
  prices: Record<Outcome, number>;
  outcome: Outcome;
}

export interface ValueBetSummary {
  bets: number;
  wins: number;
  /** Total profit in £ from £1 stakes. */
  profit: number;
  /** Profit per £1 staked (0.05 = 5% return). */
  roi: number;
}

const OUTCOMES: Outcome[] = ["home", "draw", "away"];

export function simulateValueBets(forecasts: readonly PricedForecast[], requiredEdge: number): ValueBetSummary {
  let bets = 0;
  let wins = 0;
  let profit = 0;
  for (const f of forecasts) {
    for (const o of OUTCOMES) {
      // A chance smaller than the required edge can never qualify.
      if (f.probabilities[o] <= requiredEdge) continue;
      const minimum = minimumPrice(f.probabilities[o], requiredEdge);
      if (!priceQualifies(f.prices[o], minimum)) continue;
      bets += 1;
      if (f.outcome === o) {
        wins += 1;
        profit += f.prices[o] - 1;
      } else {
        profit -= 1;
      }
    }
  }
  return { bets, wins, profit, roi: bets === 0 ? 0 : profit / bets };
}
