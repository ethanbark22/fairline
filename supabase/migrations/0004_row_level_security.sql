-- 0004: Row-level security (RLS: database rules on who can read or write each row).
-- Switched on for every table. Through the public API, visitors may only read
-- basic reference data (fixtures, teams, markets). Odds history, predictions
-- and provider mappings have no public rules at all, so the app's server
-- reads them; this stops anyone scraping our odds database. Nobody may write
-- through the public API. Our scheduled server jobs write using the
-- service role key, which Supabase lets past RLS and which never reaches the browser.
-- User-specific tables (accounts, betslips, credits) arrive in later steps
-- with their own "only your own rows" rules.

alter table sports enable row level security;
alter table competitions enable row level security;
alter table teams enable row level security;
alter table events enable row level security;
alter table bookmakers enable row level security;
alter table markets enable row level security;
alter table market_selections enable row level security;
alter table provider_mappings enable row level security;
alter table odds_snapshots enable row level security;
alter table model_versions enable row level security;
alter table predictions enable row level security;
alter table prediction_results enable row level security;

create policy "Public read" on sports for select to anon, authenticated using (true);
create policy "Public read" on competitions for select to anon, authenticated using (true);
create policy "Public read" on teams for select to anon, authenticated using (true);
create policy "Public read" on events for select to anon, authenticated using (true);
create policy "Public read" on bookmakers for select to anon, authenticated using (true);
create policy "Public read" on markets for select to anon, authenticated using (true);
create policy "Public read" on market_selections for select to anon, authenticated using (true);
create policy "Public read" on model_versions for select to anon, authenticated using (true);
-- No public policies (server-only): provider_mappings, odds_snapshots,
-- predictions, prediction_results.
