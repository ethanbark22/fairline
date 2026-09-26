/**
 * One-off research tool: do UK bookmakers ever offer better prices than
 * Pinnacle's fair price for upcoming Premier League matches?
 *
 *   npm run odds:compare
 *
 * Each run costs 2 credits on The Odds API (match winner, UK region = 1;
 * match winner, EU region for Pinnacle = 1). It checks the account's credit
 * count first with a free call and refuses to run if that would take the
 * month's usage past MAX_CREDITS_USED.
 *
 * Writes a summary to docs/research/uk-vs-pinnacle/ (our calculations only,
 * never the raw API responses) and compares with the previous run if there is one.
 * The API key is read from ODDS_API_KEY and is never printed.
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { compareWithPinnacle, EXCHANGE_KEYS, type Comparison } from "@/lib/odds-compare/compare-with-pinnacle";
import { TheOddsApiProvider } from "@/lib/providers/odds/the-odds-api";
import type { ProviderUsage } from "@/lib/providers/odds/types";

const COMPETITION = "soccer_epl";
const UK_REGION = "uk";
const PINNACLE_REGION = "eu";
const CREDITS_PER_RUN = 2;
/** Agreed budget for this research: at most 150 of the 500 free monthly credits. */
const MAX_CREDITS_USED = 150;
const OUT_DIR = join(process.cwd(), "docs", "research", "uk-vs-pinnacle");

const pct = (x: number, dp = 1) => `${x >= 0 ? "+" : ""}${(x * 100).toFixed(dp)}%`;
const usageText = (u: ProviderUsage) => `used ${u.used ?? "?"}, remaining ${u.remaining ?? "?"}`;

async function main() {
  const provider = new TheOddsApiProvider(process.env.ODDS_API_KEY ?? "");

  // Free call: confirms the fixtures and reads the credit counter.
  const { events, usage: before } = await provider.getEvents(COMPETITION);
  console.log(`Free events call: ${events.length} upcoming fixtures. Credits ${usageText(before)}.`);
  if (before.used === null || before.used + CREDITS_PER_RUN > MAX_CREDITS_USED) {
    throw new Error(`Stopping: this run would take credits used past ${MAX_CREDITS_USED} (or usage is unknown).`);
  }

  const uk = await provider.getMatchWinnerOdds(COMPETITION, UK_REGION);
  console.log(`UK odds call cost ${uk.usage.lastCallCost}. Credits ${usageText(uk.usage)}.`);
  const eu = await provider.getMatchWinnerOdds(COMPETITION, PINNACLE_REGION);
  console.log(`EU odds call cost ${eu.usage.lastCallCost}. Credits ${usageText(eu.usage)}.`);

  const runAt = new Date();
  const { comparisons, skipped } = compareWithPinnacle(uk.events, eu.events, runAt);
  const ukBooks = new Map<string, string>();
  for (const e of uk.events) for (const b of e.bookmakers) ukBooks.set(b.bookmakerKey, b.bookmakerTitle);

  mkdirSync(OUT_DIR, { recursive: true });
  const previous = latestPreviousRun();
  const stamp = runAt.toISOString().slice(0, 16).replace(":", "");
  const summary = {
    runAt: runAt.toISOString(),
    creditsBefore: before,
    creditsAfter: eu.usage,
    creditsThisRun: (eu.usage.used ?? 0) - (before.used ?? 0),
    ukBookmakers: [...ukBooks].map(([key, title]) => ({ key, title, exchange: EXCHANGE_KEYS.has(key) })),
    skipped,
    comparisons,
  };
  writeFileSync(join(OUT_DIR, `${stamp}.json`), JSON.stringify(summary, null, 2) + "\n");
  const markdown = render(summary, previous);
  writeFileSync(join(OUT_DIR, `${stamp}.md`), markdown);
  console.log(markdown);
}

type Summary = {
  runAt: string;
  creditsBefore: ProviderUsage;
  creditsAfter: ProviderUsage;
  creditsThisRun: number;
  ukBookmakers: { key: string; title: string; exchange: boolean }[];
  skipped: { fixture: string; reason: string }[];
  comparisons: Comparison[];
};

function latestPreviousRun(): Summary | undefined {
  if (!existsSync(OUT_DIR)) return undefined;
  const files = readdirSync(OUT_DIR).filter((f) => f.endsWith(".json")).sort();
  const last = files.at(-1);
  return last ? (JSON.parse(readFileSync(join(OUT_DIR, last), "utf8")) as Summary) : undefined;
}

function minutesBetween(a: string, b: string): number {
  return Math.round((new Date(a).getTime() - new Date(b).getTime()) / 60000);
}

