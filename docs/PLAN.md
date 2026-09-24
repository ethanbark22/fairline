In plain English

We are building a website where you pick a football match, and it shows what the bookmakers' prices imply, what our own maths says, whether there is a gap in your favour, and how much to trust that answer. It never takes bets and never promises wins.

Where the numbers come from. A paid odds service supplies bookmaker prices. Our own code turns them into probabilities. Claude only writes the explanation and points out risks; it does not make up the numbers.
What it costs. About $30 a month for odds data (only once the model has proved itself), plus roughly one or two US cents each time someone runs an analysis.
What you do. Create a few accounts, paste in two keys, approve the changes Claude Code proposes, and check that the screens look right.
What we build first. One league, one type of bet, working end to end. Everything else waits until that works.
What could stop a public launch. Data licence questions and UK gambling advertising rules. These need proper advice, not just code.

Words you will keep seeing

Term	What it means
Repo	The project's folder of code stored on GitHub, with a full history of changes
Branch and pull request (PR)	A safe copy where Claude Code makes changes; the PR is a proposal you approve before it joins the real code
API	A way for our app to ask another service for data, such as bookmaker prices
API key	A secret password that lets our app use that service; never share it or paste it in public
Environment variable	A safe place to store a key so it is not written in the code
Database (Supabase)	Where all our information is stored: matches, prices, saved predictions, users
Migration	A numbered instruction that sets up or changes the database tables
Cron job	A task that runs by itself on a timer, like fetching new prices every 30 minutes
Deploy (Vercel)	Putting the latest version of the site live on the internet
Odds and implied probability	A price of 2.00 means the bookmaker thinks there is about a 50% chance; higher prices mean lower chances
Edge	Our estimated chance minus the bookmaker's implied chance; positive means possible value, not a sure win
Calibration	Checking whether things we call 70% likely really happen about 70% of the time
Summary and decisions

We build a greenfield Next.js + Supabase app and prove one loop first: Premier League match winner (1X2), from cached bookmaker odds to a Claude-written analysis stored as an immutable prediction. Nothing else ships until that loop works.

Decision	Choice	Why
Starting point	Fresh Next.js (TypeScript, Tailwind, shadcn/ui) repo	No existing repo was connected; wire to Vercel and Supabase once confirmed
First slice	Premier League, 1X2 (home / draw / away)	The example in the brief; three outcomes, deep bookmaker coverage
Baseline model	Elo-style ratings feeding a Poisson goals model	Transparent, testable, and calibratable before any ML
Odds source	The Odds API behind an OddsProvider interface	Swappable later for SportsDataIO or Sportradar
Claude's role	Explains and challenges; never computes probability, edge or confidence	Per the brief: numbers come from the model and confidence engine
Positioning	Research and analysis only, 18+, no bets accepted	Keeps the MVP outside sportsbook licensing

Three things I am assuming and will flag again where they matter: scheduled worker routes on Vercel or Supabase (no Redis/BullMQ yet) are enough for ingestion at MVP scale, football match stats come from a free or low-cost source rather than a paid enterprise feed, and the first launch market is the UK.

Budget-first approach (overrides the brief where they differ)

We spend nothing until the model has proved itself, then add costs one at a time as real users appear. Prices are from the Vercel Hobby and Supabase pages, read 24 September 2026.

Item	Cost while building	Cost once live
GitHub private repo	Free	Free
Vercel	Free on Hobby, which is limited to non-commercial personal use	From $20/month on Pro, needed once you charge anyone
Supabase	Free: 500 MB, but projects pause after a week of inactivity	From $25/month on Pro, for backups and no pausing
The Odds API	Free plan: 500 credits/month, enough to test lightly	$30/month for the 20,000-credit plan
Claude analysis (Anthropic API)	Prepay a small balance (about $5 to $10) and set a spending cap	About 1 cent per analysis
Football results data	Free tier or free historical files	Confirm commercial terms before launch

Your own Claude plan, which powers Claude Code, is separate and not counted here.

The order we spend money in

Build and test everything on free tiers, using free historical results and odds to test the model.
Run the backtest, which replays past seasons to see how the model would have done. This is the go or no-go point.
Only if the model holds up, pay $30 for live odds.
Launch free, with no payments system. Take Stripe and paid tiers only once people ask for more.
Move Vercel and Supabase to Pro at the moment you start charging, not before.

