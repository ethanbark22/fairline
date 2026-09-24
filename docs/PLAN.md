AI Sports Betting Research Platform — Product & Technical Specification
Master Brief for Claude Code

Document purpose: This is the master product brief for building a consumer-facing sports betting research and analytics platform. Treat this as the source of truth for architecture, product direction, MVP scope, data strategy, AI behaviour, monetisation, and technical standards.

1. Product Vision

Build a polished consumer-facing web platform that looks and feels similar to a modern sports betting site, but does not accept bets or hold customer funds in the MVP.

The platform helps users research bets before placing them elsewhere.

Core proposition:

Build your bet. Analyse it. Understand the probability, value, evidence and risks before you place it.

The product should combine:

live/current bookmaker odds
sports statistics
historical data
injuries and lineups
relevant news/context
quantitative probability models
market-implied probability
expected value / edge
AI research and explanation
accumulator analysis
confidence classification
bookmaker price comparison
historical prediction tracking

The AI must not simply hallucinate a prediction. Quantitative facts should come from structured data and/or clearly identified sources. Claude should act primarily as a research analyst, critic and explanation layer, sitting on top of a quantitative data/model pipeline.

The long-term vision is a serious sports betting research terminal for consumers, potentially expanding into subscriptions, affiliate revenue, alerts, premium research, and eventually B2B/API products.

2. Important Product Positioning

Do NOT position the product as:

a magic AI tipster
guaranteed winners
a system that can reliably make people money
an AI that knows the future
a gambling replacement or source of financial security

Position it as:

AI-powered sports betting research and analysis.

The core UI should distinguish between:

Probability

The model's estimated probability that the selection wins.

Market probability

The probability implied by the current price, accounting for the relevant market assumptions.

Edge / Value

The difference between model probability and market-implied probability, with proper consideration of bookmaker margin where applicable.

Confidence

How reliable the system considers the analysis/probability estimate, based on measurable factors such as model calibration, data quality, edge, agreement between models, lineup certainty, market stability, sample size and uncertainty.

Confidence is NOT simply Claude saying "I'm 90% confident."

3. MVP Business Model

The initial product should NOT accept bets.

Users build a betslip/accumulator and receive analysis. If appropriate and legally/commercially permitted, bookmaker affiliate links can eventually allow users to click through to a bookmaker.

Potential revenue streams:

Subscription plans
Bookmaker affiliate revenue
Premium research/picks
Alerts
Eventually B2B/API access

Initial pricing hypothesis:

Free
£0/month
3 analyses/month
Pick of the Day
basic odds
basic betslip/accumulator builder
limited research
Pro
£19.99/month
100 analyses/month
unlimited betslip building
accumulator analysis
player props
value/edge information
odds movement
model probability
confidence
AI research
prediction history
Elite
£49.99/month
500 analyses/month
everything in Pro
deeper player props
advanced statistical breakdowns
line movement
bookmaker comparison
custom filters
AI bet finder
personalised daily research
advanced accumulator analysis
alerts

These are initial hypotheses, not immutable requirements. Instrument usage and revisit pricing based on real usage.

Do NOT initially offer unlimited AI analysis. Usage limits protect against runaway API costs.

Potential future high-end tier:

~£99/month for ~1,000 analyses
or ~£199/month for serious power users/syndicates with bulk analysis, API access, custom alerts, exports and advanced data
4. Cost Principles

The founder already has:

Vercel
Supabase

Target initial incremental operating budget is approximately £50–£100/month, increasing only when product usage justifies it.

Initial costs should primarily be:

odds API
sports statistics/data API
Claude API
small amounts of infrastructure/software

Do NOT buy expensive enterprise sports-data licensing before validating the product.

Architecture must be designed so that costs do not scale linearly with users unnecessarily.

Critical principle:

Users should consume cached/normalised data wherever possible rather than each triggering separate upstream sports API calls.

Example:

text
Odds Provider
     ↓
Scheduled ingestion
     ↓
Supabase/Postgres
     ↓
Cached current odds
     ↓
Hundreds/thousands of users

Likewise, identical analyses should be cacheable/shared where the underlying event, market, odds and research packet have not materially changed.

5. Sports

Priority sports:

Football / soccer
Tennis
NBA
MLB
NHL

NFL may be added later if desired.

The platform should be architected so sports are modular rather than hard-coded into one prediction engine.

Each sport should have its own:

data adapters
feature engineering
probability/model logic
market mappings
confidence rules
validation/backtesting
6. Markets

The product should ultimately support:

