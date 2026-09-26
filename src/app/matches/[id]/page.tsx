import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getMatchView, type TeamMatchView } from "@/lib/match/get-match-view";
import { SampleDataBanner } from "@/components/sample-data-banner";
import { ResponsibleGamblingFooter } from "@/components/responsible-gambling-footer";
import { MarketTabs } from "@/components/market-tabs";
import { formatKickoff } from "@/lib/format";

export default async function MatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const match = await getMatchView(id);
  if (!match) notFound();

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
      <Link href="/" className="text-sm text-brand underline">
        ← All fixtures
      </Link>

      <h1 className="mt-3 font-display text-2xl font-semibold">
        {match.home.teamName} v {match.away.teamName}
      </h1>
      <p className="mt-1 text-sm text-muted">
        {match.competition} · {formatKickoff(match.kickoff)}
      </p>

      <div className="mt-6">
        <SampleDataBanner />
      </div>

      <Section title="Recent form">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <TeamFormCard team={match.home} />
          <TeamFormCard team={match.away} />
        </div>
      </Section>

      <Section title="Head-to-head">
        <p className="text-sm">
          <span className="font-display font-medium">
            {match.headToHead.record.teamAWins}–{match.headToHead.record.draws}–
            {match.headToHead.record.teamBWins}
          </span>{" "}
          ({match.home.teamName}–draws–{match.away.teamName}), based on the{" "}
          <span className="font-medium">{match.headToHead.sampleDescription}</span>.
        </p>
        <ul className="mt-3 flex flex-col gap-1.5 text-sm">
          {match.headToHead.meetings.map((m) => (
            <li key={m.date} className="flex justify-between border-b border-line/60 py-1">
              <span className="text-muted">{m.date}</span>
              <span>
                {m.homeTeam} {m.homeGoals}–{m.awayGoals} {m.awayTeam}
              </span>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Match stats">
        <p className="text-xs text-muted">
          Averages from the {match.home.stats.sampleDescription} for each team.
        </p>
        <table className="mt-3 w-full text-left text-sm">
          <thead>
            <tr className="border-b border-line text-muted">
              <th className="py-1.5 font-normal">Team</th>
              <th className="py-1.5 font-normal">Shots</th>
              <th className="py-1.5 font-normal">On target</th>
              <th className="py-1.5 font-normal">Possession</th>
              <th className="py-1.5 font-normal">Corners</th>
              <th className="py-1.5 font-normal">Cards</th>
            </tr>
          </thead>
          <tbody>
            {[match.home, match.away].map((team) => (
              <tr key={team.teamId} className="border-b border-line/60 last:border-0">
                <td className="py-2 font-medium">{team.teamName}</td>
                <td className="py-2 tabular-nums">{team.stats.shotsPerGame.toFixed(1)}</td>
                <td className="py-2 tabular-nums">{team.stats.shotsOnTargetPerGame.toFixed(1)}</td>
                <td className="py-2 tabular-nums">{team.stats.possessionPct.toFixed(0)}%</td>
                <td className="py-2 tabular-nums">{team.stats.cornersPerGame.toFixed(1)}</td>
                <td className="py-2 tabular-nums">{team.stats.cardsPerGame.toFixed(1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-2 text-xs text-muted">
          Sample size: {match.home.stats.sampleSize} matches per team.
        </p>
      </Section>

      <Section title="Prices">
        <MarketTabs
          markets={match.markets}
          fixture={{
            fixtureId: match.fixtureId,
            competition: match.competition,
            homeTeam: match.home.teamName,
            awayTeam: match.away.teamName,
            kickoff: match.kickoff,
          }}
        />
      </Section>

      <Section title="Summary">
        <div className="rounded-lg border border-line bg-surface-2 p-4">
          <p className="text-xs font-medium tracking-wide text-muted uppercase">
            Sample summary — shows the intended layout, not written by Claude in this preview
          </p>
          <p className="mt-2 font-display font-medium">{match.sampleSummary.headline}</p>
          <p className="mt-2 text-sm text-foreground/90">{match.sampleSummary.body}</p>
          <p className="mt-3 text-sm font-medium">What could go wrong</p>
          <ul className="mt-1 list-inside list-disc text-sm text-foreground/90">
            {match.sampleSummary.risks.map((risk) => (
              <li key={risk}>{risk}</li>
            ))}
          </ul>
        </div>
      </Section>

      <ResponsibleGamblingFooter />
    </main>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="font-display text-lg font-semibold">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function TeamFormCard({ team }: { team: TeamMatchView }) {
  return (
    <div>
      <p className="text-sm font-medium">{team.teamName}</p>
      <p className="text-xs text-muted">{team.form.sampleDescription}</p>
      <ul className="mt-2 flex flex-col gap-1">
        {team.form.matches.map((m, i) => (
          <li key={i} className="flex items-center gap-2 text-sm">
            <span
              className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-xs font-semibold ${
                m.result === "W"
                  ? "bg-brand/20 text-brand"
                  : m.result === "D"
                    ? "bg-muted/20 text-muted"
                    : "bg-danger/20 text-danger"
              }`}
            >
              {m.result}
            </span>
            <span className="text-foreground/80">
              {m.venue === "home" ? "v" : "@"} {m.opponent} ({m.scoreFor}-{m.scoreAgainst})
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
