/**
 * Poisson goals model: turns expected goals for each side into home / draw /
 * away probabilities, treating the two teams' goal counts as independent.
 */

export interface OutcomeProbabilities {
  home: number;
  draw: number;
  away: number;
}

/** Goal counts above this are ignored; the chance of 13+ goals is negligible. */
const MAX_GOALS = 12;

function poissonPmf(lambda: number, maxGoals: number): number[] {
  const pmf = [Math.exp(-lambda)];
  for (let k = 1; k <= maxGoals; k++) pmf.push((pmf[k - 1] * lambda) / k);
  return pmf;
}

export function outcomeProbabilities(homeExpectedGoals: number, awayExpectedGoals: number): OutcomeProbabilities {
  for (const lambda of [homeExpectedGoals, awayExpectedGoals]) {
    if (!Number.isFinite(lambda) || lambda <= 0) {
      throw new RangeError(`Expected goals must be a positive number, got ${lambda}`);
    }
  }
  const home = poissonPmf(homeExpectedGoals, MAX_GOALS);
  const away = poissonPmf(awayExpectedGoals, MAX_GOALS);

  let pHome = 0;
  let pDraw = 0;
  let pAway = 0;
  for (let h = 0; h <= MAX_GOALS; h++) {
    for (let a = 0; a <= MAX_GOALS; a++) {
      const p = home[h] * away[a];
      if (h > a) pHome += p;
      else if (h === a) pDraw += p;
      else pAway += p;
    }
  }
  // Spread the tiny ignored tail proportionally so the three add up to 1.
  const total = pHome + pDraw + pAway;
  return { home: pHome / total, draw: pDraw / total, away: pAway / total };
}