General
moneyline / match winner
spreads / handicaps
totals / over-under
Football

Potential markets:

1X2
draw no bet
Asian handicap
spreads
match totals
team totals
BTTS
corners
cards
anytime scorer
shots
shots on target
assists
other player props where reliable data exists
Tennis
match winner
set handicap
game handicap
total games
player games
sets
aces
double faults
other supported player props
NBA
moneyline
spread
game total
team total
player points
rebounds
assists
threes
steals
blocks
PRA
points + rebounds
points + assists
other available player combinations
MLB
moneyline
run line
game total
first five
team totals
pitcher strikeouts
pitcher outs
pitcher hits allowed
batter hits
total bases
RBI
runs
home runs
other supported props
NHL
moneyline
puck line
game total
team totals
player points
player shots
goalie saves
other supported props

NFL, if added:

moneyline
spread
totals
passing yards
rushing yards
receiving yards
receptions
touchdowns
completions
attempts
interceptions
player combinations

Do not claim a market is supported until the selected data provider actually supplies it reliably.

7. Odds/Data Provider Strategy

Start with a small number of providers.

Primary odds provider candidate: The Odds API

Investigate/use for MVP:

fixtures/events
bookmaker odds
moneyline
spreads
totals
selected player props
historical odds where commercially licensed

Do not assume that "football odds" means every football player prop is available. Provider market coverage varies by league, bookmaker and jurisdiction.

The provider must be evaluated for:

commercial use
caching/storage rights
display rights
historical-data rights
derived analytics/model rights
bookmaker-name/logo usage
affiliate usage
geographic coverage
rate limits
market coverage
Secondary/statistics provider candidates

Evaluate providers such as:

SportsDataIO
Sportradar
other specialist providers as appropriate

SportsDataIO can potentially provide:

player/team statistics
injuries
lineups
odds
player props
historical information
line movement

Sportradar is a potential future enterprise-grade provider for broader bookmaker/market/player-prop coverage.

Do not commit to expensive enterprise licensing before MVP validation.

8. Data Licensing

This is a major business requirement.

For every provider, verify contractually whether the product is allowed to:

display data publicly
use data commercially
store/cache data
retain historical snapshots
train statistical/ML models
create derived analytics
show bookmaker names
show bookmaker logos
show player names
show team/competition names
use affiliate links
redistribute derived data
operate in UK/US/other markets
use the data for betting recommendations
expose derived data through an API

Do not assume API access equals public display/redistribution rights.

Track all data sources and licence terms in a DATA_PROVIDERS.md document.

9. Sports Data Required

The platform needs four main data categories.

A. Odds
bookmaker
market
selection
line
price
timestamp
opening price
current price
closing price where available
bookmaker consensus
market movement
B. Sports statistics
team stats
player stats
historical performance
advanced metrics
opponent strength
splits
home/away
surface where applicable
rest
schedule
pace/tempo
etc.
C. Context/research
injuries
suspensions
confirmed/probable lineups
starting pitchers
starting goalies
expected minutes
rotation information
official team announcements
press conferences
relevant reputable news
weather where relevant
travel/fatigue
schedule congestion
D. Results/settlement

Every published prediction must eventually be linked to:

event result
market result
selection result
win/loss/push/void
closing price
10. Historical Data and Prediction Ledger

This is essential.

Every prediction must be recorded before the event begins and become immutable.

Minimum prediction record:

text
prediction_id
timestamp_created
event_id
sport
competition
market
selection
line
bookmaker
price_at_prediction
model_probability
market_probability
edge
confidence
model_version
data_snapshot_id
research_snapshot_id
reasoning
result
closing_price
settlement_timestamp

Never rewrite historical predictions when:

odds move
injury news changes
lineup changes
the model changes
Claude changes its opinion

The original prediction must remain exactly as published.

This is required for:

performance tracking
calibration
backtesting
credibility
transparent historical reporting
future regulatory/advertising review
11. Database

Use PostgreSQL via the existing Supabase project.

Initial conceptual schema:

text
sports
competitions
teams
players

events
event_participants

bookmakers

markets
market_selections
odds_snapshots

team_stats
player_stats
injuries
lineups
weather
news_articles

predictions
prediction_legs
prediction_results

model_versions
model_runs
feature_snapshots
research_snapshots

users
subscriptions
usage_credits
betslips
betslip_legs
saved_picks
alerts

Important:

Never overwrite odds history.

Use an append-only odds_snapshots structure:

text
event_id
bookmaker_id
market_id
selection_id
line
price
timestamp

This enables:

