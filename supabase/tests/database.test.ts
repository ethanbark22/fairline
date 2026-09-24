/**
 * Database rules tests: runs every migration and the seed against a
 * throwaway Postgres database, then checks the permanent-record rules.
 *
 * Needs a Postgres server. Set TEST_DATABASE_URL to a connection string for
 * a user that can create databases, e.g.
 *   TEST_DATABASE_URL=postgres://postgres:postgres@localhost:5432/postgres npm test
 * Without it these tests are skipped. A new database is created for each run
 * and dropped afterwards; the database in the URL is never changed.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { Client } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const adminUrl = process.env.TEST_DATABASE_URL;
const supabaseDir = join(__dirname, "..");
const dbName = `fairline_test_${Date.now()}`;

const EVENT = "00000000-0000-0000-0006-000000000001";
const MATCH_WINNER = "00000000-0000-0000-0003-000000000001";
const HOME = "00000000-0000-0000-0004-000000000001";
const BOOK_A = "00000000-0000-0000-0005-000000000001";

describe.skipIf(!adminUrl)("database rules", () => {
  let admin: Client;
  let db: Client;
  let modelVersionId: string;

  beforeAll(async () => {
    admin = new Client({ connectionString: adminUrl });
    await admin.connect();
    await admin.query(`create database ${dbName}`);

    const url = new URL(adminUrl!);
    url.pathname = `/${dbName}`;
    db = new Client({ connectionString: url.toString() });
    await db.connect();

    // Supabase provides these roles; plain Postgres does not.
    await db.query(`
      do $$ begin
        if not exists (select from pg_roles where rolname = 'anon') then create role anon nologin; end if;
        if not exists (select from pg_roles where rolname = 'authenticated') then create role authenticated nologin; end if;
      end $$;`);

    const migrations = readdirSync(join(supabaseDir, "migrations")).filter((f) => f.endsWith(".sql")).sort();
    for (const file of migrations) {
      await db.query(readFileSync(join(supabaseDir, "migrations", file), "utf8"));
    }
    await db.query(readFileSync(join(supabaseDir, "seed.sql"), "utf8"));

    // Supabase grants table access to these roles by default; mirror that so
    // the RLS rules are what is being tested.
    await db.query(`grant usage on schema public to anon, authenticated;
      grant select, insert, update, delete on all tables in schema public to anon, authenticated;`);

    const mv = await db.query(`
      insert into model_versions (key, sport_id, description)
      values ('test_model_v0', '00000000-0000-0000-0000-000000000001', 'test only')
      returning id`);
    modelVersionId = mv.rows[0].id;
  });

  afterAll(async () => {
    await db?.end();
    await admin?.query(`drop database if exists ${dbName}`);
    await admin?.end();
  });

  async function latestSnapshot(eventId = EVENT) {
    const { rows } = await db.query(
      `select id, price from odds_snapshots
       where event_id = $1 and bookmaker_id = $2 and selection_id = $3
       order by captured_at desc limit 1`,
      [eventId, BOOK_A, HOME],
    );
    return rows[0] as { id: string; price: string };
  }

  async function insertPrediction(overrides: Record<string, unknown> = {}) {
    const snap = await latestSnapshot();
    const row = {
      event_id: EVENT,
      market_id: MATCH_WINNER,
      selection_id: HOME,
      bookmaker_id: BOOK_A,
      odds_snapshot_id: snap.id,
      price_at_prediction: snap.price,
      model_version_id: modelVersionId,
      model_probability: 0.45,
      market_probability: 0.38,
      confidence_score: 55,
      confidence_label: "MEDIUM",
      minimum_price: 2.2223,
      input_data: { note: "test" },
      ...overrides,
    };
    const cols = Object.keys(row);
    const { rows } = await db.query(
      `insert into predictions (${cols.join(", ")})
       values (${cols.map((_, i) => `$${i + 1}`).join(", ")}) returning *`,
      Object.values(row),
    );
    return rows[0];
  }

  describe("seed", () => {
    it("loads the Premier League slice", async () => {
      const { rows } = await db.query(`select count(*)::int as n from odds_snapshots`);
      expect(rows[0].n).toBe(15);
      const market = await db.query(`select is_supported from markets where key = 'match_winner'`);
      expect(market.rows[0].is_supported).toBe(false);
    });
  });

  describe("odds_snapshots is append-only", () => {
    it("allows new rows", async () => {
      await db.query(
        `insert into odds_snapshots (event_id, bookmaker_id, market_id, selection_id, price, provider, captured_at)
         values ($1, $2, $3, $4, 2.4, 'test', now())`,
        [EVENT, BOOK_A, MATCH_WINNER, HOME],
      );
    });

    it("rejects updates", async () => {
      await expect(db.query(`update odds_snapshots set price = 9.99`)).rejects.toThrow(/not allowed/);
    });

    it("rejects deletes", async () => {
      await expect(db.query(`delete from odds_snapshots`)).rejects.toThrow(/not allowed/);
    });

    it("rejects truncate", async () => {
      await expect(db.query(`truncate odds_snapshots cascade`)).rejects.toThrow(/not allowed/);
    });

    it("rejects prices of 1 or below", async () => {
      await expect(
        db.query(
          `insert into odds_snapshots (event_id, bookmaker_id, market_id, selection_id, price, provider, captured_at)
           values ($1, $2, $3, $4, 1.0, 'test', now())`,
          [EVENT, BOOK_A, MATCH_WINNER, HOME],
        ),
      ).rejects.toThrow(/check constraint/);
    });
  });

  describe("predictions are immutable", () => {
    it("saves a prediction and calculates edge from the two probabilities", async () => {
      const p = await insertPrediction();
      expect(Number(p.edge)).toBeCloseTo(0.07, 6);
    });

    it("ignores a back-dated created_at", async () => {
      const p = await insertPrediction({ created_at: "2000-01-01T00:00:00Z" });
      expect(new Date(p.created_at).getFullYear()).toBeGreaterThan(2000);
    });

    it("rejects updates", async () => {
      await insertPrediction();
      await expect(db.query(`update predictions set model_probability = 0.9`)).rejects.toThrow(/not allowed/);
    });

    it("rejects deletes", async () => {
      await expect(db.query(`delete from predictions`)).rejects.toThrow(/not allowed/);
    });

    it("rejects truncate", async () => {
      await expect(db.query(`truncate predictions cascade`)).rejects.toThrow(/not allowed/);
    });

    it("rejects a prediction for an event that has already started", async () => {
      const started = await db.query(`
        insert into events (competition_id, home_team_id, away_team_id, starts_at)
        values ('00000000-0000-0000-0001-000000000001', '00000000-0000-0000-0002-000000000002',
                '00000000-0000-0000-0002-000000000003', now() - interval '1 minute')
        returning id`);
      const eventId = started.rows[0].id;
      const snap = await db.query(
        `insert into odds_snapshots (event_id, bookmaker_id, market_id, selection_id, price, provider, captured_at)
         values ($1, $2, $3, $4, 2.0, 'test', now() - interval '1 hour') returning id, price`,
        [eventId, BOOK_A, MATCH_WINNER, HOME],
      );
      await expect(
        insertPrediction({
          event_id: eventId,
          odds_snapshot_id: snap.rows[0].id,
          price_at_prediction: snap.rows[0].price,
        }),
      ).rejects.toThrow(/before the event starts/);
    });

    it("rejects a price that does not match the odds snapshot", async () => {
      await expect(insertPrediction({ price_at_prediction: 9.5 })).rejects.toThrow(/does not match/);
    });

    it("rejects the HIGH confidence label for now", async () => {
      await expect(insertPrediction({ confidence_label: "HIGH" })).rejects.toThrow(/confidence_high_disabled/);
    });

    it("rejects probabilities outside 0 to 1", async () => {
      await expect(insertPrediction({ model_probability: 1.2 })).rejects.toThrow(/check constraint/);
    });
  });

  describe("row-level security", () => {
    async function asAnon<T>(fn: () => Promise<T>): Promise<T> {
      await db.query("begin; set local role anon");
      try {
        return await fn();
      } finally {
        await db.query("rollback");
      }
    }

    it("lets visitors read fixtures and teams", async () => {
      const { rows } = await asAnon(() => db.query(`select count(*)::int as n from teams`));
      expect(rows[0].n).toBe(4);
    });

    it("hides odds history, predictions and provider mappings from visitors", async () => {
      for (const table of ["odds_snapshots", "predictions", "prediction_results", "provider_mappings"]) {
        const { rows } = await asAnon(() => db.query(`select count(*)::int as n from ${table}`));
        expect(rows[0].n, table).toBe(0);
      }
    });

    it("stops visitors writing", async () => {
      await expect(
        asAnon(() =>
          db.query(`insert into teams (sport_id, name) values ('00000000-0000-0000-0000-000000000001', 'Hackers FC')`),
        ),
      ).rejects.toThrow(/row-level security/);
    });
  });
});
