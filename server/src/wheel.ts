import { OUTAGE_AFTER_MS, OUTAGE_MAX_MS } from "../../web/src/shared/protocol";
import saved from "./runs.json";

// The real hamster powers every shift. If Squeektoshi is on the wheel right now, the shift runs live from his RPM.
// If he's asleep, which is most of the time, it replays one of his real recorded runs, pause for pause.

type Run = { at: string; gaps: number[] };

const RUNS = saved as Run[];
const STATUS_URL = "https://api.squeekchain.com/v1/status";
const POLL_MS = 5000;
/** A live feed that stays this quiet falls back to a recorded run. */
const LIVE_QUIET_MS = 30_000;

/** The latest live reading, shared by every room so the API only gets one request per poll. */
const liveNow = { rpm: 0, at: 0 };

async function poll() {
  try {
    const response = await fetch(STATUS_URL, { signal: AbortSignal.timeout(4000) });
    const m = (await response.json()).measurement;
    if (m?.freshness === "online" && typeof m.rpmMilli === "number") {
      liveNow.rpm = m.rpmMilli / 1000;
      liveNow.at = Date.now();
    }
  } catch {
    // Keep the last reading. It goes stale, and rooms fall back to recorded runs.
  }
}
void poll();
setInterval(poll, POLL_MS).unref();

const isLive = () => liveNow.rpm > 0 && Date.now() - liveNow.at < POLL_MS * 3;
const sum = (list: number[]) => list.reduce((a, b) => a + b, 0);

function runLabel(iso: string) {
  const d = new Date(iso);
  const day = d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
  const time = d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" });
  return `${day}, ${time} UTC`;
}

export class WheelFeed {
  live = false;
  /** Shown to players: where this shift's power comes from. */
  label = "";
  passes = 0;
  rpm = 0;
  /** True while the wheel has stopped and the power is out. */
  out = false;
  /** Shift time so far, ms. Meetings don't count. */
  elapsed = 0;
  /** Gaps still to come in a recorded run. */
  private gaps: number[] = [];
  private next = 0;
  private sincePass = 0;
  private liveQuiet = 0;

  constructor(private readonly shiftMs: number) {
    if (isLive()) {
      this.live = true;
      this.label = "Live from the wheel";
      this.rpm = liveNow.rpm;
      this.next = 60_000 / liveNow.rpm;
    } else {
      this.loadRun();
    }
  }

  /** Picks a real run and starts it so that it ends about when the shift does: when he stops for real, time's up. */
  private loadRun() {
    // Gaps are real, but a pause is capped so one long nap can't stop the whole game. Lengths count the capped gaps,
    // or the run would finish early and leave the burrow dark until the shift ended.
    const capped = (r: Run) => r.gaps.map((g) => Math.min(g, OUTAGE_MAX_MS));
    const long = RUNS.filter((r) => sum(capped(r)) >= this.shiftMs);
    const pool = long.length ? long : RUNS;
    const run = pool[Math.floor(Math.random() * pool.length)];
    this.live = false;
    this.label = `His run from ${runLabel(run.at)}`;
    const gaps = capped(run);
    let left = sum(gaps);
    let from = 0;
    while (from < gaps.length - 1 && left - gaps[from] >= this.shiftMs) left -= gaps[from++];
    this.gaps = gaps.slice(from);
    this.next = this.gaps.shift() ?? 0;
  }

  /** Moves the wheel on. Returns true if the power just changed. */
  advance(dt: number) {
    this.elapsed += dt;
    const before = this.out;
    if (this.live) this.advanceLive(dt);
    else this.advanceRun(dt);
    this.out = this.sincePass >= OUTAGE_AFTER_MS;
    return this.out !== before;
  }

  private pass(gap: number) {
    this.passes++;
    this.sincePass = 0;
    const rpm = 60_000 / Math.max(gap, 1);
    this.rpm = this.rpm ? this.rpm * 0.75 + rpm * 0.25 : rpm;
  }

  private advanceRun(dt: number) {
    this.sincePass += dt;
    this.next -= dt;
    if (this.next > 0) return;
    if (!this.gaps.length) {
      // That's the end of the real run. He stopped, so the wheel stays still.
      this.next = Number.POSITIVE_INFINITY;
      this.rpm = 0;
      return;
    }
    this.pass(this.sincePass);
    this.next += this.gaps.shift()!;
    if (this.next < 0) this.next = 0;
  }

  private advanceLive(dt: number) {
    this.sincePass += dt;
    if (!isLive()) {
      this.liveQuiet += dt;
      if (this.liveQuiet >= LIVE_QUIET_MS) {
        this.loadRun();
        this.sincePass = 0;
      }
      return;
    }
    this.liveQuiet = 0;
    this.next -= dt;
    if (this.next > 0) return;
    this.pass(60_000 / liveNow.rpm);
    this.next = 60_000 / liveNow.rpm;
  }
}
