-- 0004_ledger: the prediction ledger and results.
-- Predictions are immutable: once saved they can never be changed or deleted.
-- Results and closing prices live in prediction_results instead.

create table predictions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  event_id uuid not null references events (id),
  market_id uuid not null references markets (id),
  selection_id uuid not null references market_selections (id),
  line numeric,
  bookmaker_id uuid not null references bookmakers (id),
  odds_snapshot_id bigint not null references odds_snapshots (id),  -- the exact price used
  price_at_prediction numeric(10, 3) not null check (price_at_prediction > 1),
  model_version_id uuid not null references model_versions (id),

  -- Four separate numbers, all calculated by our code (never by Claude).
  model_probability numeric(7, 6) not null check (model_probability > 0 and model_probability < 1),
  market_probability numeric(7, 6) not null check (market_probability > 0 and market_probability < 1),
  edge numeric(8, 6) generated always as (model_probability - market_probability) stored,
  confidence_score smallint not null check (confidence_score between 0 and 100),
  -- HIGH is switched off until enough settled predictions exist to check
  -- calibration. A later migration lifts this once that is true.
  confidence_label text not null
    constraint confidence_high_disabled check (confidence_label in ('LOW', 'MEDIUM')),
  minimum_price numeric(10, 4) not null check (minimum_price > 1),

  input_data jsonb not null,           -- the model inputs used, for audit and backtesting
  explanation jsonb,                   -- Claude's validated reply; null if it failed validation

  foreign key (selection_id, market_id) references market_selections (id, market_id)
);

create index predictions_event_idx on predictions (event_id);

-- Before a prediction is saved: stamp the real time, make sure the event has
-- not started, and make sure the odds snapshot matches what is being claimed.
create function check_new_prediction() returns trigger
language plpgsql as $$
declare
  event_start timestamptz;
  snap odds_snapshots%rowtype;
begin
  new.created_at := now();

  select starts_at into event_start from events where id = new.event_id;
  if event_start is null or event_start <= now() then
    raise exception 'Predictions must be saved before the event starts'
      using errcode = 'check_violation';
  end if;

  select * into snap from odds_snapshots where id = new.odds_snapshot_id;
  if snap.id is null
     or snap.event_id <> new.event_id
     or snap.market_id <> new.market_id
     or snap.selection_id <> new.selection_id
     or snap.bookmaker_id <> new.bookmaker_id
     or snap.price <> new.price_at_prediction
     or snap.line is distinct from new.line then
    raise exception 'Prediction does not match odds snapshot %', new.odds_snapshot_id
      using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

create trigger predictions_check_insert
  before insert on predictions
  for each row execute function check_new_prediction();

create trigger predictions_no_update
  before update or delete on predictions
  for each row execute function reject_change();

create trigger predictions_no_truncate
  before truncate on predictions
  for each statement execute function reject_change();

-- Settlement, kept apart from the prediction itself.
create table prediction_results (
  id uuid primary key default gen_random_uuid(),
  prediction_id uuid not null unique references predictions (id),
  result text not null check (result in ('win', 'loss', 'push', 'void')),
  closing_price numeric(10, 3) check (closing_price > 1),
  settled_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- Row-level security (RLS: database rules on who can read or write each row)
-- is on for every table. Nobody may write through the public API; our server
-- jobs write with the service role key, which never reaches the browser.
-- No public rules: predictions and results are read by our server only.
alter table predictions enable row level security;
alter table prediction_results enable row level security;
