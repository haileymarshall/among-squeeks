// Plays a full match against the running game server with AI hamsters, no browser needed.
// Usage: node test/match.test.mjs [ws server url]
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(new URL("../../web/package.json", import.meta.url));
const { Client } = require("@colyseus/sdk");

const url = process.argv[2] ?? "http://localhost:2567";
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const client = new Client(url);

const until = async (what, test, ms = 30000) => {
  const start = Date.now();
  while (!test()) {
    if (Date.now() - start > ms) throw new Error(`Timed out waiting for: ${what}`);
    await sleep(50);
  }
};

// Free entry: a name and a hamster are all it takes. No wallet, no signature, no stake.
const room = await client.create("game", { name: "Tester", hamsterId: 5, private: true });
console.log("joined free, room", room.roomId);

let role = null;
let log = null;
let reveal = null;
room.onMessage("role", (m) => (role = m));
room.onMessage("wheellog", (m) => (log = m));
room.onMessage("reveal", (m) => (reveal = m));
for (const type of ["tasks", "rug", "alert", "toast", "snap", "verdict", "chat"]) room.onMessage(type, () => {});

await until("first state", () => room.state.players?.size === 1);
for (let i = 0; i < 5; i++) room.send("addBot");
await until("AI hamsters", () => room.state.players.size === 6);
const names = [];
room.state.players.forEach((p) => names.push(p.name));
console.log("crew:", names.join(", "));
assert.ok(names.every((n) => !/chog/i.test(n)), "Old Chog names are still in the game");

room.send("settings", { timeLimit: 4, discussTime: 15, voteTime: 15 });
await sleep(100);
room.send("start");
await until("roles", () => role);
console.log("my role:", role.role);
await until("the shift to start", () => room.state.phase === "playing", 12000);
assert.match(room.state.wheelRun, /His run from|Live from the wheel/);
console.log("power source:", room.state.wheelRun);

// Watch the shift: passes must rise, the speed must look real, and the power should cut out for real.
let cuts = 0;
let wasOn = true;
const seen = new Set();
const watchUntil = Date.now() + 80_000;
let lastPasses = 0;
let maskedRed = 0;
while (Date.now() < watchUntil && room.state.phase === "playing" && !(cuts >= 1 && Date.now() > watchUntil - 62_000)) {
  const on = room.state.wheelOn;
  if (wasOn && !on) cuts++;
  wasOn = on;
  assert.ok(room.state.wheelPasses >= lastPasses, "Wheel passes went backwards");
  lastPasses = room.state.wheelPasses;
  if (room.state.wheelRpm) seen.add(room.state.wheelRpm);
  if (!on) room.state.stations.forEach((st) => (maskedRed += st.lever === "red" ? 1 : 0));
  await sleep(100);
}
console.log(`wheel passes ${lastPasses}, power cuts ${cuts}, speeds ${Math.min(...seen)}-${Math.max(...seen)} RPM`);
assert.ok(lastPasses > 0, "The wheel never turned");
assert.equal(maskedRed, 0, "A red lever was visible in the dark");

if (room.state.phase === "playing") {
  // Everyone starts by the table, but this player may have been pushed along by nothing: it hasn't moved.
  room.send("emergency");
  await until("a meeting", () => room.state.phase === "meeting" || room.state.phase === "ended", 15000);
}
if (room.state.phase === "meeting") {
  console.log("meeting called");
  await until("the wheel log", () => log, 3000);
  assert.ok(Array.isArray(log.entries));
  assert.ok(log.passes > 0 && log.run);
  assert.ok(log.now > 0);
  const json = JSON.stringify(log);
  room.state.players.forEach((p) => assert.ok(!json.includes(p.id), "The wheel log gave away a player"));
  console.log(`wheel log: ${log.entries.length} entries, ${log.passes} passes, "${log.run}"`);
  await until("voting", () => room.state.meetingStage === "vote", 20000);
  room.send("vote", "skip");
  await until("the shift to resume", () => room.state.phase === "playing" || room.state.phase === "ended", 45000);
  console.log("back to:", room.state.phase);
}

await until("the match to end", () => room.state.phase === "ended", 280000);
console.log(`ended: ${room.state.winner} win. "${room.state.endWhy}"`);
assert.ok(reveal?.ruggers?.length >= 1, "Ruggers weren't revealed");
assert.ok(["devs", "ruggers"].includes(room.state.winner));
await room.leave();
console.log("Match checks passed.");
process.exit(0);
