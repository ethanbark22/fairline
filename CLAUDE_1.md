# CLAUDE.md

Instructions for Claude Code. Read this file and everything in `docs/` before starting any task.

## What this project is

A sports betting research and analysis website. Users pick a bet, click Analyse, and see the probability, the price the market implies, the edge (value), a confidence rating, the evidence and the risks. It does NOT take bets, hold money or promise winners.

The full brief is `docs/MASTER_BRIEF.md`. The build plan is `docs/PLAN.md`. If they disagree, the plan wins for order of work and the brief wins for product rules.

Stack: Next.js (TypeScript), Tailwind, shadcn/ui, Supabase (Postgres, Auth), Vercel, the Anthropic API, The Odds API.

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
- Never call The Odds API or any other provider from the browser or on each user request. Only scheduled server jobs fetch from providers; the app reads from our own database.
- Odds history is append-only. Never update or delete a row in `odds_snapshots`.
- Predictions are immutable. Once saved, never update or delete a row in `predictions`. Results and closing prices go in a separate table. Enforce this in the database with triggers, not only in code.
- Every prediction is saved before the event starts and records its model version and the data it used.
- Turn on row-level security for every user-data table.

How the analysis works
- Numbers come from code, not from Claude. The probability, market probability, edge, confidence and minimum price are calculated by our own functions. Claude only explains and challenges. If Claude's output disagrees with the numbers, the numbers win.
- Always check Claude's JSON reply against the schema before showing anything. If it fails twice, show the numbers without the written explanation and do not charge a credit.
- Probability, market probability, edge and confidence are four separate things. Never merge them into one score.
- Do not multiply accumulator legs together as if they were independent. Flag related legs, and say when a combined probability cannot be trusted.
- Never show an old price as if it is current. Every price shows when it was captured.
- Do not claim a market is supported until we have seen the data provider supply it reliably.
- Confidence label HIGH stays disabled until enough settled predictions exist to check calibration. Until then the maximum is MEDIUM.

Product and legal wording
- Never use "guaranteed", "risk-free", "easy money", "can't lose" or similar. Never imply the AI knows the outcome.
- The product is for adults (18+). Include responsible gambling messaging where the brief and plan say to.
- Keep every data provider behind an interface so it can be swapped. Record licence terms in `docs/DATA_PROVIDERS.md`.

## Testing

Write automated tests (Vitest) for anything that touches money or probabilities: implied probability, margin removal, edge, minimum price, combined odds, the confidence score, credit deductions, the immutability of predictions and odds history, and validation of Claude's reply. Test with fake data; tests must not call paid APIs.

## Commands

Fill these in once the project is scaffolded, and keep them current.

- Install: `npm install`
- Run locally: `npm run dev`
- Tests: `npm test`
- Type check: `npm run typecheck`
- Lint: `npm run lint`
- Database migrations: `supabase/migrations/` (numbered files, never edit one after it has been applied; add a new one)

## Current focus

First vertical slice: Premier League match winner (home / draw / away). Odds from The Odds API into Supabase, a simple ratings-based model, edge and confidence, a Claude explanation, an immutable saved prediction, and one screen that shows it. Nothing else until this works end to end.

## When unsure

Stop and ask in plain English with a recommendation. A short question is better than a wrong assumption that costs a day of work.
