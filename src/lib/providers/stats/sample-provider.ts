/**
 * SampleFootballStatsProvider: clearly labelled made-up data, used to build
 * and review the fixtures list and match page before we sign up with a real
 * stats provider (Sportmonks, see docs/PLAN.md). Implements the same
 * FootballStatsProvider interface a real provider will, so swapping one for
 * the other later needs no changes to any page.
 *
 * None of the numbers below are real match results.
 */

import { SAMPLE_TEAMS, type SampleTeamId } from "@/lib/sample-data/teams";
import type {
  FootballStatsProvider,
  FormEntry,
  HeadToHead,
  MatchStatAverages,
  TeamForm,
} from "./types";

const FORM_SAMPLE_SIZE = 6;

const SAMPLE_FORM: Record<SampleTeamId, FormEntry[]> = {
  arsenal: [
    { opponent: "Bournemouth", competition: "Premier League", date: "2026-09-20", result: "W", scoreFor: 3, scoreAgainst: 1, venue: "home" },
    { opponent: "Everton", competition: "Premier League", date: "2026-09-13", result: "W", scoreFor: 2, scoreAgainst: 0, venue: "away" },
    { opponent: "Manchester City", competition: "Premier League", date: "2026-09-06", result: "D", scoreFor: 1, scoreAgainst: 1, venue: "home" },
    { opponent: "Brentford", competition: "Premier League", date: "2026-08-30", result: "W", scoreFor: 2, scoreAgainst: 1, venue: "away" },
    { opponent: "Leeds United", competition: "Premier League", date: "2026-08-23", result: "W", scoreFor: 3, scoreAgainst: 0, venue: "home" },
    { opponent: "Fulham", competition: "Premier League", date: "2026-08-16", result: "L", scoreFor: 0, scoreAgainst: 1, venue: "away" },
  ],
  chelsea: [
    { opponent: "Brighton", competition: "Premier League", date: "2026-09-21", result: "D", scoreFor: 2, scoreAgainst: 2, venue: "away" },
    { opponent: "West Ham", competition: "Premier League", date: "2026-09-14", result: "W", scoreFor: 2, scoreAgainst: 0, venue: "home" },
    { opponent: "Crystal Palace", competition: "Premier League", date: "2026-09-07", result: "L", scoreFor: 0, scoreAgainst: 1, venue: "away" },
    { opponent: "Wolves", competition: "Premier League", date: "2026-08-31", result: "W", scoreFor: 3, scoreAgainst: 1, venue: "home" },
    { opponent: "Aston Villa", competition: "Premier League", date: "2026-08-24", result: "D", scoreFor: 1, scoreAgainst: 1, venue: "away" },
    { opponent: "Nottingham Forest", competition: "Premier League", date: "2026-08-17", result: "W", scoreFor: 2, scoreAgainst: 1, venue: "home" },
  ],
  liverpool: [
    { opponent: "Everton", competition: "Premier League", date: "2026-09-21", result: "W", scoreFor: 2, scoreAgainst: 1, venue: "home" },
    { opponent: "Burnley", competition: "Premier League", date: "2026-09-14", result: "W", scoreFor: 4, scoreAgainst: 0, venue: "away" },
    { opponent: "Newcastle United", competition: "Premier League", date: "2026-09-07", result: "D", scoreFor: 1, scoreAgainst: 1, venue: "home" },
    { opponent: "Bournemouth", competition: "Premier League", date: "2026-08-31", result: "W", scoreFor: 3, scoreAgainst: 1, venue: "away" },
    { opponent: "Brentford", competition: "Premier League", date: "2026-08-24", result: "W", scoreFor: 2, scoreAgainst: 0, venue: "home" },
    { opponent: "Bournemouth", competition: "Premier League", date: "2026-08-17", result: "L", scoreFor: 1, scoreAgainst: 2, venue: "away" },
  ],
  "man-city": [
    { opponent: "West Ham", competition: "Premier League", date: "2026-09-20", result: "W", scoreFor: 3, scoreAgainst: 0, venue: "home" },
    { opponent: "Fulham", competition: "Premier League", date: "2026-09-13", result: "W", scoreFor: 2, scoreAgainst: 1, venue: "away" },
    { opponent: "Arsenal", competition: "Premier League", date: "2026-09-06", result: "D", scoreFor: 1, scoreAgainst: 1, venue: "away" },
    { opponent: "Tottenham Hotspur", competition: "Premier League", date: "2026-08-30", result: "W", scoreFor: 3, scoreAgainst: 2, venue: "home" },
    { opponent: "Wolves", competition: "Premier League", date: "2026-08-23", result: "W", scoreFor: 4, scoreAgainst: 1, venue: "away" },
    { opponent: "Brighton", competition: "Premier League", date: "2026-08-16", result: "D", scoreFor: 0, scoreAgainst: 0, venue: "home" },
  ],
  newcastle: [
    { opponent: "Crystal Palace", competition: "Premier League", date: "2026-09-20", result: "L", scoreFor: 0, scoreAgainst: 1, venue: "away" },
    { opponent: "Aston Villa", competition: "Premier League", date: "2026-09-13", result: "W", scoreFor: 2, scoreAgainst: 0, venue: "home" },
    { opponent: "Liverpool", competition: "Premier League", date: "2026-09-07", result: "D", scoreFor: 1, scoreAgainst: 1, venue: "away" },
    { opponent: "Leeds United", competition: "Premier League", date: "2026-08-31", result: "W", scoreFor: 3, scoreAgainst: 1, venue: "home" },
    { opponent: "Nottingham Forest", competition: "Premier League", date: "2026-08-24", result: "W", scoreFor: 2, scoreAgainst: 1, venue: "away" },
    { opponent: "Leeds United", competition: "Premier League", date: "2026-08-17", result: "D", scoreFor: 2, scoreAgainst: 2, venue: "home" },
  ],
  "man-utd": [
    { opponent: "Sunderland", competition: "Premier League", date: "2026-09-21", result: "W", scoreFor: 2, scoreAgainst: 1, venue: "home" },
    { opponent: "Chelsea", competition: "Premier League", date: "2026-09-14", result: "L", scoreFor: 0, scoreAgainst: 1, venue: "away" },
    { opponent: "Burnley", competition: "Premier League", date: "2026-09-07", result: "W", scoreFor: 3, scoreAgainst: 0, venue: "home" },
    { opponent: "Everton", competition: "Premier League", date: "2026-08-31", result: "D", scoreFor: 1, scoreAgainst: 1, venue: "away" },
    { opponent: "Fulham", competition: "Premier League", date: "2026-08-24", result: "W", scoreFor: 1, scoreAgainst: 0, venue: "home" },
    { opponent: "Arsenal", competition: "Premier League", date: "2026-08-17", result: "L", scoreFor: 0, scoreAgainst: 1, venue: "away" },
  ],
};