Changes to the brief

Brief says	Change to	Why
Build Stripe, tiers and credits in Phase 8	Free launch first; keep a simple free analysis limit only	No revenue to protect yet, and payments code is costly to build and maintain
Sentry, PostHog, Redis, BullMQ early	Leave out until there are real users	Each adds cost or complexity for no MVP benefit
Five sports, many markets	One league and one market until the loop works	Every extra market multiplies odds credits and testing
Model shown as finding value	Add the bookmakers' average price as a model input, and treat the backtest as the judge	See the warning below

A plain warning. Bookmaker prices on football match results are already very accurate. A simple ratings model will usually land close to the market, or slightly worse, so early edge numbers will often sit near zero. That is normal, and the honest result to show. The product's real value is clear explanations, price tracking and a transparent record of past predictions, not a promise of finding value every time. The backtest tells us early whether the model adds anything, before you pay for live data.

Architecture

Users never touch an upstream sports API: scheduled workers pull, validate and normalise data into Postgres, and the app reads only from our own tables and cache.

Odds APIfixtures + odds
Cron workersvalidate + normalise
Stats sourceresults + ratings
Supabase Postgresappend-only snapshots
Model layerElo + Poisson
Value + confidencedeterministic
Research packet
Claudestructured JSON
Prediction ledger+ analysis cache
Next.js app

Read left to right: only the workers talk to providers, and Claude sits after the numbers are already fixed.

Stack. Next.js App Router with TypeScript, Tailwind and shadcn/ui on Vercel; Supabase Postgres, Auth and row-level security; the Anthropic API for analysis; Stripe later. Ingestion runs as worker routes protected by a shared secret, which is enough at MVP volume. The scheduler depends on your Vercel plan: Hobby cron jobs run at most once a day, Pro allows once a minute. If you are on Hobby, Supabase pg_cron calling the routes is the no-cost alternative. Redis and BullMQ are deferred until polling load or job retries justify them.

Code layout. Provider and model code sits behind interfaces so nothing in the UI or API depends on a specific vendor.

