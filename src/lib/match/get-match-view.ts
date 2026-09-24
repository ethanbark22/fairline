/**
 * Combines the stats provider and the odds provider into the view-model the
 * fixtures list and match page render. This is the only place that knows
 * about both providers at once — swap `statsProvider` and `oddsProvider`
 * below for real implementations once we've signed up (see docs/PLAN.md),
 * and every page keeps working unchanged.
 */

import { bookmakerMargin } from "@/lib/value/value";
import { pinnacleFairPrices, summarisePriceMovement, type PriceDirection } from "@/lib/price/price-comparison";
import { SampleFootballStatsProvider } from "@/lib/providers/stats/sample-provider";
import type { FootballStatsProvider, HeadToHead, TeamForm, MatchStatAverages } from "@/lib/providers/stats/types";
import { SampleOddsProvider } from "@/lib/providers/odds/sample-provider";
import type { BestUkPrice, OddsProvider } from "@/lib/providers/odds/types";
import { getSampleTeamId } from "@/lib/sample-data/teams";

// Sample data for now — see docs/PLAN.md, "Go or no-go on paying for stats
// and prices". Replace with SportmonksStatsProvider / OddsApiProvider once
// we've signed up; nothing else in this file or any page needs to change.
const statsProvider: FootballStatsProvider = new SampleFootballStatsProvider();
const oddsProvider: OddsProvider = new SampleOddsProvider();

const COMPETITION = "Premier League";

export interface FixtureOutcomeSummary {
  outcome: string;
  bestUk: BestUkPrice;
  fairPrice: number;
}

export interface FixtureListItem {
  fixtureId: string;
  competition: string;
  homeTeam: string;
  awayTeam: string;
  kickoff: string;
  outcomes: FixtureOutcomeSummary[];
}

export async function listFixtures(): Promise<FixtureListItem[]> {
  const fixtures = await oddsProvider.getUpcomingFixtures(COMPETITION);
  return Promise.all(
    fixtures.map(async (fixture) => {
      const comparison = await oddsProvider.getPriceComparison(fixture.fixtureId);
      const fair = pinnacleFairPrices(comparison.outcomes.map((o) => o.pinnaclePrice));
      return {
        ...fixture,
        outcomes: comparison.outcomes.map((o, i) => ({
          outcome: o.outcome,
          bestUk: o.bestUk,
          fairPrice: fair[i].price,
        })),
      };
    }),
  );
}

export interface MatchOutcomeView {
  outcome: string;
  bestUk: BestUkPrice;
  fairPrice: number;
  fairProbability: number;
  openingPrice: number;
  currentPrice: number;
  direction: PriceDirection;
  changePct: number;
}

export interface TeamMatchView {
  teamId: string;
  teamName: string;
  form: TeamForm;
  stats: MatchStatAverages;
}

export interface SampleSummary {
  headline: string;
  body: string;
  risks: string[];
}

export interface MatchView {
  fixtureId: string;
  competition: string;
  kickoff: string;
  home: TeamMatchView;
  away: TeamMatchView;
  headToHead: HeadToHead;
  outcomes: MatchOutcomeView[];
  pinnacleMarginPct: number;
  sampleSummary: SampleSummary;
}

export async function getMatchView(fixtureId: string): Promise<MatchView | null> {
  const fixtures = await oddsProvider.getUpcomingFixtures(COMPETITION);
  const fixture = fixtures.find((f) => f.fixtureId === fixtureId);
  if (!fixture) return null;

  const homeId = getSampleTeamId(fixture.homeTeam);
  const awayId = getSampleTeamId(fixture.awayTeam);

  const [homeForm, awayForm, homeStats, awayStats, headToHead, comparison] = await Promise.all([
    statsProvider.getRecentForm(homeId),
    statsProvider.getRecentForm(awayId),
    statsProvider.getMatchStatAverages(homeId),
    statsProvider.getMatchStatAverages(awayId),
    statsProvider.getHeadToHead(homeId, awayId),
    oddsProvider.getPriceComparison(fixtureId),
  ]);

  const pinnaclePrices = comparison.outcomes.map((o) => o.pinnaclePrice);
  const fair = pinnacleFairPrices(pinnaclePrices);

  const outcomes: MatchOutcomeView[] = comparison.outcomes.map((o, i) => {
    const movement = summarisePriceMovement(o.opening.price, o.current.price);
    return {
      outcome: o.outcome,
      bestUk: o.bestUk,
      fairPrice: fair[i].price,
      fairProbability: fair[i].probability,
      openingPrice: o.opening.price,
      currentPrice: o.current.price,
      direction: movement.direction,
      changePct: movement.changePct,
    };
  });

  return {
    fixtureId,
    competition: fixture.competition,
    kickoff: fixture.kickoff,
    home: { teamId: homeId, teamName: fixture.homeTeam, form: homeForm, stats: homeStats },
    away: { teamId: awayId, teamName: fixture.awayTeam, form: awayForm, stats: awayStats },
    headToHead,
    outcomes,
    pinnacleMarginPct: bookmakerMargin(pinnaclePrices),
    sampleSummary: buildSampleSummary(fixture.homeTeam, fixture.awayTeam, homeForm, awayForm, headToHead),
  };
}

function formRecord(form: TeamForm): { wins: number; draws: number; losses: number } {
  return form.matches.reduce(
    (acc, m) => {
      if (m.result === "W") acc.wins += 1;
      else if (m.result === "D") acc.draws += 1;
      else acc.losses += 1;
      return acc;
    },
    { wins: 0, draws: 0, losses: 0 },
  );
}

/**
 * A placeholder in the shape and tone Claude's real summary will use, built
 * from the same sample numbers the rest of the page shows — not a real
 * Claude call. Wire this up to lib/ai once we're ready to spend on it.
 */
function buildSampleSummary(
  homeTeam: string,
  awayTeam: string,
  homeForm: TeamForm,
  awayForm: TeamForm,
  headToHead: HeadToHead,
): SampleSummary {
  const home = formRecord(homeForm);
  const away = formRecord(awayForm);
  return {
    headline: `${homeTeam} have the better recent record, but this fixture has been close before.`,
    body:
      `${homeTeam} have won ${home.wins} of their last ${homeForm.sampleSize} league matches, ` +
      `against ${away.wins} for ${awayTeam} in the same span. Head-to-head over the last ` +
      `${headToHead.sampleSize} meetings is ${headToHead.record.teamAWins}-${headToHead.record.draws}-${headToHead.record.teamBWins}, ` +
      `so history alone doesn't settle this one.`,
    risks: [
      `A sample of ${homeForm.sampleSize} matches is small — a couple of results either way would change these numbers a lot.`,
      "Recent form doesn't account for injuries, suspensions or fixture congestion, which aren't in this data yet.",
      "The price comparison is a snapshot, not a prediction — bookmaker prices can and do move again before kickoff.",
    ],
  };
}
