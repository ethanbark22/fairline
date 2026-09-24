/**
 * Shared team list for the sample data used across the sample stats and
 * odds providers, so a team id means the same thing in both.
 */

export const SAMPLE_TEAMS = {
  arsenal: "Arsenal",
  chelsea: "Chelsea",
  liverpool: "Liverpool",
  "man-city": "Manchester City",
  newcastle: "Newcastle United",
  "man-utd": "Manchester United",
} as const;

export type SampleTeamId = keyof typeof SAMPLE_TEAMS;

const TEAM_ID_BY_NAME = new Map<string, SampleTeamId>(
  (Object.entries(SAMPLE_TEAMS) as [SampleTeamId, string][]).map(([id, name]) => [name, id]),
);

/** Looks up the sample team id behind a team's display name, e.g. "Arsenal" -> "arsenal". */
export function getSampleTeamId(teamName: string): SampleTeamId {
  const id = TEAM_ID_BY_NAME.get(teamName);
  if (!id) {
    throw new RangeError(`No sample team id for team name "${teamName}"`);
  }
  return id;
}