Module	Responsibility
lib/providers/odds	OddsProvider interface; OddsApiProvider first, others later
lib/providers/stats	SportsStatsProvider, InjuryProvider, NewsProvider interfaces
lib/ingest	Zod-validated fetch, entity mapping, snapshot writes, failure logging
lib/models	PredictionModel interface; FootballMatchModel v1
lib/value	Implied probability, margin removal, edge, EV, minimum price
lib/confidence	Deterministic 0-100 score and LOW / MEDIUM / HIGH label
lib/ai	Research packet builder, prompt, Claude call, output schema validation
lib/credits	Ledger-based usage credits with idempotency keys
app/api/*	Public endpoints; internal worker routes are separate and secret-guarded

Caching. Current odds live in a current_odds view or table refreshed by the worker, so ten users or ten thousand read the same row. Analyses are cached by a hash of event, market, selection, price bucket, research snapshot and model version; a cache hit costs the user credits but not a Claude call. Claude is called only on an analysis request, never on a page view.

Polling. Fixture and odds cadence scales with kickoff proximity, using the quota-free events endpoint to detect what is upcoming before spending credits on odds. The exact schedule and its credit maths are in the cost section.

External APIs and licensing

The Odds API covers everything the first slice needs for about $30/month, but its terms include a clause we must clear before launch (see below). Details are from the pricing page, the v4 docs and the terms, read 23 September 2026.

The Odds API, endpoints we use

Endpoint	Use in MVP	Credit cost
GET /v4/sports	Confirm soccer_epl is in season	Free
GET /v4/sports/soccer_epl/events	Fixture list and kickoff times; detect new or changed events	Free
GET /v4/sports/soccer_epl/odds?regions=uk&markets=h2h	Slice 1: 1X2 prices from UK bookmakers for all upcoming games in one call	1 (markets x regions)
GET /v4/sports/soccer_epl/odds?markets=h2h,spreads,totals	Later expansion: handicap and totals	3 per region
GET /v4/sports/soccer_epl/events/{id}/odds	Extended markets (draw_no_bet, btts, player props) per event	Per market x region, per event
GET /v4/sports/soccer_epl/scores	Settlement results	1 to 2
Historical odds endpoints	Backtest and closing-line data	10 x markets x regions

Plans. Free is 500 credits/month; $30 gives 20,000, $59 gives 100,000, $119 gives 5M. Historical odds need a paid plan. Extended markets such as player props are only on the per-event endpoint, so they are expensive to poll across a full fixture list. That is why the brief's rule holds: we claim a market only after we have seen it supplied reliably.

Sports statistics (needed for the model). Match results, goals and fixtures for the Elo and Poisson baseline. Candidates:

Source	Notes	Status
football-data.org	Free tier (12 competitions, 10 calls/min); paid tiers from EUR 12 to 199/month	Confirm Premier League is on the free tier and commercial terms
football-data.co.uk	Free historical CSVs of results with odds columns	Could not be fetched during research; verify terms before using
The Odds API scores	Results for settlement only, no team stats	Use for settlement, not modelling

Injuries, lineups and news are deliberately left out of slice 1; the data-quality label will show LIMITED until a provider is chosen for them.

Licensing items to resolve, tracked in DATA_PROVIDERS.md. The Odds API terms permit display in an app, indefinite storage, derived calculations and model training. Two clauses need a legal read: the display permission applies "provided the data isn't the primary product being sold", and there is a ban on reselling data as a standalone product. Our subscription sells analysis, but odds are shown prominently, and the Elite bookmaker-comparison tier gets close to that line. The terms also expect responsible gambling messaging. I found no rules on bookmaker names or logos, or affiliate links, so we must ask the provider in writing. Rate limits were not stated on the pages I read.

Database schema and migrations

The schema follows the brief's conceptual list, delivered in five migrations so slice 1 needs only the first four. Two rules are enforced in the database, not just in code: odds history is append-only, and predictions cannot be edited after insert.

Migration	Tables	Purpose
0001_reference	sports, competitions, teams, players, bookmakers, provider_mappings	Canonical UUIDs plus (provider, provider_entity_id, entity_type) -> internal_id so no fuzzy name matching at analysis time
0002_events_odds	events, event_participants, markets, market_selections, odds_snapshots, view current_odds	Fixtures and append-only price history
0003_model	team_ratings, model_versions, model_runs, feature_snapshots, research_snapshots	Ratings and reproducible inputs for every run
0004_ledger	predictions, prediction_legs, prediction_results, analysis_cache	Immutable prediction record, settlement and cached Claude output
0005_users	profiles, subscriptions, usage_credits, credit_transactions, betslips, betslip_legs, saved_picks, alerts	Accounts, credits and betslip; built later

The two enforcement rules, in SQL:

sql
create table odds_snapshots (
  id           bigint generated always as identity primary key,
  event_id     uuid not null references events(id),
  bookmaker_id uuid not null references bookmakers(id),
  market_id    uuid not null references markets(id),
  selection_id uuid not null references market_selections(id),
  line         numeric,
  price        numeric(8,3) not null check (price > 1),
  provider     text not null,
  captured_at  timestamptz not null default now()
);
create index on odds_snapshots (event_id, market_id, captured_at desc);

create function forbid_mutation() returns trigger language plpgsql as $$
begin raise exception 'table % is append-only', tg_table_name; end $$;

create trigger odds_append_only before update or delete on odds_snapshots
  for each row execute function forbid_mutation();
create trigger predictions_immutable before update or delete on predictions
  for each row execute function forbid_mutation();

Predictions. The predictions table holds every field the brief lists (timestamps, price, model and market probability, edge, confidence, model_version, data_snapshot_id, research_snapshot_id, reasoning). Results and closing price live in the separate prediction_results table, written at settlement, so the original row never changes. A check requires created_at < event.kickoff.

Storage growth. Snapshots are stored only when a price changes, not on every poll, which keeps the table small on the free Supabase plan.

Security. Row-level security is on for every user table. Reference, odds and ledger tables are read-only to the anon role; all writes go through the service role in server code and workers. Seed data: one season of Premier League fixtures and results plus a handful of fake odds snapshots for tests.

First vertical slice

The slice is done when a user opens one Premier League fixture, clicks Analyse, and within about 10 seconds sees probability, market probability, edge, confidence and a Claude explanation, with an immutable prediction row saved. Build it in this order, each step shippable on its own. Per the budget-first approach, the model and backtest (steps 5 and 6) come before paid live odds.

Scaffold and data layer. Next.js app, Supabase client, migrations 0001 to 0004, seed teams, bookmakers and provider_mappings for the 20 Premier League clubs. (Done in the first Claude Code session, along with the value maths.)
Odds provider. OddsApiProvider implements getEvents and getOdds; every response is parsed with Zod and rejected if malformed. An event whose teams have no mapping goes to a quarantine table and is logged, never fuzzy-matched.
Ingestion cron. Events are refreshed from the free endpoint every 6 hours. Odds for h2h in region uk are polled every 30 minutes, tightening to every 10 minutes in the last 3 hours before kickoff. A new snapshot row is written only if a price changed.
Value maths (lib/value). Implied probability is 1 / price. Bookmaker margin is removed by normalising the three outcomes so they sum to 1; a better method (power or Shin) can replace it later behind the same function. Edge is model probability minus margin-free market probability. Minimum price is 1 / (model probability minus a buffer), with the buffer defaulting to 2 percentage points and tunable.
Football model v1 (football_1x2_v1). Elo ratings from past results (home advantage and K-factor as parameters) give an expected goal difference; a Poisson goals model turns that into home, draw and away probabilities. Ratings update nightly from new results.
Backtest. Validate with a walk-forward backtest on historical seasons (never using information from after each match) and report log loss and calibration against the bookmakers' closing prices before trusting any output. This is the go or no-go point for paying for live odds.
Confidence v1. A weighted 0-100 score from data completeness, price freshness, bookmaker agreement, edge size, and games played by each team, mapped to LOW, MEDIUM or HIGH. HIGH is disabled until enough settled predictions exist to check calibration; until then the label caps at MEDIUM and the UI says so.
Research packet and Claude. Build the compact packet from the brief (event, market, model output, form, market movement, data-quality state). Claude returns the JSON schema from the brief; we validate it with Zod, retry once on failure, and on a second failure return the numbers without narrative and charge no credit.
Ledger and cache. Insert the prediction before kickoff, store the analysis in analysis_cache under its hash, return the response shape in the brief's section 69.
Settlement. A nightly job reads final scores, writes prediction_results with win, loss or void and the closing price from the last snapshot before kickoff.

Injuries and lineups are intentionally not in this slice. With no lineup data the data-quality state is LIMITED, and the UI shows that plainly.

Environment, tests and screens

Environment variables. All secrets are server-side only; only the two public Supabase values reach the browser.

Variable	Scope	Purpose
NEXT_PUBLIC_SUPABASE_URL	Public	Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY	Public	Anon key, protected by RLS
SUPABASE_SERVICE_ROLE_KEY	Server	Workers and ledger writes
ODDS_API_KEY	Server	The Odds API
STATS_API_KEY	Server	Results and fixtures provider, once chosen
ANTHROPIC_API_KEY	Server	Claude analysis
CLAUDE_MODEL	Server	Model id, so it can change without a deploy
CRON_SECRET	Server	Authenticates scheduled calls to worker routes
STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET	Server	Only when paid tiers are added
SENTRY_DSN, NEXT_PUBLIC_POSTHOG_KEY	Mixed	Error tracking and analytics, only once there are real users

First automated tests (Vitest). Calculations come first because a silent error there corrupts everything downstream.

Area	Cases
Value maths	Implied probability; margin removal sums to 1; edge sign; minimum price; 1.08 at 90% is low value while 2.30 at 52% is positive (the brief's example)
Provider mapping	Known alias resolves; unmapped team quarantines; duplicate event from two polls is one event
Odds ingestion	Unchanged price writes no row; changed price appends; malformed payload rejected and logged
Model	Probabilities sum to 1; stronger home side has higher home win probability; no use of results after the prediction timestamp
Confidence	Stale odds lowers score; HIGH is blocked while calibration is unverified
AI output	Valid JSON passes; missing field, out-of-range probability and prose-wrapped JSON fail; Claude cannot change model probability
Ledger	UPDATE and DELETE on predictions and odds_snapshots raise; insert after kickoff is rejected
Security	RLS blocks reading another user's history; worker routes reject a missing CRON_SECRET

First UI screens. Visual direction is sportsbook meets TradingView: dense, dark-friendly, traffic-light confidence, no walls of AI text.

Fixtures list for the Premier League with best 1X2 prices and a timestamp on every price.
Event page with the three outcomes, bookmaker comparison, price movement and an Analyse button.
Analysis card in the brief's hierarchy: selection, best price, probability, market probability, edge, confidence, minimum price, why, what could go wrong, data-quality state.
Sign-in through Supabase Auth with an 18+ confirmation and responsible gambling footer.

Betslip, accumulator, picks and pricing pages come in later phases.

Cost per analysis and monthly budget

A single analysis should cost roughly 1 to 2 US cents in Claude usage, and fixed provider costs land near $30 to $45 a month once live, inside the brief's £50 to £100 target. Token counts below are my estimates until we measure real packets; prices are from the Claude pricing page, read 23 September 2026.

Item	Assumption	Cost
Single analysis, Sonnet 5	About 2,500 input and 700 output tokens at $2 and $10 per million	About $0.012
Same with cached system prompt	Cache reads bill at 10% of input rate	About $0.010
4-leg accumulator analysis	About 8,000 input and 1,500 output tokens	About $0.031
Cache hit on a shared analysis	No Claude call	$0

Batch processing halves these rates and suits the daily Pick of the Day scan, which is not interactive.

Odds credits. A h2h call for region uk costs 1 credit and returns every upcoming fixture. Polling every 30 minutes plus 10-minute polls in pre-kickoff windows is about 70 calls a day, so roughly 2,100 credits a month, plus about 250 for scores. That exceeds the free 500 credits and fits the $30 plan (20,000 credits) with room to add spreads and totals across two regions (about 13,000 credits a month).

Per-subscriber view. A Pro user spending all 100 credits on single analyses costs about $1.20 in Claude usage; an Elite user spending all 500 costs about $6 against £49.99 of revenue. Both sit below the brief's £5 variable cost target for an average subscriber, and shared caching should push real cost lower.

Monthly fixed cost once live	Estimate
The Odds API, 20K plan	$30 (about £23)
Football stats source	Free to EUR 12
Vercel Pro (needed once charging)	From $20
Supabase Pro (once live)	From $25
Sentry and PostHog	Not used at first

Not yet included: Stripe fees, injury and lineup data, and any web-research calls Claude might make.

Launch blockers

None of these stop us building the slice, but each must be closed before the product is public. I am not a lawyer; the legal rows need proper advice, as the brief already says.

Blocker	Why it matters	Action
Odds API "primary product" clause	Display is allowed only if the data is not the primary product sold	Ask the provider in writing whether our analysis subscription qualifies, especially bookmaker comparison
Bookmaker names, logos, affiliate links	The terms I read are silent on these	Get written confirmation; log in DATA_PROVIDERS.md
Stats provider terms	Commercial use and storage not confirmed for football-data.org or football-data.co.uk	Read full terms and pick one before adding form data
No injury or lineup source	Analyses are capped at data quality LIMITED without it	Evaluate a provider after slice 1
Calibration unproven	HIGH confidence would be unearned	Keep HIGH disabled until enough settled predictions and a calibration check exist
UK gambling and advertising rules	Pick of the Day may be treated as tipping; affiliate promotion is regulated	Legal advice on Gambling Commission, ASA and CAP rules, and required responsible gambling wording
Privacy and age gating	18+ product handling personal data	GDPR review, account deletion and data export, age confirmation at sign-up
Vercel plan	Hobby is non-commercial only and limits cron to once a day	Move to Pro when charging, or use Supabase pg_cron in the meantime

Marketing copy must avoid guaranteed-win, risk-free and easy-money language throughout, in the product, the emails and any store listings.

Build order and next steps
Order	Work	Status / needs from you
1	Next.js scaffold, Supabase migrations 0001 to 0004, seed data, lib/value with tests	Done in the first Claude Code session
2	Football model v1 and backtest on free historical data	Next; no paid services
3	Go or no-go on paying for live odds	Your decision, based on the backtest
4	OddsApiProvider, ingestion routes, snapshots	The Odds API key
5	Confidence v1, research packet, Claude call, ledger	Anthropic API key
6	Fixtures, event and analysis screens	Design feedback

Open questions (defaults assumed if not answered):

 Vercel plan: Hobby or Pro? (Assumed Hobby.)
 Existing or new Supabase project for development? (Assumed new.)
 Football stats source: free tier first, or a paid one? (Assumed free.)
 UK only, or US bookmakers too? (Assumed UK only.)
