# Models

## football_1x2_v1 (Premier League match result)

Code: `src/lib/models/football/football-1x2-v1.ts`. Backtest: `docs/backtests/football_1x2_v1.md`.

1. **Ratings (Elo).** Every team has one strength number; 1500 is average.
   After each match the winner takes points from the loser. How many depends
   on how surprising the result was (the home side gets a 100-point head start
   when working that out), times 15, times a bonus for a winning margin of 2 or
   more goals.
2. **New season.** Returning teams keep 90% of their distance from average.
   Promoted teams start 100 points below average. Then everyone is shifted so
   the average is 1500 again.
3. **Expected goals.** Rating gap plus home advantage, times 0.5 goals per 100
   points, gives the expected goal difference. The league's average goals per
   game over the last 760 matches (about two seasons) gives the total. Together
   these make expected goals for each side (never below 0.15).
4. **Probabilities.** A Poisson goals model (the standard way to model scores
   from expected goals) turns the two expected-goals numbers into home, draw
   and away probabilities that add up to 1.

The five settings (15, 100, 0.5, 100, 0.9) were picked by trying 4,320
combinations on seasons 2000-01 to 2011-12 and keeping the one that scored best.
Later seasons were kept back so the model could be tested on seasons it had never seen.
Changing any setting means a new model version.

**Known weaknesses:** it assumes home advantage stays the same, but it has shrunk
since the 2000s. It ignores injuries, line-ups, transfers and managers. It
treats the two teams' goals as independent, which slightly underestimates draws
in close games.