interface HeadToHeadKey {
  teamAId: SampleTeamId;
  teamBId: SampleTeamId;
  record: HeadToHead["record"];
  meetings: HeadToHead["meetings"];
}

const SAMPLE_HEAD_TO_HEAD: HeadToHeadKey[] = [
  {
    teamAId: "arsenal",
    teamBId: "chelsea",
    record: { teamAWins: 2, draws: 1, teamBWins: 2 },
    meetings: [
      { date: "2026-04-12", competition: "Premier League", homeTeam: "Chelsea", awayTeam: "Arsenal", homeGoals: 1, awayGoals: 2 },
      { date: "2025-11-23", competition: "Premier League", homeTeam: "Arsenal", awayTeam: "Chelsea", homeGoals: 1, awayGoals: 1 },
      { date: "2025-04-20", competition: "Premier League", homeTeam: "Chelsea", awayTeam: "Arsenal", homeGoals: 2, awayGoals: 0 },
      { date: "2024-10-27", competition: "Premier League", homeTeam: "Arsenal", awayTeam: "Chelsea", homeGoals: 2, awayGoals: 1 },
      { date: "2024-05-05", competition: "Premier League", homeTeam: "Chelsea", awayTeam: "Arsenal", homeGoals: 1, awayGoals: 2 },
    ],
  },
  {
    teamAId: "liverpool",
    teamBId: "man-city",
    record: { teamAWins: 1, draws: 2, teamBWins: 2 },
    meetings: [
      { date: "2026-03-08", competition: "Premier League", homeTeam: "Manchester City", awayTeam: "Liverpool", homeGoals: 2, awayGoals: 2 },
      { date: "2025-10-19", competition: "Premier League", homeTeam: "Liverpool", awayTeam: "Manchester City", homeGoals: 0, awayGoals: 1 },
      { date: "2025-03-16", competition: "Premier League", homeTeam: "Manchester City", awayTeam: "Liverpool", homeGoals: 1, awayGoals: 1 },
      { date: "2024-11-24", competition: "Premier League", homeTeam: "Liverpool", awayTeam: "Manchester City", homeGoals: 2, awayGoals: 0 },
      { date: "2024-03-10", competition: "Premier League", homeTeam: "Manchester City", awayTeam: "Liverpool", homeGoals: 1, awayGoals: 1 },
    ],
  },
  {
    teamAId: "newcastle",
    teamBId: "man-utd",
    record: { teamAWins: 1, draws: 1, teamBWins: 3 },
    meetings: [
      { date: "2026-02-01", competition: "Premier League", homeTeam: "Manchester United", awayTeam: "Newcastle United", homeGoals: 2, awayGoals: 0 },
      { date: "2025-09-14", competition: "Premier League", homeTeam: "Newcastle United", awayTeam: "Manchester United", homeGoals: 1, awayGoals: 1 },
      { date: "2025-01-25", competition: "Premier League", homeTeam: "Manchester United", awayTeam: "Newcastle United", homeGoals: 1, awayGoals: 0 },
      { date: "2024-09-01", competition: "Premier League", homeTeam: "Newcastle United", awayTeam: "Manchester United", homeGoals: 1, awayGoals: 0 },
      { date: "2024-04-02", competition: "Premier League", homeTeam: "Manchester United", awayTeam: "Newcastle United", homeGoals: 2, awayGoals: 0 },
    ],
  },
];

