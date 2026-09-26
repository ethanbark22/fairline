In plain English

We are building a website where you pick a Premier League match, and it shows you the facts a careful bettor would check by hand: recent form, the head-to-head record, and shots/possession/corners, next to what the bookmakers are offering — the best UK price, Pinnacle's price with its margin taken out (a fair-price reference point), and how the price has moved. Claude writes a short plain-English summary of the match and points out what could go wrong, using only the numbers we give it. It never predicts a result, never scores an "edge", and never takes bets or promises wins.

Where the numbers come from. A stats service (Sportmonks) supplies form, head-to-head and match stats. A paid odds service (The Odds API) supplies bookmaker prices. Our own code removes Pinnacle's margin to get a fair price and works out how prices have moved. Claude only writes the words; it does not make up any number, and every stat we show carries the sample size it's based on.
What it costs. About €29/month (~£25) for stats once we sign up, plus about $30/month for odds once the model has proved itself worth building on, plus roughly one or two US cents each time someone reads a match summary.
What you do. Create a few accounts, paste in two keys, approve the changes Claude Code proposes, and check that the screens look right.
What we build first. One league, one screen, working on sample data before any money is spent. Everything else waits until that works.
What could stop a public launch. Data licence questions and UK gambling advertising rules. These need proper advice, not just code.

Words you will keep seeing

Term	What it means
Repo	The project's folder of code stored on GitHub, with a full history of changes
Branch and pull request (PR)	A safe copy where Claude Code makes changes; the PR is a proposal you approve before it joins the real code
API	A way for our app to ask another service for data, such as bookmaker prices or match stats
API key	A secret password that lets our app use that service; never share it or paste it in public
Environment variable	A safe place to store a key so it is not written in the code
Database (Supabase)	Where all our information is stored: matches, prices, stats, users
Migration	A numbered instruction that sets up or changes the database tables
Cron job	A task that runs by itself on a timer, like fetching new prices every 30 minutes
Deploy (Vercel)	Putting the latest version of the site live on the internet
Odds and implied probability	A price of 2.00 means the bookmaker thinks there is about a 50% chance; higher prices mean lower chances
Margin (overround)	The extra percentage points a bookmaker builds into a full set of prices, so they add up to more than 100%. Removing it gives a "fair" price.
Sample size	How many matches or meetings a stat is based on. "3 home wins in 5" is a small sample; we show this next to every stat so nobody mistakes it for a certainty
Head-to-head	How the same two teams have done against each other in the past

Summary and decisions

We build a greenfield Next.js + Supabase app and prove one screen first: a Premier League match page showing recent form, head-to-head, shots/possession/corners and the price comparison, with a Claude-written summary. Nothing else ships until that screen works, and it is built and reviewed on sample data before any provider is paid for.

Decision	Choice	Why
Starting point	Fresh Next.js (TypeScript, Tailwind, shadcn/ui) repo	No existing repo was connected; wire to Vercel and Supabase once confirmed
First slice	Premier League, one match page	The example in the brief; deep bookmaker coverage, and Sportmonks covers it from its cheapest paid plan
Stats source	Sportmonks Starter plan (~€29/month, no expected goals) — not signed up yet	Cheapest option whose own terms clearly allow commercial use; see `docs/DATA_PROVIDERS.md`. We build on sample data until we're ready to pay.
Odds source	The Odds API behind an OddsProvider interface	Swappable later for SportsDataIO or Sportradar
Claude's role	Writes a short plain-English summary and risks from the numbers we supply; never calculates a stat, a price or anything that looks like a probability	No in-house probability model — see "Changes to the brief" below
Positioning	Research and price comparison only, 18+, no bets accepted	Keeps the MVP outside sportsbook licensing

Three things I am assuming and will flag again where they matter: scheduled worker routes on Vercel or Supabase (no Redis/BullMQ yet) are enough for ingestion at MVP scale, Sportmonks' Starter plan is enough for form, head-to-head and match stats without expected goals, and the first launch market is the UK.

Budget-first approach (overrides the brief where they differ)

We spend nothing until the screens have been reviewed on sample data, then add costs one at a time as real users appear. Prices are from the Vercel Hobby, Supabase and Sportmonks pages, read 24 September 2026.

