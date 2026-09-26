/**
 * A single leg in the betslip: one outcome, from one fixture, at the price
 * it was added at. This is what the betslip UI stores client-side — nothing
 * here is saved to a database, and nothing here places a real bet.
 */
export interface BetslipSelection {
  fixtureId: string;
  competition: string;
  homeTeam: string;
  awayTeam: string;
  /** ISO date-time. */
  kickoff: string;
  outcome: string;
  price: number;
  bookmaker: string;
}
