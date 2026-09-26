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
      <h1 className="text-3xl font-semibold">Fairline</h1>
      <p className="mt-2 text-sm opacity-80">
        Recent form, head-to-head and match stats next to the bookmaker prices. Research and price
        comparison only — Fairline does not take bets and cannot know results.
      </p>

      <div className="mt-6">
        <SampleDataBanner />
      </div>

      <h2 className="mt-8 text-lg font-semibold">Premier League</h2>
      <p className="text-xs opacity-60">
        Click a price to add it to your betslip. Prices are the best UK price per outcome — see
        each match page for Pinnacle&apos;s fair price and how it has moved.
      </p>

      <ul className="mt-4 flex flex-col gap-3">
        {fixtures.map((fixture) => (
          <li
            key={fixture.fixtureId}
            className="rounded-lg border border-current/20 p-4 transition hover:border-current/40"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <Link href={`/matches/${fixture.fixtureId}`} className="text-base font-medium hover:underline">
                {fixture.homeTeam} v {fixture.awayTeam}
              </Link>
              <span className="text-sm opacity-70">{formatKickoff(fixture.kickoff)}</span>
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
                    outcome: o.outcome,
                    price: o.bestUk.price,
                    bookmaker: o.bestUk.bookmaker,
                  }}
                />
              ))}
            </div>
            <div className="mt-1.5 grid grid-cols-3 gap-2 text-center text-[11px] opacity-50">
              {fixture.outcomes.map((o) => (
                <span key={o.outcome}>
                  {o.bestUk.bookmaker} · fair {formatPrice(o.fairPrice)}
                </span>
              ))}
            </div>

            <Link
              href={`/matches/${fixture.fixtureId}`}
              className="mt-3 inline-block text-sm underline opacity-80"
            >
              View form, head-to-head and stats →
            </Link>
          </li>
        ))}
      </ul>

      <ResponsibleGamblingFooter />
    </main>
  );
}
