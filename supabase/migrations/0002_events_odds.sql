-- 0002_events_odds: fixtures, markets (types of bet) and their selections,
-- and odds history. Odds history is append-only: rows can be added but
-- never changed or removed.

create table events (
  id uuid primary key default gen_random_uuid(),
  competition_id uuid not null references competitions (id),
  home_team_id uuid not null references teams (id),
  away_team_id uuid not null references teams (id),
  starts_at timestamptz not null,
  status text not null default 'scheduled'
    check (status in ('scheduled', 'in_play', 'finished', 'postponed', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (home_team_id <> away_team_id)
);

create index events_starts_at_idx on events (starts_at);

-- A market is a type of bet, e.g. match winner (home / draw / away).
-- is_supported stays false until we have seen the provider supply it reliably.
create table markets (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,            -- e.g. 'match_winner'
  name text not null,
  is_supported boolean not null default false,
  created_at timestamptz not null default now()
);

create table market_selections (
  id uuid primary key default gen_random_uuid(),
  market_id uuid not null references markets (id),
  key text not null,                   -- e.g. 'home', 'draw', 'away'
  name text not null,
  created_at timestamptz not null default now(),
  unique (market_id, key),
  unique (id, market_id)               -- lets other tables check a selection belongs to its market
);

create table odds_snapshots (
  id bigint generated always as identity primary key,
  event_id uuid not null references events (id),
  bookmaker_id uuid not null references bookmakers (id),
  market_id uuid not null references markets (id),
  selection_id uuid not null references market_selections (id),
  line numeric,                         -- null for match winner; used later for handicaps/totals
  price numeric(10, 3) not null check (price > 1),  -- decimal odds
  provider text not null,
  captured_at timestamptz not null,     -- when the provider says the price was live
  ingested_at timestamptz not null default now(),
  foreign key (selection_id, market_id) references market_selections (id, market_id)
);

create index odds_snapshots_lookup_idx
  on odds_snapshots (event_id, market_id, bookmaker_id, selection_id, captured_at desc);

-- Shared guard used by every append-only / immutable table.
create function reject_change() returns trigger
language plpgsql as $$
begin
  raise exception '% on table % is not allowed: rows are permanent', tg_op, tg_table_name
    using errcode = 'restrict_violation';
end;
$$;

create trigger odds_snapshots_no_update
  before update or delete on odds_snapshots
  for each row execute function reject_change();

create trigger odds_snapshots_no_truncate
  before truncate on odds_snapshots
  for each statement execute function reject_change();

-- Row-level security (RLS: database rules on who can read or write each row)
-- is on for every table. Nobody may write through the public API; our server
-- jobs write with the service role key, which never reaches the browser.
-- Visitors may read fixtures and markets. odds_snapshots has no public rule,
-- so only our server reads it; this stops anyone scraping our odds history.
alter table events enable row level security;
alter table markets enable row level security;
alter table market_selections enable row level security;
alter table odds_snapshots enable row level security;

create policy "Public read" on events for select to anon, authenticated using (true);
create policy "Public read" on markets for select to anon, authenticated using (true);
create policy "Public read" on market_selections for select to anon, authenticated using (true);
