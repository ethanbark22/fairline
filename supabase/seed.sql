-- Seed data for local development and tests. NOT real data.
-- Fixtures are placed a few days after whenever the seed runs, and the
-- bookmakers and prices are made up. Real data will come from the
-- scheduled odds job in a later step.

insert into sports (id, key, name) values
  ('00000000-0000-0000-0000-000000000001', 'football', 'Football');

insert into competitions (id, sport_id, key, name, country) values
  ('00000000-0000-0000-0001-000000000001', '00000000-0000-0000-0000-000000000001',
   'premier_league', 'Premier League', 'England');

insert into teams (id, sport_id, name, short_name) values
  ('00000000-0000-0000-0002-000000000001', '00000000-0000-0000-0000-000000000001', 'Arsenal', 'ARS'),
  ('00000000-0000-0000-0002-000000000002', '00000000-0000-0000-0000-000000000001', 'Chelsea', 'CHE'),
  ('00000000-0000-0000-0002-000000000003', '00000000-0000-0000-0000-000000000001', 'Liverpool', 'LIV'),
  ('00000000-0000-0000-0002-000000000004', '00000000-0000-0000-0000-000000000001', 'Manchester City', 'MCI');

-- Not yet marked supported: that happens once we have seen real provider data.
insert into markets (id, key, name) values
  ('00000000-0000-0000-0003-000000000001', 'match_winner', 'Match winner (home / draw / away)');

insert into market_selections (id, market_id, key, name) values
  ('00000000-0000-0000-0004-000000000001', '00000000-0000-0000-0003-000000000001', 'home', 'Home'),
  ('00000000-0000-0000-0004-000000000002', '00000000-0000-0000-0003-000000000001', 'draw', 'Draw'),
  ('00000000-0000-0000-0004-000000000003', '00000000-0000-0000-0003-000000000001', 'away', 'Away');

insert into bookmakers (id, key, name, region) values
  ('00000000-0000-0000-0005-000000000001', 'test_book_a', 'Test Bookmaker A', 'uk'),
  ('00000000-0000-0000-0005-000000000002', 'test_book_b', 'Test Bookmaker B', 'uk');

-- How The Odds API names these things.
insert into provider_mappings (provider, entity_type, provider_entity_id, internal_entity_id) values
  ('the_odds_api', 'sport', 'soccer', '00000000-0000-0000-0000-000000000001'),
  ('the_odds_api', 'competition', 'soccer_epl', '00000000-0000-0000-0001-000000000001'),
  ('the_odds_api', 'market', 'h2h', '00000000-0000-0000-0003-000000000001');

insert into events (id, competition_id, home_team_id, away_team_id, starts_at) values
  ('00000000-0000-0000-0006-000000000001', '00000000-0000-0000-0001-000000000001',
   '00000000-0000-0000-0002-000000000001', '00000000-0000-0000-0002-000000000004',
   date_trunc('hour', now()) + interval '3 days'),
  ('00000000-0000-0000-0006-000000000002', '00000000-0000-0000-0001-000000000001',
   '00000000-0000-0000-0002-000000000003', '00000000-0000-0000-0002-000000000002',
   date_trunc('hour', now()) + interval '4 days');

-- Two captures an hour apart, so there is a little price movement to look at.
insert into odds_snapshots (event_id, bookmaker_id, market_id, selection_id, price, provider, captured_at)
select e.event_id, b.bookmaker_id, '00000000-0000-0000-0003-000000000001', s.selection_id,
       p.price, 'seed', now() - p.age
from (values
  -- event, bookmaker, selection, price, age
  ('00000000-0000-0000-0006-000000000001', 'A', 'home', 2.60, interval '2 hours'),
  ('00000000-0000-0000-0006-000000000001', 'A', 'draw', 3.50, interval '2 hours'),
  ('00000000-0000-0000-0006-000000000001', 'A', 'away', 2.70, interval '2 hours'),
  ('00000000-0000-0000-0006-000000000001', 'A', 'home', 2.50, interval '1 hour'),
  ('00000000-0000-0000-0006-000000000001', 'A', 'draw', 3.50, interval '1 hour'),
  ('00000000-0000-0000-0006-000000000001', 'A', 'away', 2.80, interval '1 hour'),
  ('00000000-0000-0000-0006-000000000001', 'B', 'home', 2.55, interval '1 hour'),
  ('00000000-0000-0000-0006-000000000001', 'B', 'draw', 3.40, interval '1 hour'),
  ('00000000-0000-0000-0006-000000000001', 'B', 'away', 2.85, interval '1 hour'),
  ('00000000-0000-0000-0006-000000000002', 'A', 'home', 2.10, interval '1 hour'),
  ('00000000-0000-0000-0006-000000000002', 'A', 'draw', 3.40, interval '1 hour'),
  ('00000000-0000-0000-0006-000000000002', 'A', 'away', 3.60, interval '1 hour'),
  ('00000000-0000-0000-0006-000000000002', 'B', 'home', 2.05, interval '1 hour'),
  ('00000000-0000-0000-0006-000000000002', 'B', 'draw', 3.50, interval '1 hour'),
  ('00000000-0000-0000-0006-000000000002', 'B', 'away', 3.70, interval '1 hour')
) as p (event_id, book, selection, price, age)
cross join lateral (select p.event_id::uuid as event_id) e
cross join lateral (
  select case p.book when 'A' then '00000000-0000-0000-0005-000000000001'::uuid
                     else '00000000-0000-0000-0005-000000000002'::uuid end as bookmaker_id) b
cross join lateral (
  select id as selection_id from market_selections
  where market_id = '00000000-0000-0000-0003-000000000001' and key = p.selection) s;