line movement
opening/current/closing comparison
historical analysis
backtesting
closing-line value
market research
12. Entity Normalisation

Different providers may identify the same entity differently.

Example:

text
Manchester United
Man United
Manchester Utd
MUN

The system needs canonical internal IDs.

Create:

text
showguy_team_id
showguy_player_id
showguy_event_id

Then maintain provider mappings.

Example:

text
provider
provider_entity_id
internal_entity_id
entity_type

This is critical when joining:

odds
stats
injuries
news
lineups
results

Do not rely on fuzzy string matching during every analysis.

13. Architecture

Recommended initial stack:

Frontend
Next.js
TypeScript
Tailwind CSS
shadcn/ui
Backend
Next.js API routes/server actions initially
TypeScript
Database
Supabase/PostgreSQL
AI
Claude API
Statistical modelling
Start with TypeScript/simple statistical models if sufficient
Add Python modelling services when genuinely needed
Background jobs
Redis + BullMQ or equivalent
scheduled data ingestion
odds refresh
research ingestion
result settlement
model evaluation
Hosting
existing Vercel
existing Supabase
add worker hosting only when necessary
Analytics
PostHog or equivalent
Error tracking
Sentry or equivalent
Authentication
Supabase Auth
Payments
Stripe

Do not over-engineer the MVP.

14. Data Ingestion Architecture

Do NOT fetch upstream sports APIs directly from every user request.

Preferred architecture:

text
External APIs
     ↓
Scheduled ingestion workers
     ↓
Validation
     ↓
Normalisation
     ↓
PostgreSQL
     ↓
Cache
     ↓
Application

For odds:

text
Odds provider
      ↓
Poll/scheduled job
      ↓
Normalise bookmaker/market/selection
      ↓
Store snapshot
      ↓
Update current-odds cache

Use appropriate polling frequencies based on:

event proximity
market importance
API quota
live vs pre-match status

Do not consume live-level frequency when the product only needs pre-match data.

15. AI Architecture

The core architecture should be:

text
             SPORTS DATA
                  │
       ┌──────────┼───────────┐
       ↓          ↓           ↓
     ODDS        STATS       NEWS
       │          │           │
       └──────────┼───────────┘
                  ↓
           NORMALISATION
                  ↓
          FEATURE ENGINEERING
                  ↓
       SPORT-SPECIFIC MODELS
                  ↓
             PROBABILITY
                  ↓
           VALUE CALCULATION
                  ↓
          CONFIDENCE ENGINE
                  ↓
                CLAUDE
                  ↓
         HUMAN-READABLE RESULT

Claude should NOT be responsible for inventing or calculating core numerical facts when structured data is available.

16. Quantitative Model Layer

For every market:

Collect structured data
Run sport/market-specific model
Produce estimated probability
Calculate market-implied probability
Calculate edge/value
Assess uncertainty
Pass structured research packet to Claude

Example:

text
Model probability: 0.618
Market implied probability: 0.581
Edge: +0.037

The exact probability methodology must be documented.

Possible modelling approaches:

Elo
logistic regression
Poisson/negative binomial for football scoring
player projection models
Bayesian models
gradient boosting
simulation
ensemble models

Do not immediately build a complex ML model. Start with a transparent baseline and prove calibration.

17. Confidence Engine

Confidence should be a separate deterministic/scientific layer.

Potential factors:

text
Model calibration
Model-market agreement
Estimated edge
Data completeness
Lineup certainty
Injury uncertainty
Market liquidity
Price freshness
Historical sample size
Cross-model agreement
Prediction variance

Potential output:

text
confidence_score: 0-100
confidence_label: LOW | MEDIUM | HIGH

Traffic-light UI:

GREEN = HIGH
AMBER = MEDIUM
RED = LOW

The thresholds must be documented and later validated against historical performance.

Do not simply map:

70% probability = HIGH
50% probability = MEDIUM

Probability and confidence measure different things.

18. Critical Distinction: Probability vs Confidence vs Value

Example:

Bet A

Model probability = 90% Odds = 1.08

Very high probability does not necessarily mean good value.

Bet B

Model probability = 52% Odds = 2.30

Lower probability, but potentially much greater value.

Therefore the UI should always show:

text
Probability
Market probability
Edge
Confidence

Do not collapse them into one "AI score."

19. Claude Research Layer

Claude's role:

Research analyst

Summarise relevant evidence.

Contrarian

Actively search for evidence that could invalidate the pick.

Context analyst

Identify:

injuries
lineups
schedule issues
tactical matchup
weather
fatigue
unusual market movement
Explanation layer

