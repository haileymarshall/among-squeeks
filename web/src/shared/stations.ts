// Task stations. Each one is a console with two levers: green (the miner task) and red (the rug).
// Pure data (no imports from map.ts at runtime) so map.ts can use it to block the console cells.

import type { RoomId } from "./map";

const CELL = 40;

export type Station = {
  id: string;
  /** What miners do here. */
  task: string;
  room: RoomId;
  /** Console occupies cells (cx, cy) and (cx + 1, cy), standing against the north wall. */
  cx: number;
  cy: number;
};

export const STATIONS: Station[] = [
  { id: "contract", task: "Oil the wheel", room: "open", cx: 33, cy: 4 },
  { id: "commit", task: "Check the magnet", room: "open", cx: 45, cy: 4 },
  { id: "meme", task: "Sort the seeds", room: "meme", cx: 12, cy: 4 },
  { id: "bullpost", task: "Post a squeek", room: "shill", cx: 62, cy: 4 },
  { id: "node", task: "Reboot the sensor", room: "server", cx: 5, cy: 22 },
  { id: "liquidity", task: "Count the SQK", room: "trading", cx: 72, cy: 22 },
  { id: "coffee", task: "Fluff the nest", room: "break", cx: 18, cy: 40 },
  { id: "audit", task: "Audit the round", room: "audit", cx: 43, cy: 42 },
  { id: "launch", task: "Sign the block", room: "ceo", cx: 60, cy: 40 },
];

export const STATION_BY_ID = new Map(STATIONS.map((s) => [s.id, s]));

/** You must stand within this many px of a station's front to pull its levers. */
export const STATION_RANGE = 80;

/** Front-center of the console, in px. Distances are measured from here. */
export function stationFront(s: Station) {
  return { x: (s.cx + 1) * CELL, y: (s.cy + 1) * CELL + 8 };
}

/** Where a bot stands to use the station. */
export function stationSpot(s: Station) {
  return { x: (s.cx + 1) * CELL, y: (s.cy + 1.6) * CELL };
}

export function nearestStation(x: number, y: number) {
  let best: Station | null = null;
  let bd = STATION_RANGE;
  for (const s of STATIONS) {
    const f = stationFront(s);
    const d = Math.hypot(f.x - x, f.y - y);
    if (d <= bd) {
      bd = d;
      best = s;
    }
  }
  return best;
}

/** How long each kind of pull takes, ms. */
export const PULL_MS = { task: 3500, fake: 3500, fix: 5000, rug: 4000 } as const;
export type PullKind = keyof typeof PULL_MS;
