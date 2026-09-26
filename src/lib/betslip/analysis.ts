/**
 * Placeholder "Analyse Bet" content. Clicking Analyse Bet does not place any
 * bet or move any money — it previews the flow the real analysis engine
 * will follow (lib/ai, once built): a short note per leg, and a note on the
 * whole slip. Nothing here calls Claude or any provider; it's built from
 * the selections already sitting in the browser.
 */

import type { BetslipSelection } from "./types";
import { checkCorrelation, combinedPrice } from "./combine";

export interface LegAnalysis {
  fixtureId: string;
  text: string;
}

export interface SlipAnalysis {
  legs: LegAnalysis[];
  combinedPrice: number;
  correlationWarning: string | null;
  overall: string;
}

function legAnalysisText(selection: BetslipSelection): string {
  return (
    `Sample analysis: ${selection.homeTeam} v ${selection.awayTeam}, ${selection.marketLabel} — ` +
    `${selection.outcome} @ ${selection.price.toFixed(2)} (${selection.bookmaker}). The full version ` +
    `will pull this fixture's recent form, head-to-head record and match stats and have Claude ` +
    `summarise them here — for now this is placeholder text so the flow can be reviewed before that's built.`
  );
}

export function buildSlipAnalysis(selections: readonly BetslipSelection[]): SlipAnalysis {
  const legs = selections.map((s) => ({ fixtureId: s.fixtureId, text: legAnalysisText(s) }));
  const correlation = checkCorrelation(selections);

  const correlationWarning = correlation.correlated
    ? correlation.sharedFixtures.length > 0
      ? "More than one selection is from the same match (different markets) — those outcomes are not independent, so treat any combined chance as uncertain, not as a fact."
      : `${correlation.sharedTeams.join(", ")} ${correlation.sharedTeams.length > 1 ? "appear" : "appears"} in more than one selection. These legs are not independent, so treat any combined chance as uncertain, not as a fact.`
    : null;

  const overall = correlation.correlated
    ? "Sample analysis: this slip's legs may be correlated (see the warning above) — we're not showing a combined chance of winning, only the combined price the accumulator would pay."
    : `Sample analysis: ${selections.length} independent-looking selection${selections.length === 1 ? "" : "s"}. The combined price is what the accumulator pays if every leg wins — it is not a chance of that happening.`;

  return {
    legs,
    combinedPrice: combinedPrice(selections.map((s) => s.price)),
    correlationWarning,
    overall,
  };
}