Explain why the model reached its result.

Claude should not override structured data without explicitly identifying why.

20. Research Packet

Instead of sending Claude a blank question, construct a structured packet.

Example:

text
EVENT
Arsenal vs Manchester City
Premier League
22 September 2026

MARKET
Arsenal +1.5
Current odds: 1.72

MODEL
Probability: 61.8%
Market probability: 58.1%
Edge: +3.7%

TEAM DATA
...
...

INJURIES
...
...

LINEUPS
...
...

RECENT FORM
...
...

MARKET MOVEMENT
Opening: 1.88
Current: 1.72

CONTRARY EVIDENCE
...

Then ask Claude to:

evaluate the evidence
identify missing/contradictory information
challenge the model
summarise the key factors
explain the main risks
return structured JSON
21. Structured Claude Output

Do not depend on parsing free-form prose.

Require structured output such as:

json
{
  "probability": 0.618,
  "confidence_score": 82,
  "confidence_label": "HIGH",
  "edge": 0.037,
  "key_factors": [],
  "contrary_factors": [],
  "injury_risk": "LOW",
  "lineup_risk": "MEDIUM",
  "market_risk": "LOW",
  "price_threshold": 1.68,
  "summary": "",
  "failure_scenarios": []
}

Validate the schema before displaying anything.

22. Price Threshold

A useful feature:

Minimum acceptable price

Example:

text
Model probability: 61.8%
Recommended minimum price: 1.68
Current best price: 1.72

If the market falls below the threshold:

text
VALUE NO LONGER QUALIFIES

This prevents the system from treating a pick as permanently good when the price has materially changed.

23. Accumulator Builder

The core user journey:

text
Browse events
      ↓
Choose market
      ↓
Add selection
      ↓
Betslip
      ↓
Build accumulator
      ↓
Analyse Acca

Each leg should display:

selection
line
best bookmaker price
model probability
market probability
edge
confidence
24. Accumulator Analysis

This is potentially one of the platform's strongest differentiators.

For an accumulator:

text
Arsenal ML
Alcaraz ML
Celtics -4.5
Madrid O1.5

Analyse:

each leg independently
combined probability
combined implied probability
estimated value
weakest leg
strongest leg
uncertainty
correlation
price sensitivity
25. Correlation Detection

Do NOT assume all accumulator legs are independent.

Examples:

text
Arsenal ML
Arsenal O2.5
Arsenal player to score

These may be correlated.

NBA:

text
Team -6.5
Team total O115.5
Star player O points

Again potentially correlated.

The system should detect:

same event
same team
same player
logically linked outcomes
same-game correlation

Do not multiply independent probabilities blindly.

Eventually develop sport-specific correlation models.

If correlation cannot be estimated reliably, clearly state that uncertainty rather than pretending the combined probability is precise.

26. Product Features
MVP
Home
today's events
featured picks
Pick of the Day
Acca of the Day
Sports pages
football
tennis
NBA
MLB
NHL
Event page
fixture
markets
odds
bookmaker comparison
statistics
AI analysis
Betslip
singles
accumulator
remove/add legs
combined odds
Analyse
probability
implied probability
edge
confidence
reasons
risks
price threshold
User account
saved bets
analysis history
usage credits
subscription
27. Pick of the Day

Daily automated selection.

Display:

text
AI PICK OF THE DAY

Selection
Arsenal +1.5

Best price
1.72

Model probability
61.8%

Market probability
58.1%

Edge
+3.7%

Confidence
HIGH

Why
...

Risks
...

Every Pick of the Day must be stored as a historical prediction before the event.

28. Acca of the Day

Potentially provide:

AI Acca

Optimised around value/edge.

Conservative Acca

Optimised around high individual probabilities.

Do not imply that an accumulator is "safe" or guaranteed.

29. Bet Finder

Future feature:

User selects:

text
Sport
League
Minimum confidence
Minimum edge
Odds range
Market type

System searches available markets and returns qualifying opportunities.

Example:

Find 3 football bets with HIGH confidence and at least 4% model edge.

This should be implemented as a search/ranking/filtering problem, not as Claude inventing bets.

30. Odds Shopping

For each selection:

text
Bet365      1.80
Betway      1.83
William Hill 1.78
Ladbrokes   1.85

Display:

Best available price: 1.85

Eventually use affiliate links where commercially/licensing appropriate.

31. Line Movement

Store historical snapshots.

Display:

text
Opening: 1.95
Current: 1.82
Movement: -6.7%