const STATS_SAMPLE_SIZE = 6;
const STATS_DESCRIPTION = "average of the last 6 Premier League matches";

const SAMPLE_MATCH_STATS: Record<SampleTeamId, Omit<MatchStatAverages, "teamId" | "teamName" | "sampleSize" | "sampleDescription">> = {
  arsenal: { shotsPerGame: 15.2, shotsOnTargetPerGame: 5.8, possessionPct: 58, cornersPerGame: 6.7 },
  chelsea: { shotsPerGame: 13.5, shotsOnTargetPerGame: 4.9, possessionPct: 54, cornersPerGame: 5.8 },
  liverpool: { shotsPerGame: 16.1, shotsOnTargetPerGame: 6.3, possessionPct: 61, cornersPerGame: 7.2 },
  "man-city": { shotsPerGame: 17.4, shotsOnTargetPerGame: 6.9, possessionPct: 64, cornersPerGame: 7.5 },
  newcastle: { shotsPerGame: 12.8, shotsOnTargetPerGame: 4.6, possessionPct: 49, cornersPerGame: 5.4 },
  "man-utd": { shotsPerGame: 12.1, shotsOnTargetPerGame: 4.2, possessionPct: 51, cornersPerGame: 5.1 },
};

function assertSampleTeam(teamId: string): asserts teamId is SampleTeamId {
  if (!(teamId in SAMPLE_TEAMS)) {
    throw new RangeError(`No sample data for team id "${teamId}"`);
  }
}

export class SampleFootballStatsProvider implements FootballStatsProvider {
  async getRecentForm(teamId: string, count = FORM_SAMPLE_SIZE): Promise<TeamForm> {
    assertSampleTeam(teamId);
    const matches = SAMPLE_FORM[teamId].slice(0, count);
    return {
      teamId,
      teamName: SAMPLE_TEAMS[teamId],
      matches,
      sampleSize: matches.length,
      sampleDescription: `last ${matches.length} Premier League matches`,
    };
  }

  async getHeadToHead(teamAId: string, teamBId: string, count?: number): Promise<HeadToHead> {
    assertSampleTeam(teamAId);
    assertSampleTeam(teamBId);
    const entry = SAMPLE_HEAD_TO_HEAD.find(
      (h) =>
        (h.teamAId === teamAId && h.teamBId === teamBId) ||
        (h.teamAId === teamBId && h.teamBId === teamAId),
    );
    if (!entry) {
      throw new RangeError(`No sample head-to-head data for "${teamAId}" vs "${teamBId}"`);
    }
    const flip = entry.teamAId !== teamAId;
    const meetings = count ? entry.meetings.slice(0, count) : entry.meetings;
    return {
      teamAId,
      teamBId,
      record: flip
        ? { teamAWins: entry.record.teamBWins, draws: entry.record.draws, teamBWins: entry.record.teamAWins }
        : entry.record,
      meetings,
      sampleSize: meetings.length,
      sampleDescription: `last ${meetings.length} meetings, all competitions`,
    };
  }

  async getMatchStatAverages(teamId: string, count = STATS_SAMPLE_SIZE): Promise<MatchStatAverages> {
    assertSampleTeam(teamId);
    return {
      teamId,
      teamName: SAMPLE_TEAMS[teamId],
      ...SAMPLE_MATCH_STATS[teamId],
      sampleSize: count,
      sampleDescription: STATS_DESCRIPTION,
    };
  }
}
