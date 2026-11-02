# Among Squeeks

**There's a Rugger among us, and the power runs on a real hamster.**

A free multiplayer social deduction game for [Squeekchain](https://squeekchain.com). A crew of hamsters is trying to mine a block, and one of them is secretly a Rugger trying to drain the vault. No wallet, no sign-in and no entry fee: pick a hamster and play, with friends or AI hamsters.

## The real hamster runs the game

Squeektoshi is a real hamster on a real wheel, and every shift runs on what his wheel actually did. If he's running right now, the shift is live from his RPM. If he's asleep, which is most of the time, it replays one of his real recorded runs, pause for pause.

| When Squeektoshi... | In the game... |
| --- | --- |
| Keeps running | The burrow has power, and the giant wheel turns at his real speed |
| Pauses for real | The power cuts out: tasks stop, miners can barely see, and in the dark a red lever looks like a green one |
| Sprints (85+ RPM) | He has the zoomies, and tasks go 30% faster |
| Stops at the end of a run | The shift is over. If the block isn't mined, the Ruggers win |

At every meeting the crew sees the **wheel log**: a timeline of when the power went out and when consoles were tampered with, and whether that happened in the dark. It names nobody. The wheel can't lie, but the crew can.

## How to play

- **Miners** do tasks at the consoles to fill the Block Meter, fix tampered consoles and call meetings.
- **Ruggers** fake tasks, pull red levers, use the vents and call sabotage. Once enough consoles are tampered with, the Vault opens. Hold its lever for 15 seconds and the crew is rugged, unless someone hits the alarm.
- **Meetings:** chat, then vote. Whoever loses gets fired and walks out carrying a box.
- **Miners win** by mining the block or firing every Rugger. **Ruggers win** by draining the vault, matching the miners in number, or running out the clock.

## Where the data comes from

| Data | Source |
| --- | --- |
| Live status and RPM | `GET https://api.squeekchain.com/v1/status` |
| Exact time of every wheel pass | `GET https://api.squeekchain.com/v1/measurement/runs`, saved by `server/scripts/make-runs.mjs` into `server/src/runs.json` |

Run timings are signed by the wheel's device but aren't certified on-chain. Pauses are real, capped at 20 seconds so one long nap can't stop a whole game.

## How it's built

| Part | What it is |
| --- | --- |
| `web/` | The game page: Vite, React, Phaser and Tailwind. It builds to a static site in `web/dist`, so it can be hosted anywhere, including IPFS |
| `server/` | The game server: Colyseus on Node. It holds secret roles, keeps players in sync and runs the AI hamsters |
| `web/src/shared/` | The rules and map, used by both sides |

## Run it locally

```sh
cd server && pnpm install && pnpm dev     # game server on port 2567
cd web && pnpm install && pnpm dev        # game page on http://localhost:3100
```

Click **Host private**, open **Lobby settings**, add AI hamsters and press **Start shift**.

Controls: WASD or arrow keys to move, E to use, Q for the red lever, F for sabotage. On phones, drag to move and use the buttons.

## Tests

With the game server running:

```sh
cd server
pnpm exec tsx test/wheel.test.ts      # checks the real runs and power cuts
node test/match.test.mjs              # plays a full match against AI hamsters
```

## Deploy

1. **Game server:** deploy `server/` to any Node host that supports WebSockets, with `pnpm install && pnpm build` and `pnpm start`. It reads `PORT`.
2. **Game page:** set `VITE_SERVER_URL` to the server's address and run `pnpm build` in `web/`. Host `web/dist`.

## Credits

An independent fan project, not affiliated with Squeekchain or with Among Us. Evolved from the same designer's game Among Chogs, with new art, a new setting and new rules built around the real wheel.
