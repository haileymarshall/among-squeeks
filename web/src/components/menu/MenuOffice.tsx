import { useEffect, useState } from "react";
import { hamsterName } from "@/shared/protocol";
import { SUITS } from "@/shared/suits";
import { HamsterDev } from "./HamsterDev";
import { randomHamster, type MenuApi } from "./useMenu";

type Building = { left: number; width: number; height: number; lit: number; hue: "warm" | "mon" };
type Walker = { hamsterId: number; suit: number; size: number; dur: number; delay: number; dir: 1 | -1; bottom: number };

/** The city skyline seen through the office windows. */
function makeSkyline(): Building[] {
  const out: Building[] = [];
  let x = -2;
  while (x < 102) {
    const width = 4 + Math.random() * 7;
    out.push({ left: x, width, height: 28 + Math.random() * 46, lit: 0.12 + Math.random() * 0.3, hue: Math.random() < 0.7 ? "warm" : "mon" });
    x += width + Math.random() * 1.2;
  }
  return out;
}

/** Devs walking across the office floor, some each way. */
function makeWalkers(): Walker[] {
  return Array.from({ length: 6 }, (_, i) => ({
    hamsterId: randomHamster(),
    suit: (i * 5 + 1) % SUITS.length,
    size: 64 + ((i * 17) % 40),
    dur: 18 + ((i * 7) % 16),
    delay: -((i * 6.1) % 24),
    dir: i % 2 ? 1 : -1,
    bottom: 2 + ((i * 5) % 12),
  }));
}

/** "Hamster #12 was not The Rugger." Types out, holds, deletes, next. */
function useEjectLine(ids: number[]) {
  const [text, setText] = useState("");
  useEffect(() => {
    const lines = ids.map((id, i) =>
      i === 2 ? `${hamsterName(id)} was fired. They were The Rugger.` : i % 3 === 1 ? "1 Rugger remains." : `${hamsterName(id)} was fired. They were not The Rugger.`,
    );
    let line = 0;
    let n = 0;
    let dir = 1;
    let hold = 0;
    const t = setInterval(() => {
      const full = lines[line % lines.length];
      if (hold > 0) return void hold--;
      n += dir;
      if (n >= full.length) {
        dir = -1;
        hold = 40;
      } else if (n <= 0) {
        dir = 1;
        line++;
        hold = 6;
      }
      setText(full.slice(0, Math.max(0, n)));
    }, 55);
    return () => clearInterval(t);
  }, [ids]);
  return text;
}

