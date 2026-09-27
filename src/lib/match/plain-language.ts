/**
 * Turns form and head-to-head numbers into plain sentences, for the betslip
 * analysis page. No percentages, no probabilities, no edge — see CLAUDE.md,
 * "How the analysis works": we have no calibrated model to back a number
 * like that, so we say what happened, not how likely it is to happen again.
 */

import type { TeamForm, HeadToHeadRecord } from "@/lib/providers/stats/types";
import { formRecord } from "./get-match-view";

function plural(n: number, word: string): string {
  if (n === 1) return `${n} ${word}`;
  const suffix = /(ch|sh|s|x|z)$/.test(word) ? "es" : "s";
  return `${n} ${word}${suffix}`;
}

function joinSentence(parts: readonly string[]): string {
  if (parts.length === 1) return parts[0];
  if (parts.length === 2) return `${parts[0]} and ${parts[1]}`;
  return `${parts.slice(0, -1).join(", ")}, and ${parts[parts.length - 1]}`;
}

/** e.g. "Arsenal have won 4 of their last 6 matches" or "...haven't won any of their last 6 matches". */
export function describeForm(teamName: string, form: TeamForm): string {
  const { wins } = formRecord(form);
  const matches = plural(form.sampleSize, "match");
  if (wins === 0) {
    return `${teamName} haven't won any of their last ${matches}.`;
  }
  return `${teamName} have won ${wins} of their last ${matches}.`;
}

/** e.g. "They've met 5 times recently: Arsenal have won 2, Chelsea have won 2, and 1 was a draw." */
export function describeHeadToHead(
  teamAName: string,
  teamBName: string,
  record: HeadToHeadRecord,
  sampleSize: number,
): string {
  if (sampleSize === 0) {
    return `${teamAName} and ${teamBName} haven't played each other recently.`;
  }
  const parts = [
    `${teamAName} ${record.teamAWins === 1 ? "has" : "have"} won ${record.teamAWins}`,
    `${teamBName} ${record.teamBWins === 1 ? "has" : "have"} won ${record.teamBWins}`,
  ];
  if (record.draws > 0) {
    parts.push(record.draws === 1 ? "1 was a draw" : `${record.draws} were draws`);
  }
  return `They've met ${plural(sampleSize, "time")} recently: ${joinSentence(parts)}.`;
}
