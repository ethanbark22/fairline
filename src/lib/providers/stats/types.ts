/**
 * FootballStatsProvider: the interface every stats source (Sportmonks,
 * or the sample data used to build screens before we sign up) implements.
 *
 * The app and its screens only ever talk to this interface, never to a
 * specific vendor, so the provider behind it can change without touching
 * any page. Every method returns a sample size alongside the numbers, so a
 * stat based on one match never gets displayed as if it were based on ten.
 */

export interface FormEntry {
  opponent: string;
  competition: string;
  /** ISO date, e.g. "2026-09-20". */
  date: string;
  result: "W" | "D" | "L";
  scoreFor: number;
  scoreAgainst: number;
  venue: "home" | "away";
}

export interface TeamForm {
  teamId: string;
  teamName: string;
  /** Most recent match first. */
  matches: FormEntry[];
  sampleSize: number;
  sampleDescription: string;
}

export interface HeadToHeadMeeting {
  /** ISO date. */
  date: string;
  competition: string;
  homeTeam: string;
  awayTeam: string;
  homeGoals: number;
  awayGoals: number;
}

export interface HeadToHeadRecord {
  teamAWins: number;
  draws: number;
  teamBWins: number;
}

export interface HeadToHead {
  teamAId: string;
  teamBId: string;
  record: HeadToHeadRecord;
  /** Most recent meeting first. */
  meetings: HeadToHeadMeeting[];
  sampleSize: number;
  sampleDescription: string;
}

export interface MatchStatAverages {
  teamId: string;
  teamName: string;
  shotsPerGame: number;
  shotsOnTargetPerGame: number;
  possessionPct: number;
  cornersPerGame: number;
  cardsPerGame: number;
  sampleSize: number;
  sampleDescription: string;
}

export interface FootballStatsProvider {
  getRecentForm(teamId: string, count?: number): Promise<TeamForm>;
  getHeadToHead(teamAId: string, teamBId: string, count?: number): Promise<HeadToHead>;
  getMatchStatAverages(teamId: string, count?: number): Promise<MatchStatAverages>;
}
