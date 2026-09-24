import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getMatchView, type TeamMatchView } from "@/lib/match/get-match-view";
import { SampleDataBanner } from "@/components/sample-data-banner";
import { ResponsibleGamblingFooter } from "@/components/responsible-gambling-footer";
import {
  formatCapturedAt,
  formatKickoff,
  formatPct,
  formatPrice,
  formatSignedPct,
} from "@/lib/format";

export default async function MatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const match = await getMatchView(id);
  if (!match) notFound();

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
      <Link href="/" className="text-sm underline opacity-70">
        ← All fixtures
      </Link>

      <h1 className="mt-3 text-2xl font-semibold">
        {match.home.teamName} v {match.away.teamName}
      </h1>
      <p className="mt-1 text-sm opacity-70">
        {match.competition} · {formatKickoff(match.kickoff)}
      </p>

      <div className="mt-6">
        <SampleDataBanner />
      </div>

      <Section title="Price comparison">
        <p className="text-sm opacity-70">
          Pinnacle&apos;s margin on this match is {formatPct(match.pinnacleMarginPct)}. Its fair
          price below has that margin removed — a reference point, not a prediction.
        </p>
        <table className="mt-3 w-full text-left text-sm">
          <thead>
            <tr className="border-b border-current/20 opacity-70">
              <th className="py-1.5 font-normal">Outcome</th>
              <th className="py-1.5 font-normal">Best UK price</th>
              <th className="py-1.5 font-normal">Pinnacle fair price</th>
              <th className="py-1.5 font-normal">Price movement</th>
            </tr>
          </thead>
          <tbody>
            {match.outcomes.map((o) => (
              <tr key={o.outcome} className="border-b border-current/10 last:border-0">
                <td className="py-2 align-top font-medium">{o.outcome}</td>
                <td className="py-2 align-top">
                  {formatPrice(o.bestUk.price)}{" "}
                  <span className="opacity-60">({o.bestUk.bookmaker})</span>
                  <div className="text-xs opacity-60">
                    captured {formatCapturedAt(o.bestUk.capturedAt)}
                  </div>
                </td>
                <td className="py-2 align-top">
                  {formatPrice(o.fairPrice)}
                  <div className="text-xs opacity-60">{formatPct(o.fairProbability)} fair chance</div>
                </td>
                <td className="py-2 align-top">
                  {formatPrice(o.openingPrice)} → {formatPrice(o.currentPrice)}
                  <div className="text-xs opacity-60">
                    {o.direction === "unchanged"
                      ? "unchanged"
                      : `${o.direction === "up" ? "drifted out" : "shortened"} (${formatSignedPct(o.changePct)})`}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      <Section title="Recent form">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <TeamFormCard team={match.home} />
          <TeamFormCard team={match.away} />
        </div>
      </Section>

      <Section title="Head-to-head">
        <p className="text-sm">
          <span className="font-medium">
            {match.headToHead.record.teamAWins}–{match.headToHead.record.draws}–
            {match.headToHead.record.teamBWins}
          </span>{" "}
          ({match.home.teamName}–draws–{match.away.teamName}), based on the{" "}
          <span className="font-medium">{match.headToHead.sampleDescription}</span>.
        </p>
        <ul className="mt-3 flex flex-col gap-1.5 text-sm">
          {match.headToHead.meetings.map((m) => (
            <li key={m.date} className="flex justify-between border-b border-current/10 py-1">
              <span className="opacity-70">{m.date}</span>
              <span>
                {m.homeTeam} {m.homeGoals}–{m.awayGoals} {m.awayTeam}
              </span>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Match stats">
        <p className="text-xs opacity-60">
          Averages from the {match.home.stats.sampleDescription} for each team.
        </p>
        <table className="mt-3 w-full text-left text-sm">
          <thead>
            <tr className="border-b border-current/20 opacity-70">
              <th className="py-1.5 font-normal">Team</th>
              <th className="py-1.5 font-normal">Shots</th>
              <th className="py-1.5 font-normal">On target</th>
              <th className="py-1.5 font-normal">Possession</th>
              <th className="py-1.5 font-normal">Corners</th>
            </tr>
          </thead>
          <tbody>
            {[match.home, match.away].map((team) => (
              <tr key={team.teamId} className="border-b border-current/10 last:border-0">
                <td className="py-2 font-medium">{team.teamName}</td>
                <td className="py-2">{team.stats.shotsPerGame.toFixed(1)}</td>
                <td className="py-2">{team.stats.shotsOnTargetPerGame.toFixed(1)}</td>
                <td className="py-2">{team.stats.possessionPct.toFixed(0)}%</td>
                <td className="py-2">{team.stats.cornersPerGame.toFixed(1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-2 text-xs opacity-60">
          Sample size: {match.home.stats.sampleSize} matches per team.
        </p>
      </Section>

      <Section title="Summary">
        <div className="rounded-md border border-current/20 p-4">
          <p className="text-xs font-medium uppercase tracking-wide opacity-60">
            Sample summary — shows the intended layout, not written by Claude in this preview
          </p>
          <p className="mt-2 font-medium">{match.sampleSummary.headline}</p>
          <p className="mt-2 text-sm opacity-90">{match.sampleSummary.body}</p>
          <p className="mt-3 text-sm font-medium">What could go wrong</p>
          <ul className="mt-1 list-inside list-disc text-sm opacity-90">
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
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function TeamFormCard({ team }: { team: TeamMatchView }) {
  return (
    <div>
      <p className="text-sm font-medium">{team.teamName}</p>
      <p className="text-xs opacity-60">{team.form.sampleDescription}</p>
      <ul className="mt-2 flex flex-col gap-1">
        {team.form.matches.map((m, i) => (
          <li key={i} className="flex items-center gap-2 text-sm">
            <span
              className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-xs font-semibold ${
                m.result === "W"
                  ? "bg-emerald-500/20 text-emerald-400"
                  : m.result === "D"
                    ? "bg-slate-500/20 text-slate-300"
                    : "bg-rose-500/20 text-rose-400"
              }`}
            >
              {m.result}
            </span>
            <span className="opacity-80">
              {m.venue === "home" ? "v" : "@"} {m.opponent} ({m.scoreFor}-{m.scoreAgainst})
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
