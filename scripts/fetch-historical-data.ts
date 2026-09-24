/**
 * Downloads free historical Premier League results and closing odds into
 * data/historical/ (not committed to git: the data is not ours to redistribute).
 *
 * Source: football-data.co.uk, via a GitHub copy pinned to one exact version
 * so every backtest run uses identical data. The fingerprint (SHA-256) check
 * stops the run if the files ever differ from what was reviewed.
 *
 * Run: npm run data:fetch
 */
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const COMMIT = "d69530c645c10c7844ee416a6af56a4b392e37be";
const BASE = `https://raw.githubusercontent.com/AnishKhetani/premier-league-data/${COMMIT}/data/processed`;
const OUT_DIR = join(process.cwd(), "data", "historical");

const FILES = [
  { name: "results.csv", sha256: "e3f80563eef122aa52cf5d9558ad41bae92e9a509abb00717864343795459d50" },
  { name: "results_with_odds.csv", sha256: "82337c0e7fb8de9bd39a75fcaf711b4895035edac8a94d2c791fbd0576441cee" },
];

mkdirSync(OUT_DIR, { recursive: true });
for (const file of FILES) {
  const target = join(OUT_DIR, file.name);
  // curl respects the machine's proxy settings; Node's built-in fetch does not.
  execFileSync("curl", ["-sSfL", "--retry", "3", "-o", target, `${BASE}/${file.name}`], { stdio: "inherit" });
  const actual = createHash("sha256").update(readFileSync(target)).digest("hex");
  if (actual !== file.sha256) {
    throw new Error(`${file.name}: fingerprint mismatch (got ${actual}). Data changed; review before using.`);
  }
  console.log(`OK ${file.name}`);
}
