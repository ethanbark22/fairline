/**
 * Picks out the slip's "weakest" leg in plain, honest terms: the longest
 * price. A higher decimal price is the bookmakers' own way of saying an
 * outcome is less likely — using it to point at a leg is citing the
 * market's number, not inventing one of our own. This is deliberately not
 * a probability or an edge; see CLAUDE.md, "How the analysis works".
 * Only meaningful with more than one leg, so a single-leg slip gets none.
 */
export interface WeakestLegInput {
  price: number;
}

export function findWeakestLeg<T extends WeakestLegInput>(legs: readonly T[]): T | null {
  if (legs.length < 2) return null;
  return legs.reduce((longest, leg) => (leg.price > longest.price ? leg : longest));
}
