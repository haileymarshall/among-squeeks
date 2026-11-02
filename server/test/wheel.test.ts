// Checks the wheel feed against the real runs. Usage: pnpm exec tsx test/wheel.test.ts
import assert from "node:assert/strict";
import { OUTAGE_AFTER_MS, OUTAGE_MAX_MS } from "../../web/src/shared/protocol";
import saved from "../src/runs.json";
import { WheelFeed } from "../src/wheel";

const STEP = 50;
const SHIFT_MINUTES = [4, 6, 10, 15];
const TRIALS = 60;

const runs = saved as { at: string; gaps: number[] }[];
assert.ok(runs.length >= 20, "Not enough saved runs");
for (const r of runs) {
  assert.ok(!Number.isNaN(Date.parse(r.at)), "Bad run date");
  assert.ok(r.gaps.length > 100, "Run is too short");
  assert.ok(r.gaps.every((g) => Number.isInteger(g) && g > 0 && g <= 60_000), "Bad gap in run");
}

// Force recorded runs: the live feed depends on whether he's running right now.
const realFetch = globalThis.fetch;
globalThis.fetch = (async () => {
  throw new Error("offline");
}) as typeof fetch;

let outages = 0;
let shifts = 0;
let noOutage = 0;
let longest = 0;
for (const minutes of SHIFT_MINUTES) {
  for (let i = 0; i < TRIALS; i++) {
    const shiftMs = minutes * 60_000;
    const wheel = new WheelFeed(shiftMs);
    assert.equal(wheel.live, false);
    assert.match(wheel.label, /^His run from /);
    let here = 0;
    let outFor = 0;
    let outFinal = false;
    let lastPasses = 0;
    for (let t = 0; t < shiftMs; t += STEP) {
      const changed = wheel.advance(STEP);
      assert.ok(wheel.passes >= lastPasses, "Passes went backwards");
      lastPasses = wheel.passes;
      if (changed && wheel.out) {
        here++;
        outFor = 0;
      }
      if (wheel.out) {
        outFor += STEP;
        longest = Math.max(longest, outFor);
      }
      outFinal = wheel.out;
    }
    void outFinal;
    assert.ok(wheel.passes > 40 * minutes, `Too few passes in ${minutes} min: ${wheel.passes}`);
    assert.ok(wheel.rpm >= 0 && wheel.rpm < 400, `Odd speed: ${wheel.rpm}`);
    outages += here;
    shifts++;
    if (!here) noOutage++;
  }
}

// A pause can't last longer than the cap, plus the time before it counts as an outage.
assert.ok(longest <= OUTAGE_MAX_MS - OUTAGE_AFTER_MS + STEP * 2, `Outage ran too long: ${longest}ms`);
globalThis.fetch = realFetch;

console.log(`${runs.length} real runs loaded. ${shifts} shifts simulated.`);
console.log(`Power cuts per shift: ${(outages / shifts).toFixed(1)} on average. Shifts with none: ${noOutage}. Longest: ${(longest / 1000).toFixed(1)}s.`);
console.log("Wheel feed checks passed.");
process.exit(0);
