import * as Phaser from "phaser";
import { ZOOMIES_RPM } from "@/shared/protocol";

const GOLD = 0xf5b301;
const RED = 0xff4d6d;
const RADIUS = 104;

/**
 * The centerpiece of the Wheel Room: Squeektoshi running on a giant wheel. It spins at the real hamster's real speed,
 * and when he stops, it stops, and the whole burrow goes dark.
 */
export class WheelView {
  private wheel: Phaser.GameObjects.Container;
  private runner: Phaser.GameObjects.Container;
  private legs: Phaser.GameObjects.Graphics;
  private glow: Phaser.GameObjects.Image;
  private readout: Phaser.GameObjects.Text;
  private sleep: Phaser.GameObjects.Text;
  private spin = 0;
  private stride = 0;
  private flash = 0;

  constructor(
    private scene: Phaser.Scene,
    readonly x: number,
    readonly y: number,
    font: string,
  ) {
    const depth = 6;
    this.glow = scene.add.image(x, y, "glow").setTint(GOLD).setBlendMode(Phaser.BlendModes.ADD).setDisplaySize(RADIUS * 4, RADIUS * 4).setDepth(depth - 1);

    // Stand behind the wheel.
    const stand = scene.add.graphics().setDepth(depth);
    stand.lineStyle(14, 0x3a2a18, 1);
    stand.lineBetween(x - 70, y + RADIUS + 34, x, y);
    stand.lineBetween(x + 70, y + RADIUS + 34, x, y);
    stand.fillStyle(0x2a1c10, 1).fillRoundedRect(x - 96, y + RADIUS + 26, 192, 16, 6);

    // The turning part: rim, spokes and the rungs he runs on.
    const g = scene.add.graphics();
    g.lineStyle(10, 0x1c1408, 1).strokeCircle(0, 0, RADIUS);
    g.lineStyle(5, GOLD, 1).strokeCircle(0, 0, RADIUS);
    g.lineStyle(3, 0xffd566, 0.75).strokeCircle(0, 0, RADIUS - 16);
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * Math.PI * 2;
      g.lineStyle(2.5, 0xffe9a8, 0.8);
      g.lineBetween(Math.cos(a) * (RADIUS - 16), Math.sin(a) * (RADIUS - 16), Math.cos(a) * RADIUS, Math.sin(a) * RADIUS);
    }
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      g.lineStyle(4, 0xb8860b, 0.65);
      g.lineBetween(0, 0, Math.cos(a) * (RADIUS - 16), Math.sin(a) * (RADIUS - 16));
    }
    // A magnet on the rim: this is what the real sensor counts.
    g.fillStyle(RED, 1).fillRoundedRect(RADIUS - 12, -9, 18, 18, 4);
    this.wheel = scene.add.container(x, y, [g]).setDepth(depth + 1);
    scene.add.circle(x, y, 12, 0x3a2a18).setDepth(depth + 3).setStrokeStyle(3, GOLD);

    // Squeektoshi. He stays at the bottom of the wheel while it turns under him.
    this.legs = scene.add.graphics();
    const body = scene.add.ellipse(0, -26, 74, 58, 0xe8b98a).setStrokeStyle(3, 0x2a1c10);
    const belly = scene.add.ellipse(6, -20, 40, 34, 0xfff5e8);
    const head = scene.add.image(22, -58, "squeektoshi").setDisplaySize(68, 68);
    this.runner = scene.add.container(x, y + RADIUS - 8, [this.legs, body, belly, head]).setDepth(depth + 2);

    this.readout = scene.add
      .text(x, y - RADIUS - 34, "", { fontFamily: font, fontSize: "20px", fontStyle: "700", color: "#ffd566", stroke: "#1c1408", strokeThickness: 5 })
      .setOrigin(0.5)
      .setResolution(2)
      .setDepth(depth + 3);
    this.sleep = scene.add
      .text(x + 54, y + RADIUS - 92, "z z z", { fontFamily: font, fontSize: "22px", fontStyle: "700", color: "#6ea0ff", stroke: "#0c0906", strokeThickness: 4 })
      .setOrigin(0.5)
      .setResolution(2)
      .setDepth(depth + 4)
      .setVisible(false);
  }

  /** Flashes the rim magnet: called on every real wheel pass. */
  pulse() {
    this.flash = 1;
  }

  update(dt: number, rpm: number, on: boolean, live: boolean, inShift: boolean) {
    // One magnet pass is one turn of the real wheel, so this is his real speed.
    const target = on && inShift ? (rpm / 60) * Math.PI * 2 : 0;
    this.spin += (target - this.spin) * Math.min(1, dt / 350);
    this.wheel.rotation -= (this.spin * dt) / 1000;

    this.stride += (this.spin * dt) / 180;
    const running = this.spin > 0.2;
    const swing = running ? Math.sin(this.stride) * 16 : 0;
    this.legs.clear();
    this.legs.fillStyle(0xf3b8b0, 1).lineStyle(2.5, 0x2a1c10, 1);
    for (const [fx, s] of [
      [-20, swing],
      [20, -swing],
    ] as const) {
      this.legs.fillEllipse(fx + s, -2, 24, 12);
      this.legs.strokeEllipse(fx + s, -2, 24, 12);
    }
    this.runner.y = this.y + RADIUS - 8 - (running ? Math.abs(Math.sin(this.stride)) * 6 : 0);
    this.runner.rotation = running ? 0.08 : -0.05;
    this.sleep.setVisible(!running);
    if (!running) {
      this.sleep.y = this.y + RADIUS - 92 + Math.sin(this.scene.time.now * 0.002) * 5;
      this.sleep.setAlpha(0.55 + 0.45 * Math.sin(this.scene.time.now * 0.003));
    }

    this.flash = Math.max(0, this.flash - dt / 180);
    const zoomies = on && rpm >= ZOOMIES_RPM;
    this.glow.setTint(on ? GOLD : RED).setAlpha(on ? 0.16 + this.flash * 0.28 + (zoomies ? 0.16 : 0) : 0.14 + 0.1 * Math.sin(this.scene.time.now * 0.012));
    if (!inShift) this.readout.setText("WHEELY · WAITING");
    else if (!on) this.readout.setText("HE STOPPED · POWER OUT").setColor("#ff7a8f");
    else this.readout.setText(`${live ? "LIVE · " : ""}${zoomies ? "ZOOMIES · " : ""}${Math.round(rpm)} RPM`).setColor(zoomies ? "#7dffcf" : "#ffd566");
  }
}
