import { WheelLog } from "./WheelLog";
import type { WheelLog as WheelLogData } from "@/shared/protocol";
import { useEffect } from "react";
import { sfx } from "@/game/sfx";
import { SUITS, hex } from "@/shared/suits";
import type { GameRoom } from "@/net/net";
import type { GameSnapshot } from "@/net/useGame";
import type { ServerMessages } from "@/shared/protocol";

/** End of the match: who won, who the Ruggers were, and the host's way back to the lobby. */
export function MatchEnd({
  room,
  game,
  ruggers,
  log,
}: {
  room: GameRoom;
  game: GameSnapshot;
  ruggers: string[];
  log: WheelLogData | null;
}) {
  const devsWin = game.winner === "devs";
  const iRug = ruggers.includes(room.sessionId);
  const iWon = devsWin !== iRug;
  const isHost = game.hostId === room.sessionId;
  const rugSeats = game.seats.filter((s) => ruggers.includes(s.id));

  useEffect(() => {
    if (iWon) sfx.win();
    else sfx.lose();
  }, [iWon]);

  return (
    <div className={`reveal pointer-events-auto absolute inset-0 z-50 grid place-items-center overflow-y-auto px-4 ${devsWin ? "role-community" : "role-rugger"}`}>
      <div className="role-in flex flex-col items-center text-center">
        <div className="role-glow" />
        <div className="display text-[11px] font-bold uppercase tracking-[0.5em] text-white/60">{devsWin ? "The block got mined" : "The vault got rugged"}</div>
        <h1 className="role-title display mt-2 text-[clamp(44px,10vw,110px)] font-bold uppercase leading-none">{devsWin ? "Miners win" : "Ruggers win"}</h1>
        {game.endWhy && <p className="mt-3 max-w-md text-sm text-white/75">{game.endWhy}</p>}
        <p className={`display mt-3 text-lg font-bold uppercase tracking-widest ${iWon ? "text-up" : "text-down"}`}>{iWon ? "You won" : "You lost"}</p>


        <div className="mt-5 w-[min(520px,88vw)] text-left">
          <WheelLog log={log} compact />
        </div>

        <div className="mt-8 text-[11px] font-bold uppercase tracking-[0.3em] text-white/60">
          The Rugger{rugSeats.length === 1 ? " was" : "s were"}
        </div>
        <div className="mt-3 flex flex-wrap justify-center gap-4">
          {rugSeats.map((s, i) => (
            <div key={s.id} className="lineup-in flex flex-col items-center" style={{ animationDelay: `${200 + i * 120}ms` }}>
              <div
                className="h-[clamp(64px,10vw,96px)] w-[clamp(64px,10vw,96px)] overflow-hidden rounded-[38%]"
                style={{ boxShadow: `0 0 0 3px ${hex(SUITS[s.suit].color)}, 0 0 30px rgba(255,45,85,.5)` }}
              >
                <img src={`hamsters/${s.hamsterId}.svg`} alt="" className="h-full w-full object-cover" />
              </div>
              <span className="display mt-1.5 text-xs font-bold text-down">{s.name}</span>
            </div>
          ))}
        </div>

        <a
          className="ghost-btn pointer-events-auto mt-6 inline-flex items-center px-4 py-2 text-sm"
          target="_blank"
          rel="noopener noreferrer"
          href={`https://x.com/intent/tweet?text=${encodeURIComponent(
            `${iRug ? (iWon ? "I rugged my whole crew" : "I got caught rugging my crew") : iWon ? "My crew caught the Rugger" : "My crew got rugged"} in Among Squeeks. The power runs on a real hamster, and when he stops, the lights go out. ${window.location.origin}${window.location.pathname}`,
          )}`}
        >
          Post on X
        </a>

        <div className="mt-10">
          {isHost ? (
            <button type="button" onClick={() => room.send("lobby")} className="ghost-btn px-8">
              Back to lobby
            </button>
          ) : (
            <div className="display animate-pulse text-xs font-bold uppercase tracking-widest text-muted">Waiting for the host…</div>
          )}
        </div>
      </div>
    </div>
  );
}
