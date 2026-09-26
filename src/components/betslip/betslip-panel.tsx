"use client";

import { useState } from "react";
import { useBetslip } from "./betslip-context";
import { buildSlipAnalysis, type SlipAnalysis } from "@/lib/betslip/analysis";
import { checkCorrelation, combinedPrice, type CorrelationCheck } from "@/lib/betslip/combine";
import type { BetslipSelection } from "@/lib/betslip/types";
import type { MarketKey } from "@/lib/providers/odds/types";
import { formatKickoff, formatPrice } from "@/lib/format";

interface AnalysisState {
  /** The selections this analysis was generated from, by reference — used only to tell whether the slip has changed since. */
  selections: BetslipSelection[];
  result: SlipAnalysis;
}

function legKey(s: BetslipSelection): string {
  return `${s.fixtureId}:${s.market}`;
}

/**
 * The betslip: a fixed sidebar on desktop, a slide-up sheet from a bottom
 * bar on narrow screens. Multiple selections combine as an accumulator.
 * "Analyse Bet" never places a bet or moves money — see lib/betslip/analysis.ts.
 */
export function BetslipPanel() {
  const { selections, removeSelection, clear } = useBetslip();
  const [analysisState, setAnalysisState] = useState<AnalysisState | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Any change to the slip — adding, removing or swapping a leg — gives a
  // new `selections` array from the betslip context, so a stored analysis
  // for an older array is stale and simply stops matching here. No effect
  // needed: this is a plain derived value.
  const analysis = analysisState && analysisState.selections === selections ? analysisState.result : null;

  function handleAnalyse() {
    setAnalysisState({ selections, result: buildSlipAnalysis(selections) });
  }

  const correlation = checkCorrelation(selections);
  const price = selections.length > 0 ? combinedPrice(selections.map((s) => s.price)) : null;

  const body = (
    <BetslipBody
      selections={selections}
      analysis={analysis}
      correlation={correlation}
      combined={price}
      onRemove={removeSelection}
      onClear={clear}
      onAnalyse={handleAnalyse}
    />
  );

  return (
    <>
      <aside className="hidden lg:fixed lg:top-0 lg:right-0 lg:bottom-0 lg:flex lg:w-80 lg:flex-col lg:overflow-y-auto lg:border-l lg:border-line lg:bg-surface">
        {body}
      </aside>

      <div className="lg:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-between border-t border-line bg-surface px-4 py-3 text-sm"
        >
          <span className="flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-brand" />
            {selections.length === 0
              ? "Betslip · no selections"
              : `Betslip · ${selections.length} selection${selections.length === 1 ? "" : "s"}`}
          </span>
          {price !== null && <span className="font-display font-semibold tabular-nums">{formatPrice(price)}</span>}
        </button>

        {mobileOpen && (
          <div className="fixed inset-0 z-50 flex flex-col bg-surface">
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <span className="font-display font-semibold">Betslip</span>
              <button type="button" onClick={() => setMobileOpen(false)} className="text-sm text-brand underline">
                Close
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">{body}</div>
          </div>
        )}
      </div>
    </>
  );
}

function BetslipBody({
  selections,
  analysis,
  correlation,
  combined,
  onRemove,
  onClear,
  onAnalyse,
}: {
  selections: BetslipSelection[];
  analysis: SlipAnalysis | null;
  correlation: CorrelationCheck;
  combined: number | null;
  onRemove: (fixtureId: string, market: MarketKey) => void;
  onClear: () => void;
  onAnalyse: () => void;
}) {
  return (
    <div className="flex flex-1 flex-col p-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold">Betslip</h2>
        {selections.length > 0 && (
          <button type="button" onClick={onClear} className="text-xs text-muted underline hover:text-foreground">
            Clear all
          </button>
        )}
      </div>

      {selections.length === 0 ? (
        <p className="mt-4 text-sm text-muted">
          Click a price on the fixtures list or a match page to add it here.
        </p>
      ) : (
        <ul className="mt-4 flex flex-col gap-3">
          {selections.map((s) => (
            <li key={legKey(s)} className="rounded-lg border border-line bg-surface-2 p-3 text-sm">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium">
                    {s.homeTeam} v {s.awayTeam}
                  </p>
                  <p className="text-xs text-muted">{formatKickoff(s.kickoff)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => onRemove(s.fixtureId, s.market)}
                  aria-label={`Remove ${s.homeTeam} v ${s.awayTeam} from the betslip`}
                  className="text-muted hover:text-danger"
                >
                  ✕
                </button>
              </div>
              <p className="mt-1 text-xs text-muted">{s.marketLabel}</p>
              <p className="font-display font-medium">
                {s.outcome} @ {formatPrice(s.price)} <span className="text-xs text-muted">({s.bookmaker})</span>
              </p>
            </li>
          ))}
        </ul>
      )}

      {selections.length > 0 && combined !== null && (
        <div className="mt-4 border-t border-line pt-4">
          <div className="flex items-center justify-between text-sm">
            <span>{selections.length === 1 ? "Price" : "Combined price (accumulator)"}</span>
            <span className="font-display text-base font-semibold tabular-nums">{formatPrice(combined)}</span>
          </div>

          {correlation.correlated && (
            <p className="mt-2 rounded-md border border-warning/40 bg-warning-bg p-2 text-xs text-warning">
              {correlation.sharedFixtures.length > 0
                ? "More than one selection is from the same match — these aren't independent. The combined price above is still correct, but don't treat any combined chance of winning as a precise number."
                : `${correlation.sharedTeams.join(", ")} ${correlation.sharedTeams.length === 1 ? "appears" : "appear"} in more than one selection. These legs may be correlated — the combined price above is still correct, but don't treat any combined chance of winning as a precise number.`}
            </p>
          )}

          <button
            type="button"
            onClick={onAnalyse}
            className="mt-3 w-full rounded-lg bg-brand py-2.5 text-sm font-semibold text-brand-foreground transition hover:brightness-110"
          >
            Analyse Bet
          </button>
          <p className="mt-1 text-center text-[11px] text-muted">
            Analysis only — this does not place a bet or move any money.
          </p>
        </div>
      )}

      {analysis && (
        <div className="mt-4 rounded-lg border border-line bg-surface-2 p-3 text-sm">
          <p className="text-xs font-medium tracking-wide text-muted uppercase">
            Sample analysis — placeholder text, not a real Claude call yet
          </p>
          {analysis.correlationWarning && (
            <p className="mt-2 rounded-md border border-warning/40 bg-warning-bg p-2 text-xs text-warning">
              {analysis.correlationWarning}
            </p>
          )}
          <ul className="mt-2 flex flex-col gap-2 text-foreground/90">
            {analysis.legs.map((leg, i) => (
              <li key={i}>{leg.text}</li>
            ))}
          </ul>
          <p className="mt-2 font-medium">{analysis.overall}</p>
        </div>
      )}

      <p className="mt-auto pt-4 text-[11px] text-muted">
        18+ only. Fairline does not take bets or hold money — Analyse Bet never places a real bet.
      </p>
    </div>
  );
}
