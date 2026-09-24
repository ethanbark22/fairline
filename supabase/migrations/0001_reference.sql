-- 0001_reference: sports, competitions, teams, bookmakers, and provider
-- mappings so each data provider's IDs point at our own IDs.

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

create table bookmakers (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  name text not null,
  region text,                          -- e.g. 'uk'
  created_at timestamptz not null default now()
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

-- Row-level security (RLS: database rules on who can read or write each row)
-- is on for every table. Nobody may write through the public API; our server
-- jobs write with the service role key, which never reaches the browser.
-- Visitors may read the reference data. provider_mappings is internal: no public rule.
alter table sports enable row level security;
alter table competitions enable row level security;
alter table teams enable row level security;
alter table bookmakers enable row level security;
alter table provider_mappings enable row level security;

create policy "Public read" on sports for select to anon, authenticated using (true);
create policy "Public read" on competitions for select to anon, authenticated using (true);
create policy "Public read" on teams for select to anon, authenticated using (true);
create policy "Public read" on bookmakers for select to anon, authenticated using (true);
