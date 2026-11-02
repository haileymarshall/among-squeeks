import { STATION_BY_ID } from "@/shared/stations";
import type { WheelLog as Log, WheelLogEntry } from "@/shared/protocol";

const fmt = (ms: number) => `${Math.floor(ms / 60000)}:${String(Math.floor(ms / 1000) % 60).padStart(2, "0")}`;
const taskName = (id: string) => STATION_BY_ID.get(id)?.task ?? id;

function line(e: WheelLogEntry) {
  if (e.kind === "out") return { tone: "text-muted", text: `Power out for ${Math.max(1, Math.round(e.ms / 1000))}s: he really stopped` };
  if (e.kind === "fix") return { tone: "text-up", text: `"${taskName(e.station)}" console fixed` };
  return { tone: "text-down", text: `"${taskName(e.station)}" console tampered ${e.dark ? "in the dark" : "with the lights on"}` };
}

/**
 * The evidence at a meeting: when the real wheel stopped, and when consoles got tampered. It names nobody. The wheel
 * can't lie, but the crew can, so compare it with what everyone says they were doing.
 */
export function WheelLog({ log, compact = false }: { log: Log | null; compact?: boolean }) {
  if (!log) return null;
  const span = Math.max(log.now, 1);
  const pos = (at: number) => `${Math.min(100, (at / span) * 100)}%`;
  const notable = log.entries.filter((e) => e.kind !== "out" || e.ms >= 3000).slice(-(compact ? 3 : 6));
  return (
    <section className="wheel-log rounded-xl p-3" aria-label="Wheel log">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3">
        <span className="display text-[11px] font-bold uppercase tracking-wider text-mon-hi">Wheel log</span>
        <span className="text-[10px] text-muted">
          {log.passes.toLocaleString("en-US")} real wheel passes · {log.run}
        </span>
      </div>
      <div className="wheel-track relative mt-2 h-5 overflow-hidden rounded-md" role="img" aria-label="Timeline of the shift">
        {log.entries.map((e, i) =>
          e.kind === "out" ? (
            <span key={i} className="absolute inset-y-0 bg-black/85" style={{ left: pos(e.at), width: `${Math.max(0.6, (e.ms / span) * 100)}%` }} />
          ) : null,
        )}
        {log.entries.map((e, i) =>
          e.kind === "tamper" ? (
            <span key={i} className="absolute inset-y-0 w-1 -translate-x-1/2 bg-down shadow-[0_0_8px_rgba(255,77,109,.9)]" style={{ left: pos(e.at) }} />
          ) : e.kind === "fix" ? (
            <span key={i} className="absolute inset-y-0 w-1 -translate-x-1/2 bg-up" style={{ left: pos(e.at) }} />
          ) : null,
        )}
      </div>
      {notable.length > 0 ? (
        <ul className="mt-2 space-y-0.5 text-[11px] leading-snug">
          {notable.map((e, i) => {
            const { tone, text } = line(e);
            return (
              <li key={i} className={tone}>
                <span className="font-mono text-white/55">{fmt(e.at)}</span> {text}
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="mt-2 text-[11px] text-muted">Nothing suspicious on the wheel yet.</p>
      )}
    </section>
  );
}
