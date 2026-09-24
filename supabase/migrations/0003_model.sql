-- 0003_model: model versions. Every prediction names the exact model
-- version that made it.

create table model_versions (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,            -- e.g. 'football_1x2_v1'
  sport_id uuid not null references sports (id),
  description text not null,
  created_at timestamptz not null default now()
);

-- Row-level security (RLS: database rules on who can read or write each row)
-- is on for every table. Nobody may write through the public API; our server
-- jobs write with the service role key, which never reaches the browser.
alter table model_versions enable row level security;

create policy "Public read" on model_versions for select to anon, authenticated using (true);