Item	Cost while building	Cost once live
GitHub private repo	Free	Free
Vercel	Free on Hobby, which is limited to non-commercial personal use	From $20/month on Pro, needed once you charge anyone
Supabase	Free: 500 MB, but projects pause after a week of inactivity	From $25/month on Pro, for backups and no pausing
The Odds API	Free plan: 500 credits/month, enough to test lightly	$30/month for the 20,000-credit plan
Sportmonks (football stats)	Not signed up yet; sample data only	Starter plan, ~€29/month (~£25), see `docs/DATA_PROVIDERS.md`
Claude analysis (Anthropic API)	Prepay a small balance (about $5 to $10) and set a spending cap	About 1 cent per match summary

Your own Claude plan, which powers Claude Code, is separate and not counted here.

The order we spend money in

Build and review the fixtures list and match page on clearly labelled sample data. Check the numbers read well and the sample sizes make the stats trustworthy at a glance. This is the go or no-go point.
Only if the screens hold up, sign up for Sportmonks Starter (stats, ~€29/month) and The Odds API (prices, ~$30/month once past the free credits).
Launch free, with no payments system. Take Stripe and paid tiers only once people ask for more.
Move Vercel and Supabase to Pro at the moment you start charging, not before.

Changes to the brief

Brief says	Change to	Why
Show a probability, an edge (value) score and a confidence rating, backed by our own model	Drop the in-house model, edge and confidence entirely. Show recent form, head-to-head, shots/possession/corners and the price comparison (best UK price, Pinnacle's fair price, price movement), with a sample size on every stat.	Building and proving a reliable probability model is a much bigger project than this MVP needs. The price-comparison research already run (see `docs/research/`) shows the real gaps between UK bookmakers and Pinnacle's fair price are small and noisy — an honest stats-and-price screen is faster to ship and doesn't risk implying we can predict results.
Save every analysis as an immutable prediction, for later calibration checking	Drop the prediction ledger. Nothing is "predicted", so there's nothing to grade.	Follows from dropping the model; calibration only matters if we claim a probability.
Build Stripe, tiers and credits in Phase 8	Free launch first; keep a simple free-summary limit only	No revenue to protect yet, and payments code is costly to build and maintain
Sentry, PostHog, Redis, BullMQ early	Leave out until there are real users	Each adds cost or complexity for no MVP benefit
Five sports, many markets	One league and one screen until it reads well	Every extra market multiplies stats and odds usage, and testing

A plain warning. Bookmaker prices on football match results are already very accurate, and a simple in-house model would usually land close to the market or slightly worse. Rather than dress that up as an "edge", this product shows the same facts a knowledgeable bettor already checks — form, head-to-head, match stats and the price gap to Pinnacle's fair price — clearly, with their sample sizes, and lets the reader judge. That is a smaller promise, but an honest one, and much cheaper to build and keep correct.

Architecture

Users never touch an upstream sports API: scheduled workers pull, validate and normalise data into Postgres, and the app reads only from our own tables and cache.

Odds API → fixtures + prices
Sportmonks → fixtures + form + head-to-head + match stats
Cron workers → validate + normalise both
Supabase Postgres → append-only snapshots (odds and stats)
Price maths → implied probability, margin removal, price movement (deterministic)
Research packet → Claude → plain-English summary + risks (structured JSON, cached)
Next.js app → reads only from our own tables and the analysis cache

Read left to right: only the workers talk to providers, and Claude sits after the numbers are already fixed and only ever narrates them.

Stack. Next.js App Router with TypeScript, Tailwind and shadcn/ui on Vercel; Supabase Postgres, Auth and row-level security; the Anthropic API for the match summary; Stripe later. Ingestion runs as worker routes protected by a shared secret, which is enough at MVP volume. The scheduler depends on your Vercel plan: Hobby cron jobs run at most once a day, Pro allows once a minute. If you are on Hobby, Supabase pg_cron calling the routes is the no-cost alternative. Redis and BullMQ are deferred until polling load or job retries justify them.

Code layout. Provider code sits behind interfaces so nothing in the UI or API depends on a specific vendor. A sample implementation of each interface lets us build and review screens before any provider is paid for.

Module	Responsibility
lib/providers/odds	OddsProvider interface; SampleOddsProvider now, OddsApiProvider later
lib/providers/stats	FootballStatsProvider interface; SampleFootballStatsProvider now, SportmonksStatsProvider later (not signed up yet)
lib/ingest	Zod-validated fetch, entity mapping, snapshot writes, failure logging (built once we're ingesting real data)
lib/price	Implied probability, margin removal (Pinnacle's fair price), price movement
lib/ai	Research packet builder, prompt, Claude call, output schema validation — writes prose only, never a number
app/api/*	Public endpoints; internal worker routes are separate and secret-guarded

Caching. Current prices and current stats live in views/tables refreshed by the workers, so ten users or ten thousand read the same row. Match summaries are cached by a hash of fixture, stats snapshot, price snapshot and prompt version; a cache hit costs no Claude call. Claude is called only on a summary request, never on a page view.

Polling. Fixture cadence for both providers scales with kickoff proximity, using free/cheap endpoints to detect what is upcoming before spending credits on prices or stats. The exact schedule and its cost maths are in the cost section.

External APIs and licensing

The Odds API covers bookmaker prices for about $30/month once past the free tier, but its terms include a clause we must clear before launch (see below). Sportmonks covers form, head-to-head and match stats from €29/month, with clearly commercial-friendly terms — see `docs/DATA_PROVIDERS.md` for the full research and quotes. Neither has been signed up for yet.

The Odds API, endpoints we use

Endpoint	Use in MVP	Credit cost
GET /v4/sports	Confirm soccer_epl is in season	Free
GET /v4/sports/soccer_epl/events	Fixture list and kickoff times; detect new or changed events	Free
GET /v4/sports/soccer_epl/odds?regions=uk&markets=h2h	Best UK price per outcome for all upcoming games in one call	1 (markets x regions)
GET /v4/sports/soccer_epl/odds?regions=eu&markets=h2h&bookmakers=pinnacle	Pinnacle's price, margin removed for the fair-price reference	1
GET /v4/sports/soccer_epl/scores	Confirming a fixture has kicked off, so price movement freezes	1 to 2
Historical odds endpoints	Price-movement history if we want more than "opening vs current"	10 x markets x regions

Plans. Free is 500 credits/month; $30 gives 20,000, $59 gives 100,000, $119 gives 5M.

Football stats. Full comparison, pricing and quoted commercial terms are in `docs/DATA_PROVIDERS.md`. Short version: **Sportmonks Starter (~€29/month, ~£25) is the intended source** — its own terms plainly allow commercial use, and its Starter plan covers form, head-to-head and match stats (shots, possession, corners) for up to 5 leagues including the Premier League. It does not include expected goals (xG); that is a further ~€24/month add-on we are not taking yet. **We have not signed up.** Sportmonks' free plan only covers the Danish Superliga and Scottish Premiership, not the Premier League, so it cannot be used to build this slice — see the free-plan note in `docs/DATA_PROVIDERS.md` for the details and the terms we read.

Licensing items to resolve, tracked in `docs/DATA_PROVIDERS.md`. The Odds API terms permit display in an app, indefinite storage, derived calculations and model training. Two clauses need a legal read: the display permission applies "provided the data isn't the primary product being sold", and there is a ban on reselling data as a standalone product. Our price-comparison screen shows odds prominently, so this needs a written answer from the provider before launch. The terms also expect responsible gambling messaging. I found no rules on bookmaker names or logos, or affiliate links, so we must ask the provider in writing.

Database schema and migrations

Migrations `0001_reference` and `0002_events_odds` are unchanged and still what this slice needs: canonical teams/bookmakers/provider_mappings, and the append-only `odds_snapshots` table. `0003_model` and `0004_ledger`, built for the earlier probability-model approach, are already applied and stay in the repo and its history, but nothing in the current plan depends on them any more — we are not dropping those tables yet (that is a real schema change on a real database and needs your sign-off first, per the "never overwrite Supabase without checking" rule), just not building on top of them. A new migration, `0005_stats_snapshots`, will add an append-only `stats_snapshots` table (recent form, head-to-head, shots/possession/corners, one row per capture, same pattern as `odds_snapshots`) once we're ingesting real Sportmonks data — not written yet, this plan comes first.

The one enforcement rule this slice needs, in SQL (already in place from `0002_events_odds`):

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

The future `stats_snapshots` table will carry the same `forbid_mutation` trigger, so a head-to-head record or a form line can never be quietly edited after the fact — only appended to.

Storage growth. Snapshots are stored only when a value changes, not on every poll, which keeps the tables small on the free Supabase plan.

Security. Row-level security is on for every user table, once there are user tables. Reference and odds tables are read-only to the anon role; all writes go through the service role in server code and workers. Seed data: one season of Premier League fixtures and results, plus a handful of fake odds snapshots for tests.

First vertical slice

The slice is done when a user opens the fixtures list, picks one Premier League match, and sees recent form, head-to-head (with its sample size), shots/possession/corners, the price comparison (best UK price, Pinnacle's fair price, price movement) and a short Claude summary with risks, all in one screen. Build it in this order, each step shippable on its own. Per the budget-first approach, steps 1 to 3 (sample data, screens, review) come before any provider is paid for.

Scaffold and data layer. Next.js app, Supabase client, migrations 0001 to 0002, seed teams, bookmakers and provider_mappings for the 20 Premier League clubs, and `lib/price` with tests. (Done in earlier Claude Code sessions.)
Provider interfaces and sample data. `OddsProvider` and `FootballStatsProvider` interfaces, each with a sample implementation returning clearly labelled fake data — realistic enough to judge the screens, obviously fake so nobody mistakes it for live data.
Fixtures list and match page. Built against the sample providers: fixtures list with best UK price and Pinnacle fair price per outcome; match page with form, head-to-head, shots/possession/corners (sample sizes shown throughout) and the price comparison. A labelled sample of what Claude's summary will look like, not yet a real Claude call.
Go or no-go on paying for stats and prices, based on how the screens read. Your decision.
Real providers. `OddsApiProvider` and `SportmonksStatsProvider` implement the same interfaces; every response is parsed with Zod and rejected if malformed. An event whose teams have no mapping goes to a quarantine table and is logged, never fuzzy-matched.
Ingestion crons. Events refreshed every 6 hours. Prices for h2h in region uk (plus Pinnacle in region eu) polled every 30 minutes, tightening to every 10 minutes in the last 3 hours before kickoff. Stats refreshed after each round of fixtures. A new snapshot row is written only if a value changed.
Claude summary. Build the compact research packet (event, form, head-to-head, shots/possession/corners, price comparison). Claude returns the JSON schema from the brief's plain-English-summary section; we validate it with Zod, retry once on failure, and on a second failure show the numbers with no written summary.
Caching. Store each summary in `analysis_cache` under a hash of fixture, stats snapshot, price snapshot and prompt version, so repeat views don't repeat Claude calls.

Injuries and lineups are intentionally not in this slice; add a source later only once we've checked it's reliable.

Environment, tests and screens

Environment variables. All secrets are server-side only; only the two public Supabase values reach the browser.

Variable	Scope	Purpose
NEXT_PUBLIC_SUPABASE_URL	Public	Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY	Public	Anon key, protected by RLS
SUPABASE_SERVICE_ROLE_KEY	Server	Workers and cache writes
ODDS_API_KEY	Server	The Odds API
SPORTMONKS_API_KEY	Server	Sportmonks, once we sign up
ANTHROPIC_API_KEY	Server	Claude match summaries
CLAUDE_MODEL	Server	Model id, so it can change without a deploy
CRON_SECRET	Server	Authenticates scheduled calls to worker routes
STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET	Server	Only when paid tiers are added
SENTRY_DSN, NEXT_PUBLIC_POSTHOG_KEY	Mixed	Error tracking and analytics, only once there are real users

First automated tests (Vitest). Calculations come first because a silent error there corrupts everything downstream.

Area	Cases
Price maths	Implied probability; margin removal sums to 1; Pinnacle's fair price from margin-removed probability; price-movement direction and size
Provider mapping	Known alias resolves; unmapped team quarantines; duplicate event from two polls is one event
Odds and stats ingestion	Unchanged value writes no row; changed value appends; malformed payload rejected and logged
Sample size	Every displayed stat carries the count it's based on; a stat with too small a sample (e.g. 0 or 1 head-to-head meetings) is flagged as insufficient rather than shown plainly
AI output	Valid JSON passes; missing field or prose-wrapped JSON fails; Claude's reply cannot change a stat or a price, only narrate it
Ledger	UPDATE and DELETE on `odds_snapshots` (and later `stats_snapshots`) raise
Security	RLS blocks reading another user's data; worker routes reject a missing CRON_SECRET

First UI screens. Visual direction is a real sportsbook (bet365-style price buttons and betslip) in a dark, dense theme with its own colour palette and type (Space Grotesk for headings and prices, Inter for body and tables), while staying strictly research-and-analysis: nothing here places a bet or moves money. Built first on sample data, then wired to real providers once we sign up.

Markets covered: Match Winner (1X2), Total Corners (Over/Under a line) and Total Cards (Over/Under a line), each with the same best-UK/Pinnacle-fair-price/price-movement treatment. More markets can be added later behind the same `MarketKey` pattern in `lib/providers/odds/types.ts`.

Fixtures list for the Premier League: one row per match with the Match Winner market's best UK price and Pinnacle's fair price per outcome, three clickable price buttons (Home/Draw/Away) per row, a timestamp on every price, and badges naming the other markets (Corners, Cards) available on the match page — kept off the list itself so it doesn't get cluttered, the same way a sportsbook's front page shows one market and the event page shows the rest.
Match page: recent form, head-to-head (with sample size), shots/possession/corners/cards (with sample size), a market-tab switcher (Match Winner / Total Corners / Total Cards) with clickable price buttons, fair price and price movement per market, and a short Claude summary with what could go wrong.
Betslip: a fixed sidebar on desktop (a slide-up sheet from a bottom bar on narrow screens), holding one or more selections as an accumulator, each leg removable, with the combined price shown. A slip can hold at most one leg per (fixture, market) pair — picking a different outcome in the same market swaps the leg. Legs sharing a match (even across different markets), or sharing a team across different matches, are flagged as possibly correlated instead of folded into a single "true" combined chance — see the rule in CLAUDE.md.
"Analyse Bet" (never "Place Bet") takes the user to a full-page analysis screen (`/betslip/analysis`) instead of growing the sidebar — a brief loading state, then a summary (combined price, how many legs need to win, the correlation warning) followed by each leg as its own card in a responsive grid, with its price and a compact form/head-to-head summary, easy to scan even at 8-10 legs. Placeholder, clearly labelled sample content for now, wired to the real analysis engine (lib/ai) later. It never places a bet or moves money.
Sign-in through Supabase Auth with an 18+ confirmation and responsible gambling footer (later, once accounts are needed) — the footer and 18+ messaging are already on every screen, including the betslip itself.

Picks and pricing pages come in later phases.

Cost per match summary and monthly budget

A single match summary should cost roughly 1 to 2 US cents in Claude usage, and fixed provider costs land near €55 to €60 a month (~£50) once live, inside the brief's £50 to £100 target. Token counts below are estimates until we measure real packets; prices are from the Claude pricing page, read 23 September 2026.

Item	Assumption	Cost
Single match summary, Sonnet 5	About 2,500 input and 700 output tokens at $2 and $10 per million	About $0.012
Same with cached system prompt	Cache reads bill at 10% of input rate	About $0.010
Cache hit on a shared summary	No Claude call	$0

Batch processing halves these rates, useful for any future daily digest that isn't interactive.

Monthly fixed cost once live	Estimate
The Odds API, 20K plan	$30 (about £23)
Sportmonks Starter	€29 (about £25)
Vercel Pro (needed once charging)	From $20
Supabase Pro (once live)	From $25
Sentry and PostHog	Not used at first

Not yet included: Stripe fees, injury and lineup data, and any web-research calls Claude might make.

Launch blockers

None of these stop us building the slice, but each must be closed before the product is public. I am not a lawyer; the legal rows need proper advice, as the brief already says.

Blocker	Why it matters	Action
Odds API "primary product" clause	Display is allowed only if the data is not the primary product sold	Ask the provider in writing whether our price-comparison screen qualifies
Bookmaker names, logos, affiliate links	The terms I read are silent on these	Get written confirmation; log in DATA_PROVIDERS.md
Sportmonks not signed up	Stats screens run on sample data until we pay	Sign up once the screens are approved (see build order)
No injury or lineup source	Match pages are missing this context for now	Evaluate a provider after slice 1
UK gambling and advertising rules	Price comparison could be read as tipping; affiliate promotion is regulated	Legal advice on Gambling Commission, ASA and CAP rules, and required responsible gambling wording
Privacy and age gating	18+ product handling personal data	GDPR review, account deletion and data export, age confirmation at sign-up
Vercel plan	Hobby is non-commercial only and limits cron to once a day	Move to Pro when charging, or use Supabase pg_cron in the meantime

Marketing copy must avoid guaranteed-win, risk-free and easy-money language throughout, in the product, the emails and any store listings.

Build order and next steps
Order	Work	Status / needs from you
1	Next.js scaffold, Supabase migrations 0001 to 0002, seed data, lib/price with tests	Done in earlier Claude Code sessions
2	Fixtures list and match page on sample data, stats and odds behind interfaces	Done in this session
3	Go or no-go on paying for Sportmonks and The Odds API	Your decision, based on the screens
4	OddsApiProvider and SportmonksStatsProvider, ingestion routes, snapshots	Both API keys
5	Claude summary and caching	Anthropic API key
6	Real screens wired to real data, sign-in	Design feedback

Open questions (defaults assumed if not answered):

 Vercel plan: Hobby or Pro? (Assumed Hobby.)
 Existing or new Supabase project for development? (Assumed new.)
 Sign up for Sportmonks Starter (~€29/month) now, or keep building on sample data a while longer? (Assumed: sample data for now — see the go/no-go step above.)
 UK only, or US bookmakers too? (Assumed UK only.)
