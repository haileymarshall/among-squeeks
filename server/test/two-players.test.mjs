// Two separate clients: can they find each other, stay in sync, and leave cleanly?
// Usage: node test/two-players.test.mjs [server url]
import { createRequire } from "node:module";
const r = createRequire(new URL("../../web/package.json", import.meta.url));
const { Client } = r("@colyseus/sdk");
const url = process.argv[2] ?? "http://localhost:2567";
const sleep = (ms) => new Promise((s) => setTimeout(s, ms));
const until = async (what, test, ms = 15000) => { const t = Date.now(); while (!test()) { if (Date.now() - t > ms) throw new Error("Timed out: " + what); await sleep(50); } console.log("ok:", what, `${Date.now() - t}ms`); };
const quiet = (room) => { for (const m of ["role", "tasks", "rug", "alert", "toast", "snap", "verdict", "chat", "wheellog", "reveal"]) room.onMessage(m, () => {}); };
const a = await new Client(url).create("game", { name: "Host", hamsterId: 2, private: true });
quiet(a);
await until("host in the room", () => a.state.players?.size === 1);
console.log("room code", a.roomId);
const b = await new Client(url).joinById(a.roomId, { name: "Friend", hamsterId: 3 });
quiet(b);
await until("host sees the friend", () => a.state.players.size === 2);
await until("friend sees the host", () => b.state.players?.size === 2);
const me = () => b.state.players.get(b.sessionId);
const from = { x: a.state.players.get(b.sessionId).x, y: a.state.players.get(b.sessionId).y };
const walk = async (dx, dy) => { for (let i = 0; i < 20; i++) { b.send("move", { x: me().x + dx, y: me().y + dy }); await sleep(120); } };
await walk(12, 0); await walk(-12, 0); await walk(0, 12); await walk(0, -12);
const seen = a.state.players.get(b.sessionId);
console.log("friend moved, as the host sees it:", Math.round(from.x), Math.round(from.y), "->", Math.round(seen.x), Math.round(seen.y));
if (seen.x === from.x && seen.y === from.y) {
  // Not moved at the end: check it moves at all during a one-way walk.
  await walk(12, 0);
  await until("host sees the friend move", () => a.state.players.get(b.sessionId).x !== from.x || a.state.players.get(b.sessionId).y !== from.y, 3000);
}
console.log("ok: positions sync between players");
a.send("addBot"); a.send("addBot");
await until("both see 4 in the crew", () => a.state.players.size === 4 && b.state.players.size === 4);
let roleA = null, roleB = null;
a.onMessage("role", (m) => (roleA = m));
b.onMessage("role", (m) => (roleB = m));
a.send("start");
await until("each player got a private role", () => roleA && roleB);
await until("the shift started for both", () => a.state.phase === "playing" && b.state.phase === "playing", 12000);
const sameRun = a.state.wheelRun === b.state.wheelRun;
console.log("same real run for both:", sameRun, "|", a.state.wheelRun);
if (!sameRun) throw new Error("Players are on different runs");
// As the fixed client does: turn reconnection off, then leave.
b.reconnection.enabled = false;
void b.leave();
await until("host sees the friend leave", () => a.state.players.size === 3, 30000);
a.reconnection.enabled = false;
void a.leave();
console.log("Two-player checks passed.");
process.exit(0);
