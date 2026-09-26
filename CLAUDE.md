# CLAUDE.md

Instructions for Claude Code. Read this file and everything in `docs/` before starting any task.

## What this project is

A football research and price-comparison website. Users pick a Premier League match and see recent form, the head-to-head record, shots, possession and corners, next to the bookmaker prices: the best UK price, Pinnacle's price with its margin removed (a fair-price reference), and how the price has moved. Claude writes a short plain-English summary of the match and points out what could go wrong, using only the numbers we supply — it does not predict a result, calculate a probability, or score an edge. It does NOT take bets, hold money or promise winners.

The full brief is `docs/MASTER_BRIEF.md`. The build plan is `docs/PLAN.md`. If they disagree, the plan wins for order of work. For product rules, the plan wins wherever it describes the stats-and-price direction above — the brief was written for an earlier, probability-model version of the product and has not been rewritten since the pivot. Where the brief and plan don't conflict (legal wording, 18+, data handling), the brief still wins.

Stack: Next.js (TypeScript), Tailwind, shadcn/ui, Supabase (Postgres, Auth), Vercel, the Anthropic API, The Odds API, Sportmonks (football stats, not yet signed up).

## Who you are working with

The owner (Ethan) is not a developer. He decides what to build, what to spend and what looks right. You do the engineering. So:

1. Explain everything in plain English. No unexplained jargon. If you must use a technical term, add a few words saying what it means.
2. When you need a decision, ask ONE clear question, say what you recommend and why in one line, and make the recommended option the default.
3. Never ask him to do something technical without exact, copy-paste steps. Say where to click or what to paste.
4. He often reads updates on his phone. Keep messages short: what you did, what works, what is next, and anything you need from him.
5. Ask before anything that costs money, adds a paid service, or changes an account (Vercel, Supabase, GitHub, Stripe). Free, reversible work inside the repo needs no permission.

## How to work

- Build in the order in `docs/PLAN.md`. Do the smallest working version first, then expand. Do not build ahead.
- One step per task. Finish it, run the tests, then open a pull request (PR) on its own branch. Do not push straight to `main`.
- Write the PR description in plain English: what changed, how to see it working, anything he needs to do.
- Before opening a PR, run the tests and the type check. If anything fails, fix it or say clearly what is failing and why.
- Do not overwrite existing Vercel or Supabase configuration without checking with him first.
- Keep changes small and reviewable. Prefer simple code over clever code.

## Rules that must never be broken

Money and data
- Never put secrets (API keys, tokens) in code or in git. Use environment variables. Only `NEXT_PUBLIC_*` values may reach the browser. Provide a `.env.example` with fake values.
- Never call The Odds API, Sportmonks or any other provider from the browser or on each user request. Only scheduled server jobs fetch from providers; the app reads from our own database.
- Odds history is append-only. Never update or delete a row in `odds_snapshots`. Stats history (form, head-to-head, match stats) follows the same rule once it has its own table.
- Turn on row-level security for every user-data table.

How the analysis works
- Numbers come from code and the data providers, not from Claude. Recent form, head-to-head and match stats come from the stats provider; the best UK price, Pinnacle's margin-free fair price and price movement are calculated by our own functions. Claude only writes the plain-English summary and the risks, from the numbers we give it. If Claude's output disagrees with the numbers, the numbers win.
- Always check Claude's JSON reply against the schema before showing anything. If it fails twice, show the numbers without the written summary and do not charge a credit.
- Form, head-to-head, match stats and the price comparison are separate facts. Never merge them into one score or rating.
- Show the sample size next to every stat we display, especially head-to-head (e.g. "2 wins from the last 5 meetings", not just "40%"), so nobody mistakes a small sample for a sure thing.
- Never show an old price as if it is current. Every price shows when it was captured.
- Do not claim a stat or market is supported until we have seen the data provider supply it reliably.

Product and legal wording
- Never use "guaranteed", "risk-free", "easy money", "can't lose" or similar. Never imply the AI knows the outcome.
- The product is for adults (18+). Include responsible gambling messaging where the brief and plan say to.
- Keep every data provider behind an interface so it can be swapped. Record licence terms in `docs/DATA_PROVIDERS.md`.

## Testing

Write automated tests (Vitest) for anything that touches money or numbers shown to users: implied probability, margin removal, Pinnacle's fair price, price movement, sample-size display, the immutability of odds (and later stats) history, and validation of Claude's reply. Test with fake data; tests must not call paid APIs.

## Commands

Fill these in once the project is scaffolded, and keep them current.

- Install: `npm install`
- Run locally: `npm run dev`
- Tests: `npm test` (database tests also run when `TEST_DATABASE_URL` is set; see README)
- Type check: `npm run typecheck`
- Lint: `npm run lint`
- Database migrations: `supabase/migrations/` (numbered files, never edit one after it has been applied; add a new one). Seed data: `supabase/seed.sql`

`npm run data:fetch`, `npm run backtest` and `npm run backtest:v2` are left over from the earlier in-house probability model, which the product has moved away from (see `docs/PLAN.md`, "Changes to the brief"). They still run, but they are not part of the current build — see Current focus below.

## Current focus

First vertical slice: a Premier League match page showing recent form, head-to-head (with its sample size), shots/possession/corners, next to the price comparison (best UK price, Pinnacle's margin-free fair price, and how the price has moved), plus a short Claude summary and risks. Stats are meant to come from Sportmonks' Starter plan (no expected goals) and odds from The Odds API — neither is signed up for yet. Until then, the fixtures list and match page run on clearly labelled sample data behind provider interfaces, so the screens can be reviewed before any money is spent. Nothing else until this works end to end.

## When unsure

Stop and ask in plain English with a recommendation. A short question is better than a wrong assumption that costs a day of work.