Allow Claude to explain relevant movement without claiming that movement itself proves the outcome.

32. Performance Dashboard

Eventually show:

predictions
win rate
ROI
yield
closing-line value
calibration
performance by sport
performance by market
performance by odds range
performance by confidence
performance by model version

Do NOT cherry-pick only winning picks.

All historical performance reporting must have a consistent methodology.

33. Calibration

A major long-term differentiator.

If the model says:

70% probability

then across a sufficiently large historical sample, approximately 70% should win.

Track calibration curves.

For example:

text
Predicted 60-65%
Actual result rate: X%

Predicted 65-70%
Actual result rate: X%

Predicted 70-75%
Actual result rate: X%

Confidence labels should eventually be validated against actual historical performance.

34. Backtesting

Every model change must be evaluated against historical data.

Avoid look-ahead bias.

At prediction time, the model must only use information that would actually have been available at that timestamp.

Never allow:

future closing odds
later injury information
final lineups unavailable at prediction time
future results
post-event news

to leak into the historical prediction.

Track:

model version
data timestamp
features used
prediction timestamp
35. Model Versioning

Every prediction must reference a model version.

Example:

text
football_match_model_v1.0
nba_spread_model_v1.2
tennis_match_model_v0.8

When changing a model:

create a new version
don't rewrite previous predictions
compare versions using historical backtests
36. User Experience

Visual direction:

Modern sportsbook + TradingView + ESPN + premium analytics dashboard

Not a generic chatbot.

Core visual hierarchy:

text
Selection
↓
Best Price
↓
Probability
↓
Value
↓
Confidence
↓
Evidence
↓
Risks

Traffic-light system should be instantly understandable.

Avoid excessive walls of AI text.

37. Suggested Event Card
text
ARSENAL vs MAN CITY

Arsenal +1.5
Best Price 1.72

Model Probability
61.8%

Market Probability
58.1%

Edge
+3.7%

🟢 HIGH CONFIDENCE

[Analyse]
[Add to Acca]
38. Analysis Page

Suggested layout:

text
ARSENAL +1.5

🟢 HIGH CONFIDENCE

61.8%
Model Probability

58.1%
Market Probability

+3.7%
Estimated Edge

1.72
Best Price

1.68
Minimum Price

WHY THE MODEL LIKES IT
- ...
- ...
- ...

WHAT COULD GO WRONG
- ...
- ...
- ...

MARKET
Opening → Current

TEAM DATA
...

INJURIES
...

AI RESEARCH
...
39. Cost Optimisation

Critical rules:

Cache current odds.
Cache event research.
Cache identical analyses.
Batch data ingestion.
Avoid calling Claude for every page view.
Only call Claude when analysis is requested or when material data changes.
Use cheaper/non-LLM computation for deterministic calculations.
Keep research packets compact.
Use structured output.
Set usage limits per user.
Rate-limit abuse.
Monitor token usage per analysis.

The product should know its approximate:

cost per analysis
cost per active user
cost per subscriber
gross margin
40. Pricing/Usage Architecture

Implement a credit/usage system rather than hardcoding plan limits throughout the application.

Example:

text
FREE
3 analyses/month

PRO
100 analyses/month

ELITE
500 analyses/month

Potential credit costs:

text
Single analysis = 1 credit
Player prop analysis = 1 credit
Standard acca analysis = 3 credits
Deep acca analysis = 5 credits
AI Bet Finder = 3 credits
Full-day research scan = 5 credits

This is a starting model and should be adjustable.

Important:

show remaining usage
reset monthly
handle refunds/failed analyses
prevent double charging
log every credit transaction
maintain audit history
41. Scaling Economics

Do not assume every user causes equivalent API costs.

Sports data should be shared.

Example:

text
10,000 users
        ↓
same cached Arsenal odds
        ↓
one upstream data fetch

AI analysis can also be shared when:

same event
same market
same price state
same relevant research snapshot
same model version

Potential future architecture:

text
Event Research Cache
+
Market Analysis Cache
+
User-specific explanation layer

This allows much better margins.

42. Target Unit Economics

Initial target:

A £19.99/month subscriber should ideally cost only a small fraction of subscription revenue to serve.

Aim to keep total variable cost per average subscriber comfortably below ~£5/month initially, while recognising that heavy users will cost more.

Track:

text
Revenue/user
AI cost/user
Data cost/user
Infrastructure/user
Payment fees
Affiliate revenue/user
Gross margin

Do not assume these numbers until actual usage data exists.

43. Payments

Use Stripe for subscriptions.

Implement:

