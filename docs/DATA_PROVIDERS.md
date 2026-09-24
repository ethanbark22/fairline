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

## Football stats providers — research for the stats-and-price pivot (not chosen yet)

Researched 24 September 2026, for the product change from a probability model to a
stats-and-price research tool (recent form, head-to-head, shots, expected goals,
alongside bookmaker prices). Football only. **Nothing here has been signed up for
or paid for — this is research only**, to support a decision. Where a provider's
own terms page blocked our research tools from reading it directly, that is said
plainly below so the gap is visible, the same way it is for football-data.co.uk above.

### football-data.org

**What it gives us:** fixtures, results, league tables, and a built-in head-to-head
subresource (aggregate wins/draws/losses/goals plus the match list) on every plan.
Recent-form ("advanced trend/form data") and match stats (shots, corners,
possession, fouls, cards) are **separate add-ons**, not part of the base plan.
**No expected goals (xG) on any tier** — confirmed by reading the pricing page;
xG is not listed anywhere in its feature list.

**Free or paid, and price** (from [football-data.org/pricing](https://www.football-data.org/pricing)):

| Plan | Price/mo | Competitions | What's in it | Calls/min |
|---|---|---|---|---|
| Free | €0 | 12 | Delayed scores/fixtures/tables only | 10 |
| Free + Livescores | €12 | 12 | Live scores | 20 |
| ML Pack Light | €29 | 12 | + advanced trend/form data, 10 seasons history | 20 |
| Free + Deep Data | €29 | 12 | + lineups, goal scorers, cards, squads | 30 |
| Standard | €49 | 30 | Same "deep data" features as above | 60 |
| Advanced | €99 | 50 | Same | 100 |
| Pro | €199 | 100 | Same | 120 |
| Statistic Add-on | +€15 | — | Corners, shots, possession, fouls, cards, offsides | — |
| Odds Add-on | +€15 | — | Pre-match odds, 40 competitions | — |

Getting form **and** head-to-head **and** shot/possession stats together means
combining named packs (e.g. Standard + Statistic Add-on), and it isn't clear from
the pricing page alone whether the ML Pack Light (form) and Statistic Add-on
(shots) stack on one subscription — that needs asking them directly before relying
on it.

**Commercial use terms**, from the terms embedded at
[football-data.org/client/register](https://www.football-data.org/client/register)
and the [API policies page](https://docs.football-data.org/general/v4/policies.html):
- The API key covers "a single Application, in its web and/or mobile form and on
  any platform (i.e. for the web Application: the Subscription applies to a single
  domain name)".
- Must display "Football data provided by the Football-Data.org API" (or "Data
  provided by football-data.org") visibly in the app.
- "After cancellation of subscription, customers are not permitted to reference
  football data obtained through the API on their own site or service."
- Team logos and photos need separate permission from their owners.
- The free tier's commercial status is not stated in writing anywhere we could
  find; the FAQ directs unclear cases to email daniel@football-data.org directly.

**Update frequency:** delayed on Free; live scores from the €12/mo tier up.

**Rate limits:** 10 calls/minute (Free) rising to 120 calls/minute (Pro, €199/mo).

### API-Football (api-sports.io, also resold via RapidAPI)

**What it gives us:** fixtures, standings, a head-to-head endpoint
(`/fixtures/headtohead?h2h=teamA-teamB`), and match statistics (shots total, on
goal, off goal, blocked, inside/outside box, fouls, corners, offsides, ball
possession, cards) — all included on every paid plan, not gated by tier the way
football-data.org gates them. We could not confirm an expected-goals (xG) field
in its documentation; treat xG as unsupported until proven otherwise.

**Free or paid, and price** (figures corroborated across several independent
comparison sites, since api-sports.io and api-football.com both blocked our
research tools — see the terms note below):

| Plan | Price/mo | Requests/day | Requests/min |
|---|---|---|---|
| Free | €0 | 100 | low (fair-use capped) |
| Pro | $19 | 7,500 | — |
| Ultra | $29 | 75,000 | 450 |
| Mega | $39 | 150,000 | 900 |

**Commercial use terms — could not verify directly.** Both
`https://api-sports.io/terms` and `https://www.api-football.com` returned
"blocked"/"forbidden" to our research tools (bot protection, not a geo-block), so
we have not read the terms ourselves. Other sites quoting the terms say API-Sports
does not itself grant a licence to publish football data (fixtures, competitions,
etc.) — obtaining any rights needed from the leagues/federations is left to the
customer, and betting, broadcast or mass-media use may need extra permission
beyond the subscription. **This needs a direct human read of api-sports.io/terms
before any money is spent — do not take our summary as the final word.**

**Update frequency:** live data updates roughly every 15 seconds during matches;
outside live play, API-Football's own guidance recommends polling head-to-head/
fixture data at most once a day.

**Rate limits:** scale with plan as in the table above, plus the per-minute caps
shown for the two top tiers.

### Sportmonks

**What it gives us:** fixtures, live scores, standings, season stats, head-to-head,
lineups, and — as a named add-on — an "xG & Pressure Index" package (expected
goals, expected goals on target, non-penalty xG and more, at team and player
level). Recent form is built from the fixture history included in every plan
rather than a single named "form" endpoint.

**Free or paid, and price** (from
[sportmonks.com/football-api/plans-pricing](https://www.sportmonks.com/football-api/plans-pricing/)):

| Plan | Price/mo | Leagues | Calls/hour |
|---|---|---|---|
| Free | €0 | 2 (not enough for Premier League) | — |
| Starter | €29 (€24 paid yearly) | 5, your choice (Premier League can be one) | 2,000 |
| Growth | €99 (€79 yearly) | 30 | 2,500 |
| Pro | €249 (€199 yearly) | 120 | 3,000 |
| Enterprise | Custom | 2,300+ | 5,000 |
| xG & Pressure Index add-on | +€24 | — | — |

A 14-day free trial exists on paid plans but needs a card.

**Commercial use terms — the clearest of the three**, quoted directly from
[sportmonks.com/terms-of-service](https://www.sportmonks.com/terms-of-service/):
- "If you use our data to create something based on our data and start earning
  money from your creation, everything is fine."
- The only real restriction is reselling the raw data itself: "you cannot
  directly sell the data we provide" / "Reselling Sportmonks' data without
  approval is not allowed."
- Storing, transferring and distributing the data inside our own product
  (including caching it in our own database) is explicitly allowed.
- No mandatory attribution for match data; logos/photos need normal image
  credit.
- Their own advice if anything is unclear: "don't be afraid to explain your
  plan and ask if this is allowed."

**Update frequency & limits:** near real-time on paid tiers; 2,000–5,000
calls/hour depending on tier (see table).

#### Checked 24 September 2026: does Sportmonks have a free plan that covers the Premier League?

**No.** Sportmonks does have a permanent free plan (no card needed), but it only
covers two fixed competitions: **the Danish Superliga and the Scottish
Premiership** (including play-offs) — you cannot swap these for the Premier
League or any other league. Source:
[sportmonks.com/football-api/free-plan](https://www.sportmonks.com/football-api/free-plan/).
The free plan otherwise carries the full feature set (fixtures, live scores,
stats, squads), so it's a genuine way to test the API's shape, just not
against the league we need.

The only way to see Premier League data without committing long-term is the
**14-day trial that comes automatically with any paid plan** (Starter
included) — but it needs a card on file, and it auto-charges for the first
month unless cancelled before day 14. Sportmonks' own FAQ: "Once subscribed
to one of our plans you will automatically receive the 14-day trial. After
14 days, your credit card will be charged, unless you choose to cancel," and
"You're only permitted to have one free trial." So there is no way to see
real Premier League data from Sportmonks with zero financial commitment —
building on sample data first (as `docs/PLAN.md` now does) avoids needing
that trial at all until we're ready to commit.

**Storing our own copy of the data and showing it to users**, quoted verbatim
from [sportmonks.com/terms-of-service](https://www.sportmonks.com/terms-of-service/):
- "Distribution, transfer, and storage of data provided by our services is
  allowed, but reselling the product is forbidden without our consent."
- "If you use our data to create something based on our data and start
  earning money from your creation, everything is fine." (Their own plain-English
  summary of what showing it to paying users is allowed to look like.)
- The only thing barred outright: "you cannot directly sell the data we
  provide" / "Reselling Sportmonks' data without approval is not allowed" —
  i.e. we can store it in our own database and show it inside Fairline's
  screens, but we could not offer a raw "Sportmonks data feed" as our own
  product.
- The terms of service page does **not** state a specific data-retention
  time limit (how long we're allowed to keep a stored row) — nothing there
  says we have to delete anything after N days. If that matters later
  (e.g. for a "data export/delete" request), ask them directly rather than
  assuming.

**Requests per hour**, quoted verbatim from the API docs
([docs.sportmonks.com/v3/api/rate-limit](https://docs.sportmonks.com/v3/api/rate-limit)):
limits are set "per entity, not per endpoint" (Fixture, Team, Player, League
etc. each get their own separate hourly allowance), and exceeding one entity's
limit returns "a `429 Too Many Requests` error" — but "you can still call
other entities" while that one resets.

| Plan | Requests / entity / hour |
|---|---|
| Free | 3,000 |
| Starter | 2,000 |
| Growth | 2,500 |
| Pro | 3,000 |
| Enterprise | 5,000 |

(Yes, the free plan's per-entity limit is higher than Starter's — Sportmonks
doesn't scale this number strictly with price, it scales with league count
and overall account tier.)

### Other options found, not recommended for now

- **TheStatsAPI** — a newer, smaller competitor. Its own site
  ([thestatsapi.com](https://www.thestatsapi.com/)) advertises a Starter plan at
  $50/month for 150 competitions with xG and odds bundled in, 100,000
  requests/month at 120/minute. We could not find any independent (non-self-
  published) confirmation of its reliability or its actual terms of service — most
  search results about it are its own comparison blog posts. Read its real terms
  before trusting it with money.
- **Opta / Stats Perform, Wyscout, Sportradar** — the data broadcasters and
  bookmakers use. Enterprise-only sales process, no public self-serve pricing,
  realistically hundreds to thousands of pounds a month. Far outside the
  budget-first approach in `docs/PLAN.md`. Not worth chasing until Fairline has
  real revenue.
- **Understat, FBref, StatsBomb open data** — free, and Understat in particular
  is well known for xG, but none of these run an official commercial API.
  Understat has no public API or terms at all (third parties scrape its website);
  StatsBomb's open data is explicitly labelled for research/education, not
  commercial products. Using either would mean taking data from a site with no
  written permission to use it commercially, which breaks the spirit of this
  file. Skip for a paid product.
- **apifootball.com, football-api.com, live-score-api.com** — smaller
  alternatives that came up in research, but our research tools were blocked
  from reaching all three sites directly (network policy on this machine), so
  none of their pricing or terms could be checked ourselves. Don't use these
  without reading their terms first-hand.

### Recommendation

**Sportmonks Starter, €29/month (about £25)** is the cheapest option that
**clearly** allows commercial use in a paid website — its own terms say so in
plain English — and covers everything the pivot needs in one plan: recent form
(from fixture history), head-to-head, and basic match stats. Expected goals (xG)
needs the extra €24/month add-on, so budget about €53/month (~£46) if xG matters
from day one, or start without it and add xG once the product direction is
proven.

**Runner-up:** API-Football Pro, $19/month (about £15), is cheaper and covers
form, head-to-head and match stats (shots, corners, possession) in the base
plan. It is not the top recommendation because two things are still open: no
confirmed xG field, and its commercial-use terms could not be verified by us —
someone needs to read `api-sports.io/terms` by hand before signing up.

**football-data.org is not recommended** as the primary stats source for this
pivot: getting form + head-to-head + shot/possession stats together means
combining several named add-ons of uncertain stackability, it has no xG at any
price, and its commercial terms for the free tier are unwritten.

**One question for you (Ethan):** do you want expected goals (xG) from day one,
or is basic match stats (shots, possession, corners) enough to start with? That
is the difference between Sportmonks Starter alone (€29/mo) and Starter plus the
xG add-on (about €53/mo). My recommendation is to start without xG — add it once
we know the stats-and-price format is working — but it's your call since it's
your budget.

## The Odds API (live odds) — not in use yet

Planned for live odds (see `docs/PLAN.md`). Read the terms before the first call.
The plan notes two clauses that need a legal read: display is allowed only
"provided the data isn't the primary product being sold", and the data must not
be resold as a standalone product. The terms read so far say nothing about
bookmaker names, logos or affiliate links, so ask the provider in writing.
