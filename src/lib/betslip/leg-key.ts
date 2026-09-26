/**
 * Encodes a betslip's legs into the `legs` URL query parameter that
 * `/betslip/analysis` reads, and parses it back. Only identifying fields
 * travel in the URL (fixture, market, outcome) — everything else (price,
 * bookmaker, form, head-to-head) is looked up fresh server-side from
 * `getLegSummaries`, the same way the match page already does. This keeps
 * the "never call a provider from the browser" rule true even for this
 * page: the client only ever sends which legs were picked, never the data.
 */

import type { MarketKey } from "@/lib/providers/odds/types";
import type { BetslipSelection } from "./types";

export interface LegKey {
  fixtureId: string;
  market: MarketKey;
  outcome: string;
}

const SEGMENT_SEPARATOR = "|";
const FIELD_SEPARATOR = ":";

export function encodeLegsParam(selections: readonly BetslipSelection[]): string {
  return selections
    .map((s) => [s.fixtureId, s.market, s.outcome].map(encodeURIComponent).join(FIELD_SEPARATOR))
    .join(SEGMENT_SEPARATOR);
}

/** Malformed segments are skipped rather than throwing — a stale or hand-edited URL shouldn't crash the page. */
export function parseLegsParam(raw: string | undefined | null): LegKey[] {
  if (!raw) return [];
  return raw
    .split(SEGMENT_SEPARATOR)
    .map((segment) => segment.split(FIELD_SEPARATOR).map(decodeURIComponent))
    .filter((fields): fields is [string, string, string] => fields.length === 3 && fields.every(Boolean))
    .map(([fixtureId, market, outcome]) => ({ fixtureId, market: market as MarketKey, outcome }));
}
