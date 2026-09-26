import Link from "next/link";
import { getLegSummaries, type LegSummary } from "@/lib/match/get-match-view";
import { describeForm, describeHeadToHead } from "@/lib/match/plain-language";
import { checkCorrelation, combinedPrice, type CorrelationCheck } from "@/lib/betslip/combine";
import { findWeakestLeg } from "@/lib/betslip/weakest-leg";
import { parseLegsParam } from "@/lib/betslip/leg-key";
import { SampleDataBanner } from "@/components/sample-data-banner";
import { ResponsibleGamblingFooter } from "@/components/responsible-gambling-footer";
import { formatKickoff, formatPrice } from "@/lib/format";

export default async function BetslipAnalysisPage({
  searchParams,
}: {
  searchParams: Promise<{ legs?: string }>;
}) {
  const { legs: legsParam } = await searchParams;
  const keys = parseLegsParam(legsParam);
  const legs = await getLegSummaries(keys);

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
      <Link href="/" className="text-sm text-brand underline">
        ← Back to betslip
      </Link>

      <h1 className="mt-3 font-display text-2xl font-semibold">Bet analysis</h1>

      <div className="mt-6">
        <SampleDataBanner />
      </div>

      {legs.length === 0 ? (
        <div className="mt-8 rounded-lg border border-line bg-surface-2 p-6 text-sm text-muted">
          Nothing to analyse — the betslip is empty, or the link you followed is out of date.{" "}
          <Link href="/" className="text-brand underline">
            Go and pick some prices
          </Link>
          .
        </div>
      ) : (
        <AnalysedSlip legs={legs} />
      )}

      <ResponsibleGamblingFooter />
    </main>
  );
}

function toCorrelationInputs(legs: readonly LegSummary[]) {
  return legs.map((l) => ({ fixtureId: l.fixtureId, homeTeam: l.home.teamName, awayTeam: l.away.teamName }));
}

function legMatches(a: { fixtureId: string; market: string }, b: { fixtureId: string; market: string }): boolean {
  return a.fixtureId === b.fixtureId && a.market === b.market;
}

function AnalysedSlip({ legs }: { legs: LegSummary[] }) {
  const combined = combinedPrice(legs.map((l) => l.outcome.bestUk.price));
  const correlation = checkCorrelation(toCorrelationInputs(legs));
  const weakest = findWeakestLeg(legs.map((l) => ({ ...l, price: l.outcome.bestUk.price })));

  return (
    <>
      <Summary legs={legs} combined={combined} correlation={correlation} weakest={weakest} />

      <h2 className="mt-8 font-display text-lg font-semibold">
        {legs.length} selection{legs.length === 1 ? "" : "s"}
      </h2>
      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {legs.map((leg, i) => (
          <LegCard
            key={`${leg.fixtureId}:${leg.market}:${i}`}
            leg={leg}
            correlated={
              correlation.sharedFixtures.includes(leg.fixtureId) ||
              correlation.sharedTeams.includes(leg.home.teamName) ||
              correlation.sharedTeams.includes(leg.away.teamName)
            }
            weakest={weakest !== null && legMatches(weakest, leg)}
          />
        ))}
      </div>
    </>
  );
}

function Summary({
  legs,
  combined,
  correlation,
  weakest,
}: {
  legs: LegSummary[];
  combined: number;
  correlation: CorrelationCheck;
  weakest: LegSummary | null;
}) {
  return (
    <section className="mt-8 rounded-lg border border-line bg-surface p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="text-sm text-muted">
          {legs.length === 1 ? "Price" : "Combined price (accumulator)"}
        </span>
        <span className="font-display text-2xl font-semibold tabular-nums">{formatPrice(combined)}</span>
      </div>
      <p className="mt-2 text-sm">
        {legs.length === 1 ? (
          <>This selection needs to win for the bet to pay out.</>
        ) : (
          <>
            All <strong>{legs.length}</strong> selections need to win for this bet to pay out — one loss
            and the whole bet loses, the same as any other accumulator.
          </>
        )}
      </p>

      {weakest && (
        <p className="mt-3 text-sm">
          <strong>Longest price in the slip:</strong> {weakest.outcome.outcome} in {weakest.home.teamName}{" "}
          v {weakest.away.teamName} at {formatPrice(weakest.outcome.bestUk.price)}. A longer price is the
          bookmakers&apos; own way of saying an outcome is less likely — if one leg is going to let this
          slip down, this is the one to keep an eye on.
        </p>
      )}

      {correlation.correlated && (
        <p className="mt-3 rounded-md border border-warning/40 bg-warning-bg p-3 text-sm text-warning">
          {correlation.sharedFixtures.length > 0 &&
            "Some selections are from the same match, on different markets — those outcomes are not independent. "}
          {correlation.sharedTeams.length > 0 &&
            `${correlation.sharedTeams.join(", ")} ${correlation.sharedTeams.length === 1 ? "appears" : "appear"} in more than one selection. `}
          The combined price above is still correct, but don&apos;t treat any combined chance of winning as a
          precise number — look for the &quot;correlated&quot; tag on the cards below.
        </p>
      )}

      <p className="mt-3 text-xs text-muted">
        Sample analysis — placeholder text, not a real Claude call yet. No probability or edge is shown
        anywhere on this page: we have no calibrated model to back one, so this sticks to what actually
        happened and lets you judge it.
      </p>
    </section>
  );
}

function LegCard({
  leg,
  correlated,
  weakest,
}: {
  leg: LegSummary;
  correlated: boolean;
  weakest: boolean;
}) {
  return (
    <div className="flex flex-col rounded-lg border border-line bg-surface p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-display font-medium">
            {leg.home.teamName} v {leg.away.teamName}
          </p>
          <p className="text-xs text-muted">{formatKickoff(leg.kickoff)}</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          {weakest && (
            <span className="rounded-full border border-danger/40 bg-danger/10 px-2 py-0.5 text-[11px] whitespace-nowrap text-danger">
              Longest price
            </span>
          )}
          {correlated && (
            <span className="rounded-full border border-warning/40 bg-warning-bg px-2 py-0.5 text-[11px] whitespace-nowrap text-warning">
              Correlated
            </span>
          )}
        </div>
      </div>

      <div className="mt-3 rounded-md bg-surface-2 p-2.5">
        <p className="text-xs text-muted">{leg.marketLabel}</p>
        <p className="font-display font-semibold">
          {leg.outcome.outcome} @ {formatPrice(leg.outcome.bestUk.price)}{" "}
          <span className="text-xs text-muted">({leg.outcome.bestUk.bookmaker})</span>
        </p>
      </div>

      <p className="mt-3 text-xs">{describeForm(leg.home.teamName, leg.home.form)}</p>
      <p className="mt-1 text-xs">{describeForm(leg.away.teamName, leg.away.form)}</p>

      <p className="mt-3 border-t border-line pt-2.5 text-xs">
        {describeHeadToHead(leg.home.teamName, leg.away.teamName, leg.headToHead.record, leg.headToHead.sampleSize)}
        {leg.headToHead.meetings[0] && (
          <span className="text-muted">
            {" "}
            Last time: {leg.headToHead.meetings[0].homeTeam} {leg.headToHead.meetings[0].homeGoals}–
            {leg.headToHead.meetings[0].awayGoals} {leg.headToHead.meetings[0].awayTeam}.
          </span>
        )}
      </p>
    </div>
  );
}
