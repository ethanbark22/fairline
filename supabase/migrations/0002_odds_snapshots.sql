-- 0002: Odds history. Append-only: rows can be added but never changed or removed.

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
