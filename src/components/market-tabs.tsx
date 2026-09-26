"use client";

import { useState } from "react";
import { PriceButton } from "@/components/betslip/price-button";
import type { MatchMarketView } from "@/lib/match/get-match-view";
import { formatPrice } from "@/lib/format";

interface FixtureIdentity {
  fixtureId: string;
  competition: string;
  homeTeam: string;
  awayTeam: string;
  kickoff: string;
}

/** Match Winner, Total Corners, Total Cards — one set of price buttons at a time, switched by tab. */
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

      <div className={`mt-3 grid gap-2 ${active.outcomes.length === 3 ? "grid-cols-3" : "grid-cols-2"}`}>
        {active.outcomes.map((o) => (
          <PriceButton
            key={o.outcome}
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
        ))}
      </div>
      <div
        className={`mt-1.5 grid gap-2 text-center text-[11px] text-muted ${active.outcomes.length === 3 ? "grid-cols-3" : "grid-cols-2"}`}
      >
        {active.outcomes.map((o) => (
          <span key={o.outcome}>{o.bestUk.bookmaker}</span>
        ))}
      </div>

      <details className="mt-4 text-xs text-muted">
        <summary className="cursor-pointer select-none">Price detail (Pinnacle fair price)</summary>
        <p className="mt-2">
          A smaller, secondary detail — not the point of this page. Pinnacle is a bookmaker often used
          as a reference price; removing its built-in margin ({(active.pinnacleMarginPct * 100).toFixed(1)}%
          on this market) gives a &quot;fair&quot; price, shown below next to the best UK price for the same
          outcome. This is a fact about the market, not a prediction, and it is not a chance of winning.
        </p>
        <ul className="mt-2 flex flex-col gap-1">
          {active.outcomes.map((o) => (
            <li key={o.outcome} className="flex justify-between">
              <span>{o.outcome}</span>
              <span>
                best UK {formatPrice(o.bestUk.price)} · Pinnacle fair {formatPrice(o.fairPrice)}
              </span>
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
}
