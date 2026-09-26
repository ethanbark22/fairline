import Link from "next/link";
import { listFixtures } from "@/lib/match/get-match-view";
import { SampleDataBanner } from "@/components/sample-data-banner";
import { ResponsibleGamblingFooter } from "@/components/responsible-gambling-footer";
import { PriceButton } from "@/components/betslip/price-button";
import { formatKickoff, formatPrice } from "@/lib/format";

export default async function FixturesPage() {
  const fixtures = await listFixtures();

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
      <h1 className="font-display text-3xl font-semibold">
        Fair<span className="text-brand">line</span>
      </h1>
      <p className="mt-2 text-sm text-muted">
        Recent form, head-to-head and match stats next to the bookmaker prices. Research and price
        comparison only — Fairline does not take bets and cannot know results.
      </p>

      <div className="mt-6">
        <SampleDataBanner />
      </div>

      <h2 className="mt-8 font-display text-lg font-semibold">Premier League</h2>
      <p className="text-xs text-muted">
        Click a price to add it to your betslip. Prices are the best UK price per outcome — see
        each match page for Pinnacle&apos;s fair price, how it has moved, and the corners and
        cards markets.
      </p>

      <ul className="mt-4 flex flex-col gap-3">
        {fixtures.map((fixture) => (
          <li
            key={fixture.fixtureId}
            className="rounded-xl border border-line bg-surface p-4 shadow-sm transition hover:border-brand/50"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <Link
                href={`/matches/${fixture.fixtureId}`}
                className="font-display text-base font-medium hover:text-brand"
              >
                {fixture.homeTeam} v {fixture.awayTeam}
              </Link>
              <span className="text-sm text-muted">{formatKickoff(fixture.kickoff)}</span>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2">
              {fixture.outcomes.map((o) => (
                <PriceButton
                  key={o.outcome}
                  selection={{
                    fixtureId: fixture.fixtureId,
                    competition: fixture.competition,
                    homeTeam: fixture.homeTeam,
                    awayTeam: fixture.awayTeam,
                    kickoff: fixture.kickoff,
                    market: "match_winner",
                    marketLabel: "Match Winner",
                    outcome: o.outcome,
                    price: o.bestUk.price,
                    bookmaker: o.bestUk.bookmaker,
                  }}
                />
              ))}
            </div>
            <div className="mt-1.5 grid grid-cols-3 gap-2 text-center text-[11px] text-muted">
              {fixture.outcomes.map((o) => (
                <span key={o.outcome}>
                  {o.bestUk.bookmaker} · fair {formatPrice(o.fairPrice)}
                </span>
              ))}
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap gap-1.5">
                {fixture.otherMarketLabels.map((label) => (
                  <span
                    key={label}
                    className="rounded-full border border-line bg-surface-2 px-2 py-0.5 text-[11px] text-muted"
                  >
                    {label}
                  </span>
                ))}
              </div>
              <Link href={`/matches/${fixture.fixtureId}`} className="text-sm text-brand underline">
                Form, head-to-head &amp; stats →
              </Link>
            </div>
          </li>
        ))}
      </ul>

      <ResponsibleGamblingFooter />
    </main>
  );
}