Free
Pro
Elite
subscription status
cancellation
renewal
failed payment handling
usage entitlement
webhooks
customer portal

Do not store card information yourself.

44. Affiliate Revenue

Potential future flow:

text
Selection
↓
Best bookmaker price
↓
[View at bookmaker]
↓
Affiliate tracking

Requirements:

bookmaker affiliate agreements
permitted promotional language
responsible gambling requirements
accurate price display
timestamped price data
appropriate disclosure

Never show an outdated price as though it is current.

45. UK/Gambling Compliance

The initial product should be an analytics/research platform and should not accept bets.

Before launch, obtain appropriate legal advice regarding:

UK gambling law
Gambling Commission requirements
affiliate arrangements
gambling advertising
ASA/CAP rules
consumer protection
terms and conditions
privacy/GDPR
age restrictions
responsible gambling messaging
geographic availability
data licensing

Design the product for 18+ users.

Do not market it as a solution to financial problems or as guaranteed income.

Do not use:

"guaranteed winner"
"risk-free"
"easy money"
"make your salary"
"can't lose"
similar misleading claims

Do not claim that AI can guarantee betting outcomes.

46. Privacy/Security

Implement:

secure authentication
row-level security in Supabase
server-side API keys
never expose provider API keys to browser
encrypted secrets
rate limiting
audit logs
secure Stripe webhook validation
abuse prevention
GDPR-compatible privacy practices
account deletion
data export where required
minimal personal data collection
47. Observability

Track:

Technical
API failures
latency
database errors
queue failures
AI failures
malformed provider data
Product
analyses/day
analyses/user
most analysed sports
most analysed markets
conversion
free → paid
subscription churn
average credits consumed
affiliate clicks
retention
Model
predictions
results
calibration
ROI/yield
CLV
model drift
48. Abuse Protection

Users should not be able to:

automate thousands of analysis requests
bypass credit limits
scrape the entire odds database
use the platform as an unofficial odds API
repeatedly trigger identical expensive research

Implement:

authentication
rate limits
credit checks
request deduplication
caching
bot protection
server-side validation
49. API Design

Suggested endpoints:

text
GET /api/sports
GET /api/competitions
GET /api/events
GET /api/events/:id
GET /api/events/:id/markets
GET /api/events/:id/odds

POST /api/analysis
POST /api/acca/analyse
GET /api/picks/today
GET /api/acca/today

POST /api/betslip
POST /api/betslip/legs
DELETE /api/betslip/legs/:id

GET /api/user/usage
GET /api/user/predictions

POST /api/stripe/webhook

Data ingestion should use separate internal worker endpoints/services rather than exposing provider operations publicly.

50. Analysis Endpoint Flow

Example:

text
POST /api/analysis

Input:
event_id
market_id
selection_id
requested_depth

Backend:

text
1. Validate user
2. Validate credit balance
3. Load current market
4. Load latest odds
5. Load statistics
6. Load injuries
7. Load lineups
8. Load relevant research
9. Run quantitative model
10. Calculate market probability
11. Calculate edge
12. Calculate confidence
13. Build research packet
14. Check analysis cache
15. If required, call Claude
16. Validate structured Claude output
17. Store analysis
18. Deduct credits
19. Return result

Credit should only be consumed once the analysis successfully completes, according to the chosen billing policy.

51. Acca Endpoint Flow
text
POST /api/acca/analyse

Input:
legs[]

Backend:

text
1. Validate every leg
2. Load current prices
3. Load each model probability
4. Identify correlation
5. Calculate individual metrics
6. Estimate combined probability where methodology supports it
7. Calculate combined market odds
8. Calculate value
9. Identify weakest leg
10. Identify correlation risks
11. Send structured packet to Claude
12. Return analysis

If combined probability cannot be reliably estimated, explicitly show that limitation instead of manufacturing a precise number.

52. AI Prompt Principles

System prompt should enforce:

Never invent statistics.
Never invent injuries.
Never invent odds.
Never invent bookmaker prices.
Use supplied structured data as authoritative for numerical fields.
Identify uncertainty.
Challenge the proposed bet.
Distinguish fact from interpretation.
Never claim certainty about an uncertain sports outcome.
Do not use emotional/persuasive gambling language.
Explain both supporting and contrary evidence.
Return the required schema.
Never override a quantitative result without explaining why.
53. Research Sources

Prioritise:

official league/team sources
official injury/lineup sources
reliable statistical providers
reputable sports news
other sources only when necessary

Store:

source URL
publisher
publication time
retrieval time
title
relevant extracted content
source reliability category