function render(s: Summary, previous: Summary | undefined): string {
  const c = s.comparisons;
  const positive = c.filter((x) => x.expectedValue > 0);
  const positiveBoth = positive.filter((x) => x.expectedValuePower > 0);
  const over = (t: number) => c.filter((x) => x.expectedValue > t && x.expectedValuePower > t).length;
  const byBook = new Map<string, number>();
  for (const x of positive) byBook.set(x.bestUk.bookmakerTitle, (byBook.get(x.bestUk.bookmakerTitle) ?? 0) + 1);
  const margins = [...new Set(c.map((x) => `${x.providerEventId}:${x.pinnacleMargin}`))].map((k) => Number(k.split(":")[1]));
  const avgMargin = margins.reduce((a, b) => a + b, 0) / Math.max(1, margins.length);
  const sorted = [...c].sort((a, b) => b.expectedValue - a.expectedValue);

  const row = (x: Comparison) =>
    `| ${x.homeTeam} v ${x.awayTeam} | ${x.commenceTime.slice(0, 16).replace("T", " ")} | ${x.outcome} | ${
      x.bestUk.bookmakerTitle
    } | ${x.bestUk.price.toFixed(2)} | ${x.fairPrice.toFixed(2)} | ${pct(x.expectedValue)} | ${pct(
      x.expectedValuePower,
    )} | ${minutesBetween(x.pinnacleLastUpdate, x.bestUk.lastUpdate)} |`;

  let movement = "";
  if (previous) {
    const prev = new Map(previous.comparisons.map((x) => [`${x.providerEventId}:${x.outcome}`, x]));
    const pairs = c
      .map((x) => ({ now: x, then: prev.get(`${x.providerEventId}:${x.outcome}`) }))
      .filter((p): p is { now: Comparison; then: Comparison } => p.then !== undefined);
    const stillPositive = pairs.filter((p) => p.then.expectedValue > 0 && p.now.expectedValue > 0).length;
    const wasPositive = pairs.filter((p) => p.then.expectedValue > 0).length;
    const fairMoves = pairs.map((p) => Math.abs(p.now.fairProbability - p.then.fairProbability));
    const avgFairMove = fairMoves.reduce((a, b) => a + b, 0) / Math.max(1, fairMoves.length);
    const bigMoves = [...pairs]
      .sort(
        (a, b) =>
          Math.abs(b.now.fairProbability - b.then.fairProbability) -
          Math.abs(a.now.fairProbability - a.then.fairProbability),
      )
      .slice(0, 5);
    movement = `
## Change since the previous run (${previous.runAt.slice(0, 16).replace("T", " ")} UTC)

- Outcomes in both runs: ${pairs.length}
- Positive expected value last time: ${wasPositive}; still positive now: ${stillPositive}
- Average move in Pinnacle's fair probability: ${(avgFairMove * 100).toFixed(2)} percentage points

Biggest moves in Pinnacle's fair probability:

| Match | Outcome | Fair price then | Fair price now | Best UK then | Best UK now | EV then | EV now |
| --- | --- | --: | --: | --: | --: | --: | --: |
${bigMoves
  .map(
    (p) =>
      `| ${p.now.homeTeam} v ${p.now.awayTeam} | ${p.now.outcome} | ${p.then.fairPrice.toFixed(2)} | ${p.now.fairPrice.toFixed(
        2,
      )} | ${p.then.bestUk.price.toFixed(2)} | ${p.now.bestUk.price.toFixed(2)} | ${pct(p.then.expectedValue)} | ${pct(
        p.now.expectedValue,
      )} |`,
  )
  .join("\n")}
`;
  }

  return `# UK best price vs Pinnacle fair price: ${s.runAt.slice(0, 16).replace("T", " ")} UTC

Generated by \`npm run odds:compare\`. Source: The Odds API (match winner; UK region for
UK bookmakers, EU region for Pinnacle). Our calculations only; no raw API data is stored.

- Credits: ${s.creditsThisRun} used by this run (account now ${usageText(s.creditsAfter)}).
- Fixtures compared: ${new Set(c.map((x) => x.providerEventId)).size}; outcomes compared: ${c.length}.
- UK bookmakers seen: ${s.ukBookmakers.filter((b) => !b.exchange).map((b) => b.title).join(", ")}.
- Exchanges left out (they charge commission, so their prices aren't comparable): ${
    s.ukBookmakers.filter((b) => b.exchange).map((b) => b.title).join(", ") || "none"
  }.
- Pinnacle's average margin on these fixtures: ${(avgMargin * 100).toFixed(2)}%.
${s.skipped.length ? `- Skipped: ${s.skipped.map((k) => `${k.fixture} (${k.reason})`).join("; ")}.\n` : ""}
## Headline

- Best UK price above Pinnacle's fair price (expected value above 0): **${positive.length} of ${c.length}**.
- Still above when the margin is removed with the power method too: ${positiveBoth.length}.
- Above +1% on both methods: ${over(0.01)}. Above +2%: ${over(0.02)}. Above +3%: ${over(0.03)}.
${byBook.size ? `- Which bookmakers: ${[...byBook].map(([k, v]) => `${k} (${v})`).join(", ")}.` : ""}

## All comparisons, best first

Expected value = best UK price x Pinnacle's fair probability - 1. "Power" is the same
using the power method to remove Pinnacle's margin. "Mins" is how many minutes
Pinnacle's price was last updated after the UK bookmaker's (a large number
can mean the UK price is stale).

| Match | Kick-off (UTC) | Outcome | Best UK bookmaker | Price | Fair price | EV | EV (power) | Mins |
| --- | --- | --- | --- | --: | --: | --: | --: | --: |
${sorted.map(row).join("\n")}
${movement}`;
}

main().catch((error: unknown) => {
  // Error messages from the provider never contain the key.
  console.error(error instanceof Error ? error.message : "Unknown error");
  process.exit(1);
});
