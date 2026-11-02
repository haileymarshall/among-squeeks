import { Client, type Room } from "@colyseus/sdk";
import { ROOM_NAME, normalizeCode, type GameStateView, type JoinOptions } from "@/shared/protocol";

export type GameRoom = Room<unknown, GameStateView>;

/** Game server URL. Defaults to the same host on :2567 so phones on the LAN can join a dev server. */
function endpoint() {
  if (import.meta.env.VITE_SERVER_URL) return import.meta.env.VITE_SERVER_URL;
  const secure = window.location.protocol === "https:";
  return `${secure ? "https" : "http"}://${window.location.hostname}:2567`;
}

let client: Client | null = null;
const sdk = () => (client ??= new Client(endpoint()));

export const quickPlay = (o: JoinOptions) => sdk().joinOrCreate<GameStateView>(ROOM_NAME, { ...o, private: false });
export const createPrivate = (o: JoinOptions) => sdk().create<GameStateView>(ROOM_NAME, { ...o, private: true });
export const joinCode = (code: string, o: JoinOptions) => sdk().joinById<GameStateView>(normalizeCode(code), o);

/** Turns SDK/server errors into something a player can read. */
export function friendlyError(e: unknown): string {
  const msg = e instanceof Error ? e.message : String(e);
  if (/not found/i.test(msg)) return "No room with that code.";
  if (/locked|already started/i.test(msg)) return "That game already started. Try another code.";
  if (/full/i.test(msg)) return "That room is full.";
  if (/fetch|network|ECONNREFUSED|Failed to fetch/i.test(msg)) return "Can't reach the game server.";
  return msg || "Something went wrong.";
}