/** Title screen: the Wheel Room at night. The city glows through the windows, devs wander the floor, yours stands front and center. */
export function MenuOffice({ m }: { m: MenuApi }) {
  const [skyline] = useState(makeSkyline);
  const [walkers] = useState(makeWalkers);
  const [ids] = useState(() => walkers.map((w) => w.hamsterId));
  const eject = useEjectLine(ids);
  const [live, setLive] = useState<{ running: boolean; rpm: number } | null>(null);

  // Shows whether the real hamster is running right now. If this fails, the game still works.
  useEffect(() => {
    const read = () =>
      fetch("https://api.squeekchain.com/v1/status")
        .then((r) => r.json())
        .then((d) => {
          const rpm = Math.round((d?.measurement?.rpmMilli ?? 0) / 1000);
          setLive({ running: rpm > 0, rpm });
        })
        .catch(() => {});
    void read();
    const t = setInterval(read, 15000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="of-root absolute inset-0 overflow-y-auto overflow-x-hidden">
      <div className="of-sky" />
      <div className="menu-wheel" aria-hidden />
      <div className="of-skyline">
        {skyline.map((b, i) => (
          <div
            key={i}
            className={`of-bld ${b.hue === "mon" ? "of-bld-mon" : ""}`}
            style={{ left: `${b.left}%`, width: `${b.width}%`, height: `${b.height}%`, ["--lit" as string]: b.lit, animationDelay: `${-i * 1.7}s` }}
          />
        ))}
      </div>
      <div className="of-window" />
      <div className="of-sign display">
        THE <span>BURROW</span>
      </div>
      <div className="of-floor" />

      {walkers.map((w, i) => (
        <div
          key={i}
          className={`of-walk pointer-events-none absolute ${w.dir < 0 ? "of-walk-back" : ""}`}
          style={{ bottom: `${w.bottom}%`, animationDuration: `${w.dur}s`, animationDelay: `${w.delay}s`, zIndex: 5 - Math.floor(w.bottom / 4) }}
        >
          <div className="of-bob" style={{ animationDuration: `${0.5 + (i % 3) * 0.08}s` }}>
            <HamsterDev hamsterId={w.hamsterId} color={SUITS[w.suit].color} style={{ width: w.size, transform: w.dir < 0 ? "scaleX(-1)" : undefined, opacity: 0.9 }} />
          </div>
        </div>
      ))}

      <div className="relative z-10 mx-auto flex min-h-full max-w-6xl flex-col items-center px-4 pb-6 pt-14 md:pt-[max(24px,4vh)]">
        <h1 className="sp-title display text-center font-bold uppercase leading-[0.85]">
          <span className="block">Among</span>
          <span className="sp-title-2 block">Squeeks</span>
        </h1>
        <p className="sp-sub display mt-3 text-center text-[clamp(13px,1.8vw,18px)] font-bold uppercase tracking-[0.35em] text-white/90">
          There&apos;s a <span className="text-down">Rugger</span> among us
        </p>
        <p className="mt-2 flex items-center gap-2 text-center text-[12px] text-white/75">
          <span className={`inline-block h-2 w-2 rounded-full ${live?.running ? "bg-up shadow-[0_0_8px_#2ee6a6]" : "bg-white/40"}`} />
          {live === null ? "Free to play. Powered by a real hamster." : live.running ? `Squeektoshi is on the wheel right now: ${live.rpm} RPM` : "Free to play. Squeektoshi is asleep, so shifts replay his real runs."}
        </p>
        <p className="display mt-2 h-6 text-center text-[clamp(12px,1.4vw,15px)] tracking-[0.12em] text-white/55">
          {eject}
          <span className="sp-caret">▍</span>
        </p>

        {/* Your Hamster dev */}
        <button type="button" onClick={m.shuffle} className="sp-hero of-idle group relative my-[clamp(4px,1.5vh,20px)]" title="Shuffle Hamster">
          <div className="sp-hero-glow" />
          <HamsterDev key={`${m.hamsterId}-${m.suit}`} hamsterId={m.hamsterId} color={SUITS[m.suit].color} className="sp-hero-mate relative w-[clamp(110px,18vh,200px)]" />
        </button>

        {/* Console dock */}
        <div className="sp-dock w-full max-w-4xl rounded-[28px] p-3 md:p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-stretch">
            <div className="flex items-center gap-2 md:w-[46%]">
                  <button type="button" onClick={m.prev} className="sp-key" aria-label="Previous Hamster">‹</button>
                  <label className="sp-field flex flex-1 items-center gap-2 px-3">
                    <span className="display text-xs font-bold text-white/50">HAMSTER #</span>
                    <input
                      inputMode="numeric"
                      value={m.hamsterId}
                      onChange={(e) => m.setHamsterId(Number(e.target.value.replace(/\D/g, "")))}
                      className="display w-14 bg-transparent text-lg font-bold outline-none"
                      aria-label="Hamster number"
                    />
                  </label>
                  <button type="button" onClick={m.next} className="sp-key" aria-label="Next Hamster">›</button>
                  <button type="button" onClick={m.shuffle} className="sp-key" aria-label="Random Hamster">⟳</button>
            </div>
            <input
              value={m.name}
              maxLength={16}
              onChange={(e) => m.setName(e.target.value)}
              placeholder={`Name: ${hamsterName(m.hamsterId)}`}
              className="sp-field flex-1 px-4 py-3 outline-none"
              aria-label="Your name"
            />
          </div>

          <div className="mt-3 flex gap-1.5">
            {SUITS.map((s, i) => (
              <button
                key={s.name}
                type="button"
                onClick={() => m.setSuit(i)}
                className={`h-5 flex-1 rounded-full transition ${m.suit === i ? "scale-y-125 ring-2 ring-white" : "opacity-70 hover:opacity-100"}`}
                style={{ background: `#${s.color.toString(16).padStart(6, "0")}` }}
                aria-label={`${s.name} suit preview`}
              />
            ))}
          </div>

          <div className="mt-3 grid gap-3 md:grid-cols-[1.4fr_1fr_1.2fr]">
            <button type="button" onClick={() => m.go("quick")} disabled={!!m.busy} className="sp-play">
              {m.busy === "quick" ? "Finding a shift…" : "Play"}
            </button>
            <button type="button" onClick={() => m.go("create")} disabled={!!m.busy} className="sp-btn">
              {m.busy === "create" ? "Creating…" : "Host private"}
            </button>
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                m.go("join");
              }}
            >
              <input
                value={m.code}
                onChange={(e) => m.setCode(e.target.value)}
                placeholder="CODE"
                aria-label="Room code"
                autoCapitalize="characters"
                className="sp-field display w-0 flex-1 text-center text-lg font-bold tracking-[0.35em] outline-none"
              />
              <button type="submit" disabled={!!m.busy} className="sp-btn px-4">
                {m.busy === "join" ? "…" : "Join"}
              </button>
            </form>
          </div>
          <div className="mt-2 min-h-5 text-center text-sm text-down" role="alert">
            {m.error}
          </div>
        </div>
      </div>
    </div>
  );
}
