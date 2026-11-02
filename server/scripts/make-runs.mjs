// Saves real wheel runs from Squeekchain's public API into src/runs.json.
// Usage: node scripts/make-runs.mjs
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const API = "https://api.squeekchain.com/v1/measurement/runs?limit=100";
const out = join(dirname(fileURLToPath(import.meta.url)), "..", "src", "runs.json");
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** Gaps longer than this split one run from the next. */
const RUN_BREAK_MS = 60_000;
const PAUSE_MS = 2_000;
const MIN_RUN_MS = 4 * 60_000;
const MIN_PAUSES = 3;
const KEEP = 40;

const times = [];
let cursor = null;
for (;;) {
  const response = await fetch(API + (cursor ? `&cursor=${encodeURIComponent(cursor)}` : ""));
  if (!response.ok) throw new Error(`API answered ${response.status}`);
  const page = await response.json();
  if (!page.items.length) break;
  for (const segment of page.items) {
    if (segment.provenance !== "hardware") continue;
    for (const pass of segment.passages) times.push(Date.parse(pass.at));
  }
  cursor = page.nextCursor;
  if (!cursor) break;
  await sleep(550); // The API allows 2 requests a second on this endpoint.
}
times.sort((a, b) => a - b);

const runs = [];
let start = 0;
for (let i = 1; i <= times.length; i++) {
  if (i < times.length && times[i] - times[i - 1] <= RUN_BREAK_MS) continue;
  const gaps = [];
  for (let k = start + 1; k < i; k++) gaps.push(times[k] - times[k - 1]);
  const length = times[i - 1] - times[start];
  const pauses = gaps.filter((g) => g >= PAUSE_MS).length;
  if (length >= MIN_RUN_MS && pauses >= MIN_PAUSES) runs.push({ at: new Date(times[start]).toISOString(), gaps });
  start = i;
}

const kept = runs.slice(-KEEP);
writeFileSync(out, JSON.stringify(kept));
const minutes = kept.map((r) => r.gaps.reduce((a, b) => a + b, 0) / 60000);
console.log(`${times.length} wheel passes, ${runs.length} usable runs, kept ${kept.length}.`);
console.log(`Run lengths: ${Math.min(...minutes).toFixed(1)} to ${Math.max(...minutes).toFixed(1)} minutes.`);