Research should be timestamped because sports information changes quickly.

54. News Freshness

A research result from yesterday should not necessarily be treated the same as one from 10 minutes ago.

Store:

text
published_at
retrieved_at
source
event_id
player_id/team_id

Use freshness weighting where appropriate.

For example:

confirmed lineup: extremely high relevance
official injury update: high
old form article: lower
generic historical article: potentially irrelevant
55. Data Quality

Every analysis should have a data-quality state:

text
EXCELLENT
GOOD
LIMITED
INSUFFICIENT

Examples of problems:

missing lineup
stale odds
missing player data
conflicting injury reports
insufficient historical sample
provider outage

If data quality is insufficient, the platform should say so rather than manufacture confidence.

56. Market Availability

The frontend should gracefully handle markets that are unavailable.

Never display:

stale prices
missing bookmaker data
unsupported markets
incorrectly mapped players
incorrect lines

Every market should have:

provider
timestamp
status
availability
57. Testing

Write automated tests for:

Data
provider mapping
duplicate events
duplicate markets
odds updates
settlement
Calculations
implied probability
edge
EV
combined odds
probability calculations
confidence calculation
price threshold
AI
structured output validation
hallucination detection
missing-data handling
contradictory evidence
schema failures
Payments
subscription lifecycle
webhook processing
credit allocation
Security
authentication
authorisation
RLS
API key protection
rate limits
58. MVP Development Order

Do NOT attempt everything simultaneously.

Recommended sequence:

Phase 1 — Foundation
Next.js
Supabase
auth
database schema
design system
navigation
Phase 2 — Sports data
Odds API integration
event ingestion
market ingestion
bookmaker normalisation
odds snapshots
Phase 3 — Betslip
event browser
market selection
betslip
accumulator builder
Phase 4 — Quantitative analysis
probability model baseline
implied probability
edge
confidence engine
Phase 5 — Claude
research packet
Claude integration
structured JSON
explanation
contrary evidence
Phase 6 — Accumulator
multi-leg analysis
correlation detection
weakest-leg identification
Phase 7 — Picks
Pick of the Day
Acca of the Day
prediction ledger
Phase 8 — Subscriptions
Stripe
Free/Pro/Elite
usage credits
Phase 9 — Performance
historical results
calibration
ROI/yield
model versioning
Phase 10 — Scale
caching
background jobs
additional sports
player props
alerts
affiliate integration
59. What NOT to Build Initially

Avoid:

sportsbook functionality
deposits/withdrawals
KYC
complex live betting
every possible market
expensive enterprise data contracts
huge ML infrastructure
mobile apps
social network
community betting
complicated portfolio management
10+ sports
every bookmaker in every country

First prove:

User sees a bet → clicks Analyse → receives genuinely useful analysis → understands why the system thinks the bet has value/risk → returns to analyse another bet.

60. Initial MVP Sports/Markets

To keep development manageable:

Football
1X2
handicap
totals
selected player props
Tennis
match winner
game handicap
totals
selected props
NBA
moneyline
spread
total
selected player props

Then add:

MLB
NHL
NFL

once the core system works.

61. Long-Term Moat

Claude is NOT the moat.

The moat should become:

proprietary historical prediction database
calibrated sport-specific models
prediction history
odds movement history
data normalisation
correlation engine
confidence methodology
user behaviour data
research archive
brand

The long-term goal is to have an internal dataset that allows:

"When our system says HIGH confidence under these exact conditions, what has historically happened?"

That is much more valuable than simply saying "Claude thinks this will win."

62. Long-Term Product Expansion

Potential future features:

personalised betting dashboard
saved leagues/teams/players
push notifications
odds movement alerts
price-threshold alerts
player injury alerts
lineup alerts
automated daily scans
"find me bets matching my criteria"
bankroll tracking
historical model dashboard
public transparency page
advanced analytics
API access
B2B analytics
media/publisher widgets

Any future bankroll or betting-tracking features should be designed with responsible gambling considerations.

63. Core Product Philosophy

The platform should be:

Data-first

Facts originate from structured data.

Model-first

Probabilities come from a quantitative methodology.

AI-enhanced

Claude researches, challenges and explains.

Transparent

Users can see why the system reached its conclusion.

Uncertainty-aware

The product explicitly communicates limitations.

Price-aware

A bet is not simply "good"; its price matters.

Historically accountable

Every prediction is stored and evaluated.

Scalable

Data and analyses are cached and shared where possible.

64. First Success Metric

Do not define success as:

"We built an AI betting website."

