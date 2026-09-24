# Data providers and licence terms

One entry per source. Update this whenever we start using a source in a new way.

## football-data.co.uk (historical results and closing odds)

**What we use it for:** testing the model on past seasons (the backtest). Nothing else.

**How we get it:** `npm run data:fetch` downloads a copy of football-data.co.uk's
Premier League files that has been cleaned and joined up by an independent
GitHub project
([AnishKhetani/premier-league-data](https://github.com/AnishKhetani/premier-league-data),
pinned to commit `d69530c`, with a fingerprint check). football-data.co.uk
itself is blocked from our build environment.

**Checked for accuracy:** all 12,704 match results in that copy were compared
with a second, separately built copy
([datasets/football-datasets](https://github.com/datasets/football-datasets)).
There were 0 differences. The odds could not be cross-checked the same way,
because the second copy leaves them out. They are checked row by row when loaded:
a set of prices is dropped if any price is missing or not above 1.

**Licence position (not confirmed):**
- football-data.co.uk gives the files away for free. We could **not** read its
  terms or disclaimer page ourselves, because the site is blocked from our build environment.
- The GitHub copy we download says football-data.co.uk "does not state explicit
  redistribution terms". That project claims no rights over the data and asks users
  to credit football-data.co.uk.
- The second copy (datahub) labels itself public domain. It also says the data is
  "intended for educational and research purposes only" and that anyone going
  further should read football-data.co.uk's own terms.

**What we do and don't do, because of that:**
- Use it only for internal research (backtesting).
- Do not commit the data to git, load it into Supabase, or show it to users.
- Credit football-data.co.uk wherever results from it are discussed.

**Before any commercial use:** read football-data.co.uk's terms and disclaimer
in full, and ask the site owner in writing for permission to use the data in a
commercial product.

## The Odds API (live odds) — not in use yet

Planned for live odds (see `docs/PLAN.md`). Read the terms before the first call.
The plan notes two clauses that need a legal read: display is allowed only
"provided the data isn't the primary product being sold", and the data must not
be resold as a standalone product. The terms read so far say nothing about
bookmaker names, logos or affiliate links, so ask the provider in writing.
