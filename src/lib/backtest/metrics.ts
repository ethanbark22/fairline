/**
 * Scoring for probability forecasts of home / draw / away.
 * Lower log loss and Brier score are better; a perfect forecaster scores 0.
 */
import type { OutcomeProbabilities } from "@/lib/models/football/poisson";
import type { Outcome } from "./walk-forward";

export interface ScoredForecast {
  probabilities: OutcomeProbabilities;
  outcome: Outcome;
}

const OUTCOMES: Outcome[] = ["home", "draw", "away"];

/** Average of -ln(probability given to what actually happened). */
export function logLoss(forecasts: readonly ScoredForecast[]): number {
  assertNotEmpty(forecasts);
  const total = forecasts.reduce((sum, f) => sum - Math.log(f.probabilities[f.outcome]), 0);
  return total / forecasts.length;
}

/** Average squared error over the three outcomes (0 = perfect, 2 = worst). */
export function brierScore(forecasts: readonly ScoredForecast[]): number {
  assertNotEmpty(forecasts);
  const total = forecasts.reduce(
    (sum, f) => sum + OUTCOMES.reduce((s, o) => s + (f.probabilities[o] - (f.outcome === o ? 1 : 0)) ** 2, 0),
    0,
  );
  return total / forecasts.length;
}

/** Share of matches where the outcome rated most likely actually happened. */
export function accuracy(forecasts: readonly ScoredForecast[]): number {
  assertNotEmpty(forecasts);
  const hits = forecasts.filter((f) => mostLikely(f.probabilities) === f.outcome).length;
  return hits / forecasts.length;
}

export function mostLikely(p: OutcomeProbabilities): Outcome {
  return OUTCOMES.reduce((best, o) => (p[o] > p[best] ? o : best), "home" as Outcome);
}

export interface CalibrationBin {
  from: number;
  to: number;
  count: number;
  /** Average probability we gave. */
  predicted: number;
  /** How often it actually happened. */
  actual: number;
}

/**
 * Calibration: groups every probability given (all three outcomes of every
 * match) into bands, and compares the average forecast in each band with how
 * often those outcomes happened. Well calibrated means the two are close.
 */
export function calibration(forecasts: readonly ScoredForecast[], binWidth = 0.1): CalibrationBin[] {
  const binCount = Math.round(1 / binWidth);
  const bins = Array.from({ length: binCount }, (_, i) => ({ sumP: 0, hits: 0, count: 0, i }));
  for (const f of forecasts) {
    for (const o of OUTCOMES) {
      const p = f.probabilities[o];
      const bin = bins[Math.min(binCount - 1, Math.floor(p / binWidth))];
      bin.sumP += p;
      bin.hits += f.outcome === o ? 1 : 0;
      bin.count += 1;
    }
  }
  return bins
    .filter((b) => b.count > 0)
    .map((b) => ({
      from: b.i * binWidth,
      to: (b.i + 1) * binWidth,
      count: b.count,
      predicted: b.sumP / b.count,
      actual: b.hits / b.count,
    }));
}

/** Average gap between forecast and reality across bands, weighted by size. */
export function calibrationError(bins: readonly CalibrationBin[]): number {
  const total = bins.reduce((s, b) => s + b.count, 0);
  return bins.reduce((s, b) => s + (b.count / total) * Math.abs(b.predicted - b.actual), 0);
}

function assertNotEmpty(forecasts: readonly unknown[]): void {
  if (forecasts.length === 0) throw new RangeError("Need at least one forecast");
}