Define the first milestone as:

A user can select any supported pre-match market, click Analyse, and receive a reliable, explainable result in seconds.

The complete loop must work:

text
EVENT
↓
MARKET
↓
ODDS
↓
DATA
↓
MODEL
↓
PROBABILITY
↓
EDGE
↓
CONFIDENCE
↓
CLAUDE RESEARCH
↓
EXPLANATION
↓
PREDICTION RECORD
↓
RESULT
↓
MODEL EVALUATION
65. Claude Code Development Instructions

When implementing this project:

First inspect the repository.
Do not overwrite existing Vercel/Supabase configuration without checking it.
Build incrementally.
Explain architectural decisions briefly before major changes.
Keep secrets server-side.
Use environment variables.
Never hard-code API keys.
Create database migrations.
Create seed/test data.
Write automated tests for critical calculations.
Keep provider integrations modular.
Never couple the frontend directly to an external provider.
Create provider interfaces so providers can be swapped later.
Create sport-specific model interfaces.
Use TypeScript types throughout.
Validate external API responses.
Log provider failures.
Handle stale/missing data gracefully.
Do not claim unsupported market coverage.
Keep the UI responsive and polished.
Do not over-engineer infrastructure before it is needed.
Build a working vertical slice before expanding scope.
66. Provider Abstraction

Do not write the application so that everything depends directly on The Odds API.

Create interfaces such as:

typescript
interface OddsProvider {
  getEvents(): Promise<Event[]>;
  getMarkets(eventId: string): Promise<Market[]>;
  getOdds(eventId: string): Promise<OddsSnapshot[]>;
}

Then:

text
OddsApiProvider
SportsDataProvider
SportradarProvider

can implement the same interface.

This makes future provider changes much easier.

Likewise:

typescript
interface SportsStatsProvider {}
interface InjuryProvider {}
interface NewsProvider {}
67. Model Abstraction

Create:

typescript
interface PredictionModel {
  predict(input: PredictionInput): Promise<PredictionOutput>;
}

Then:

text
FootballMatchModel
TennisMatchModel
NBASpreadModel
NBAPlayerPropsModel
MLBModel
NHLModel

This allows independent iteration.

68. First Technical Milestone

Before building the full UI, make this work end-to-end with one sport and one market.

Example:

text
Football
↓
Premier League
↓
Match winner
↓
Odds API
↓
Supabase
↓
Baseline probability model
↓
Market probability
↓
Edge
↓
Confidence
↓
Claude analysis
↓
JSON
↓
Frontend card

Only after this works should the project expand to additional markets/sports.

69. Example Final API Response

The frontend should eventually receive something conceptually like:

json
{
  "selection": {
    "event": "Arsenal vs Manchester City",
    "market": "Arsenal +1.5",
    "best_price": 1.72,
    "bookmaker": "Example Bookmaker"
  },
  "model": {
    "probability": 0.618,
    "market_probability": 0.581,
    "edge": 0.037,
    "confidence_score": 82,
    "confidence_label": "HIGH",
    "minimum_price": 1.68
  },
  "research": {
    "key_factors": [],
    "contrary_factors": [],
    "risks": [],
    "data_quality": "GOOD"
  },
  "analysis": {
    "summary": "",
    "failure_scenarios": []
  },
  "metadata": {
    "model_version": "football_handicap_v1",
    "generated_at": "",
    "odds_timestamp": ""
  }
}
70. Final Product Goal

The finished product should feel like:

A Bloomberg/TradingView-style research terminal for sports bettors, with Claude acting as the analyst.

A user should be able to open it, see today's sports, find a market, add it to a betslip, and immediately understand:

what the market says
what the model says
whether there appears to be an edge
how confident the system is
why
what could invalidate the analysis
what price is required
how the selection compares with alternatives
how the system has historically performed

The product should never pretend to know the future.

Its value is in making the user's research process faster, more systematic, more transparent and more data-driven.

Immediate Build Task

Start by creating a detailed technical implementation plan for the MVP.

Before writing large amounts of code:

Inspect the existing Vercel/Supabase project.
Propose the database schema.
Propose the application architecture.
Identify exact external APIs required.
Identify their current endpoint/market requirements.
Identify which data can be cached.
Define the first vertical slice.
Define environment variables.
Define migrations.
Define the first automated tests.
Define the first UI screens.
Estimate the expected API/AI cost per analysis.
Identify any licensing or technical blocker that must be resolved before public launch.

Then implement the project incrementally, starting with the smallest end-to-end working version rather than scaffolding the entire platform at once.
