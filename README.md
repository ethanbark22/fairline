# Fairline

Sports betting research and analysis. Users pick a bet and see the probability, the market's view, the edge, a confidence rating, the evidence and the risks. It does not take bets or hold money. 18+ only.

Product rules: `CLAUDE.md` and `docs/MASTER_BRIEF.md`.

## Commands

| What | Command |
| --- | --- |
| Install | `npm install` |
| Run locally | `npm run dev` then open http://localhost:3000 |
| Tests | `npm test` |
| Type check | `npm run typecheck` |
| Lint | `npm run lint` |
| Download historical data (free) | `npm run data:fetch` |
| Run the model backtests | `npm run backtest` (v1) and `npm run backtest:v2` (add `-- --fit` to re-pick settings) |

### Database tests

The tests in `supabase/tests/` run every migration and the seed data against a temporary Postgres database and check the permanent-record rules. They are skipped unless `TEST_DATABASE_URL` points at a Postgres server whose user can create databases:

```
TEST_DATABASE_URL=postgres://postgres:postgres@localhost:5432/postgres npm test
```

A throwaway database is created and dropped each run; the one in the URL is not changed. Never point this at the live Supabase database.

## Layout

- `src/lib/value/` – value maths (implied probability, margin removal, edge, minimum price) and tests
- `src/lib/models/football/` – football_1x2_v1 ratings model (see `docs/MODELS.md`)
- `src/lib/backtest/` – walk-forward replay and scoring; report in `docs/backtests/`
- `supabase/migrations/` – database changes, numbered. Never edit one after it has been applied; add a new one.
- `supabase/seed.sql` – made-up test data for local development
- `.env.example` – the settings the app needs, with fake values
