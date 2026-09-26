"use client";

import { useState } from "react";
import { PriceButton } from "@/components/betslip/price-button";
import type { MatchMarketView } from "@/lib/match/get-match-view";
import { formatCapturedAt, formatPct, formatPrice, formatSignedPct } from "@/lib/format";

interface FixtureIdentity {
  fixtureId: string;
  competition: string;
  homeTeam: string;
  awayTeam: string;
  kickoff: string;
}

/** Match Winner, Total Corners, Total Cards — one price table at a time, switched by tab. */
export function MarketTabs({ markets, fixture }: { markets: MatchMarketView[]; fixture: FixtureIdentity }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = markets[activeIndex];

  return (
    <div>
      <div className="flex gap-1 border-b border-line">
        {markets.map((m, i) => (
          <button
            key={m.market}
            type="button"
            onClick={() => setActiveIndex(i)}
            className={`rounded-t-md px-3 py-2 text-sm font-medium transition ${
              i === activeIndex
                ? "border-b-2 border-brand text-foreground"
                : "text-muted hover:text-foreground"
            }`}
          >
            {m.marketLabel}
            {m.line !== undefined && <span className="ml-1 text-xs text-muted">O/U {m.line}</span>}
          </button>
        ))}
      </div>

      <p className="mt-3 text-sm text-muted">
        Pinnacle&apos;s margin on this market is {formatPct(active.pinnacleMarginPct)}. Its fair
        price below has that margin removed — a reference point, not a prediction.
      </p>

      <table className="mt-3 w-full text-left text-sm">
        <thead>
          <tr className="border-b border-line text-muted">
            <th className="py-1.5 font-normal">Outcome</th>
            <th className="py-1.5 font-normal">Best UK price</th>
            <th className="py-1.5 font-normal">Pinnacle fair price</th>
            <th className="py-1.5 font-normal">Price movement</th>
          </tr>
        </thead>
        <tbody>
          {active.outcomes.map((o) => (
            <tr key={o.outcome} className="border-b border-line/60 last:border-0">
              <td className="py-2 align-top font-medium">{o.outcome}</td>
              <td className="py-2 align-top">
                <div className="w-28">
                  <PriceButton
                    selection={{
                      fixtureId: fixture.fixtureId,
                      competition: fixture.competition,
                      homeTeam: fixture.homeTeam,
                      awayTeam: fixture.awayTeam,
                      kickoff: fixture.kickoff,
                      market: active.market,
                      marketLabel: active.line !== undefined ? `${active.marketLabel} O/U ${active.line}` : active.marketLabel,
                      outcome: o.outcome,
                      price: o.bestUk.price,
                      bookmaker: o.bestUk.bookmaker,
                    }}
                  />
                </div>
                <div className="mt-1 text-xs text-muted">
                  {o.bestUk.bookmaker} · captured {formatCapturedAt(o.bestUk.capturedAt)}
                </div>
              </td>
              <td className="py-2 align-top">
                {formatPrice(o.fairPrice)}
                <div className="text-xs text-muted">{formatPct(o.fairProbability)} fair chance</div>
              </td>
              <td className="py-2 align-top">
                {formatPrice(o.openingPrice)} → {formatPrice(o.currentPrice)}
                <div className="text-xs text-muted">
                  {o.direction === "unchanged"
                    ? "unchanged"
                    : `${o.direction === "up" ? "drifted out" : "shortened"} (${formatSignedPct(o.changePct)})`}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
