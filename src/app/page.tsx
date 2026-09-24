import Link from "next/link";
import { listFixtures } from "@/lib/match/get-match-view";
import { SampleDataBanner } from "@/components/sample-data-banner";
import { ResponsibleGamblingFooter } from "@/components/responsible-gambling-footer";
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

      <h2 className="mt-8 text-lg font-semibold">Premier League fixtures</h2>

      <ul className="mt-4 flex flex-col gap-4">
        {fixtures.map((fixture) => (
          <li
            key={fixture.fixtureId}
            className="rounded-lg border border-current/20 p-5 transition hover:border-current/40"
          >
            <Link href={`/matches/${fixture.fixtureId}`} className="block">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="text-base font-medium">
                  {fixture.homeTeam} v {fixture.awayTeam}
                </span>
                <span className="text-sm opacity-70">{formatKickoff(fixture.kickoff)}</span>
              </div>

              <table className="mt-4 w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-current/20 opacity-70">
                    <th className="py-1 font-normal">Outcome</th>
                    <th className="py-1 font-normal">Best UK price</th>
                    <th className="py-1 font-normal">Pinnacle fair price</th>
                  </tr>
                </thead>
                <tbody>
                  {fixture.outcomes.map((o) => (
                    <tr key={o.outcome} className="border-b border-current/10 last:border-0">
                      <td className="py-1.5">{o.outcome}</td>
                      <td className="py-1.5">
                        {formatPrice(o.bestUk.price)}{" "}
                        <span className="opacity-60">({o.bestUk.bookmaker})</span>
                      </td>
                      <td className="py-1.5">{formatPrice(o.fairPrice)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <span className="mt-3 inline-block text-sm underline opacity-80">
                View form, head-to-head and stats →
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <ResponsibleGamblingFooter />
    </main>
  );
}
