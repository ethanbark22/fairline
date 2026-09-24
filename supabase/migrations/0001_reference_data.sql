-- 0001: Reference data for the first slice (Premier League match winner).
-- Sports, competitions, teams, events, bookmakers, markets and selections,
-- plus provider mappings so each data provider's IDs point at our own IDs.

create table sports (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,            -- e.g. 'football'
  name text not null,
  created_at timestamptz not null default now()
);

create table competitions (
  id uuid primary key default gen_random_uuid(),
  sport_id uuid not null references sports (id),
  key text not null unique,            -- e.g. 'premier_league'
  name text not null,
  country text,
  created_at timestamptz not null default now()
);

create table teams (
  id uuid primary key default gen_random_uuid(),
  sport_id uuid not null references sports (id),
  name text not null,
  short_name text,
  created_at timestamptz not null default now(),
  unique (sport_id, name)
);

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

create table bookmakers (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  name text not null,
  region text,                          -- e.g. 'uk'
  created_at timestamptz not null default now()
);

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

-- Maps a provider's ID for something to our own internal ID.
create table provider_mappings (
  id uuid primary key default gen_random_uuid(),
  provider text not null,              -- e.g. 'the_odds_api'
  entity_type text not null
    check (entity_type in ('sport', 'competition', 'team', 'event', 'bookmaker', 'market', 'selection')),
  provider_entity_id text not null,
  internal_entity_id uuid not null,
  created_at timestamptz not null default now(),
  unique (provider, entity_type, provider_entity_id)
);

create index provider_mappings_internal_idx on provider_mappings (entity_type, internal_entity_id);
