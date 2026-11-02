import { useCallback, useEffect, useRef, useState } from "react";
import { CloseCode } from "@colyseus/sdk";
import { GameCanvas } from "./GameCanvas";
import { Hud } from "./Hud";
import { Menu, TOTAL_HAMSTERS, randomHamster } from "./Menu";
import { normalizeCode, type JoinOptions } from "@/shared/protocol";
import type { GameRoom } from "@/net/net";
import type { SceneConfig } from "@/game/MainScene";

const SAVE_KEY = "among-squeeks:me";

function load(): { name: string; hamsterId: number; suit?: number } | null {
  try {
    return JSON.parse(localStorage.getItem(SAVE_KEY) ?? "null");
  } catch {
    return null;
  }
}

function save(me: JoinOptions) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify({ name: me.name, hamsterId: me.hamsterId, suit: me.suit }));
  } catch {
    // Private mode: just don't remember.
  }
}

/** Title menu until you're in a room, then the game + HUD. `?hamster=123` picks a Hamster, `?code=ABCD` prefills an invite. */
export function Play() {
  const [initial, setInitial] = useState<{ name: string; hamsterId: number; code: string; suit: number } | null>(null);
  const [config, setConfig] = useState<SceneConfig | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reconnecting, setReconnecting] = useState(false);
  /** True once the player chose to leave, so that closing the connection isn't reported as a lost connection. */
  const leaving = useRef(false);

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const saved = load();
    const c = Number(q.get("hamster"));
    const hamsterId = c >= 1 && c <= TOTAL_HAMSTERS ? c : saved?.hamsterId ?? randomHamster();
    // Reading the URL and storage has to wait for the client, so this runs after mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setInitial({ name: saved?.name ?? "", hamsterId, suit: saved?.suit ?? 0, code: normalizeCode(q.get("code") ?? "") });
  }, []);

  const onJoined = useCallback((room: GameRoom, me: JoinOptions) => {
    save(me);
    setInitial((i) => (i ? { ...i, name: me.name, hamsterId: me.hamsterId, suit: me.suit ?? i.suit } : i));
    setError(null);
    leaving.current = false;
    room.onDrop(() => setReconnecting(true));
    room.onReconnect(() => setReconnecting(false));
    room.onLeave((code) => {
      setReconnecting(false);
      setConfig(null);
      if (!leaving.current && code !== CloseCode.CONSENTED && code !== CloseCode.NORMAL_CLOSURE) setError("Lost connection to the game.");
    });
    setConfig({ room, font: "", dpr: 1 });
  }, []);

  const leave = useCallback(() => {
    if (!config) return;
    // Don't wait for the connection to close: through a hosting proxy the close can get lost, and the client would
    // then keep trying to reconnect instead of going back to the menu. The server still gets the leave message.
    leaving.current = true;
    config.room.reconnection.enabled = false;
    void config.room.leave();
    setReconnecting(false);
    setConfig(null);
  }, [config]);

  return (
    <main className="game-root">
      {config ? (
        <>
          <GameCanvas config={config} />
          <Hud room={config.room} onLeave={leave} />
          {reconnecting && (
            <div className="power-out display pointer-events-none absolute left-1/2 top-24 z-50 -translate-x-1/2 rounded-xl px-4 py-2 text-center text-xs font-bold uppercase tracking-wider" role="status">
              Connection lost · reconnecting…
            </div>
          )}
        </>
      ) : (
        initial && <Menu initial={initial} error={error} onJoined={onJoined} />
      )}
    </main>
  );
}
