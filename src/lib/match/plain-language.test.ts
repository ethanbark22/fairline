import { describe, expect, it } from "vitest";
import { describeForm, describeHeadToHead } from "./plain-language";
import type { FormEntry, TeamForm } from "@/lib/providers/stats/types";

function form(results: FormEntry["result"][]): TeamForm {
  const matches: FormEntry[] = results.map((result, i) => ({
    opponent: `Opponent ${i}`,
    competition: "Premier League",
    date: "2026-09-01",
    result,
    scoreFor: result === "L" ? 0 : 1,
    scoreAgainst: result === "W" ? 0 : 1,
    venue: "home",
  }));
  return { teamId: "team", teamName: "Team", matches, sampleSize: matches.length, sampleDescription: "" };
}

describe("describeForm", () => {
  it("describes a mixed record", () => {
    expect(describeForm("Arsenal", form(["W", "W", "D", "W", "L", "W"]))).toBe(
      "Arsenal have won 4 of their last 6 matches.",
    );
  });

  it("describes zero wins without saying 'won 0'", () => {
    expect(describeForm("Newcastle United", form(["L", "D", "L"]))).toBe(
      "Newcastle United haven't won any of their last 3 matches.",
    );
  });

  it("uses singular 'match' for a sample of one", () => {
    expect(describeForm("Arsenal", form(["W"]))).toBe("Arsenal have won 1 of their last 1 match.");
  });
});

describe("describeHeadToHead", () => {
  it("describes a record with draws", () => {
    expect(describeHeadToHead("Arsenal", "Chelsea", { teamAWins: 2, draws: 1, teamBWins: 2 }, 5)).toBe(
      "They've met 5 times recently: Arsenal have won 2, Chelsea have won 2, and 1 was a draw.",
    );
  });

  it("describes a record with no draws", () => {
    expect(describeHeadToHead("Arsenal", "Chelsea", { teamAWins: 3, draws: 0, teamBWins: 2 }, 5)).toBe(
      "They've met 5 times recently: Arsenal have won 3 and Chelsea have won 2.",
    );
  });

  it("uses singular forms for a count of one", () => {
    expect(describeHeadToHead("Arsenal", "Chelsea", { teamAWins: 1, draws: 1, teamBWins: 0 }, 2)).toBe(
      "They've met 2 times recently: Arsenal has won 1, Chelsea have won 0, and 1 was a draw.",
    );
  });

  it("handles no recent meetings", () => {
    expect(describeHeadToHead("Arsenal", "Chelsea", { teamAWins: 0, draws: 0, teamBWins: 0 }, 0)).toBe(
      "Arsenal and Chelsea haven't played each other recently.",
    );
  });
});
