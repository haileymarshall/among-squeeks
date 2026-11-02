import * as Phaser from "phaser";
import { hex } from "@/shared/suits";

// Procedural textures, drawn once with Canvas 2D so the art stays crisp at any zoom.

export const CHAR_W = 128;
export const CHAR_H = 156;

function shade(c: number, f: number) {
  const r = Math.min(255, Math.max(0, ((c >> 16) & 255) * f));
  const g = Math.min(255, Math.max(0, ((c >> 8) & 255) * f));
  const b = Math.min(255, Math.max(0, (c & 255) * f));
  return `rgb(${r | 0},${g | 0},${b | 0})`;
}

function canvasTex(scene: Phaser.Scene, key: string, w: number, h: number) {
  if (scene.textures.exists(key)) scene.textures.remove(key);
  const tex = scene.textures.createCanvas(key, w, h)!;
  return { tex, ctx: tex.getContext() };
}

/** Soft radial glow, white, used for lights (tinted + additive). */
export function makeGlow(scene: Phaser.Scene) {
  const s = 256;
  const { tex, ctx } = canvasTex(scene, "glow", s, s);
  const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.25, "rgba(255,255,255,0.55)");
  g.addColorStop(0.6, "rgba(255,255,255,0.14)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, s, s);
  tex.refresh();
}

/** Dark ring that fades the edge of the vision circle. Transparent center. */
export function makeVignette(scene: Phaser.Scene) {
  const s = 512;
  const { tex, ctx } = canvasTex(scene, "vignette", s, s);
  const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  g.addColorStop(0, "rgba(0,0,0,0)");
  g.addColorStop(0.62, "rgba(0,0,0,0)");
  g.addColorStop(0.86, "rgba(0,0,0,0.55)");
  g.addColorStop(1, "rgba(0,0,0,1)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, s, s);
  tex.refresh();
}

/** The city at night, far below the office windows: dark blocks with scattered lit windows. */
export function makeSpace(scene: Phaser.Scene) {
  // Packed earth around the burrow: dark soil with little stones and roots.
  const s = 512;
  const { tex, ctx } = canvasTex(scene, "space", s, s);
  ctx.fillStyle = "#120c06";
  ctx.fillRect(0, 0, s, s);
  for (let i = 0; i < 900; i++) {
    const shade = 18 + Math.random() * 22;
    ctx.fillStyle = `rgba(${shade + 18},${shade + 6},${shade - 8},${0.25 + Math.random() * 0.35})`;
    const r = 1 + Math.random() * 3;
    ctx.beginPath();
    ctx.arc(Math.random() * s, Math.random() * s, r, 0, Math.PI * 2);
    ctx.fill();
  }
  for (let i = 0; i < 26; i++) {
    ctx.fillStyle = "rgba(90,70,48,0.5)";
    ctx.beginPath();
    ctx.ellipse(Math.random() * s, Math.random() * s, 4 + Math.random() * 9, 3 + Math.random() * 5, Math.random() * 3, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.strokeStyle = "rgba(70,48,26,0.45)";
  ctx.lineWidth = 2;
  for (let i = 0; i < 9; i++) {
    let x = Math.random() * s;
    let y = Math.random() * s;
    ctx.beginPath();
    ctx.moveTo(x, y);
    for (let k = 0; k < 5; k++) {
      x += (Math.random() - 0.5) * 60;
      y += 14 + Math.random() * 18;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  tex.refresh();
}

/** Office carpet tiles: soft woven squares, alternating grain. Light gray so each room can tint it. */
export function makeFloor(scene: Phaser.Scene) {
  const s = 80;
  const { tex, ctx } = canvasTex(scene, "floor", s, s);
  const half = s / 2;
  for (let i = 0; i < 4; i++) {
    const x = (i % 2) * half;
    const y = Math.floor(i / 2) * half;
    ctx.fillStyle = i % 3 ? "#c9c9c9" : "#bdbdbd";
    ctx.fillRect(x, y, half, half);
    // Weave grain, horizontal on two tiles and vertical on the others.
    ctx.fillStyle = "rgba(0,0,0,0.07)";
    for (let k = 1; k < half; k += 3) {
      if (i % 3) ctx.fillRect(x, y + k, half, 1);
      else ctx.fillRect(x + k, y, 1, half);
    }
    ctx.fillStyle = "rgba(0,0,0,0.22)";
    ctx.fillRect(x, y, half, 1);
    ctx.fillRect(x, y, 1, half);
  }
  for (let i = 0; i < 90; i++) {
    ctx.fillStyle = `rgba(${Math.random() > 0.5 ? "255,255,255" : "0,0,0"},0.06)`;
    ctx.fillRect(Math.random() * s, Math.random() * s, 2, 2);
  }
  tex.refresh();
}

/** Corridor: polished dark concrete with a guide strip. */
export function makeHall(scene: Phaser.Scene) {
  const s = 80;
  const { tex, ctx } = canvasTex(scene, "hall", s, s);
  ctx.fillStyle = "#1c140a";
  ctx.fillRect(0, 0, s, s);
  for (let i = 0; i < 60; i++) {
    ctx.fillStyle = "rgba(255,255,255,0.03)";
    ctx.fillRect(Math.random() * s, Math.random() * s, 3, 1);
  }
  ctx.fillStyle = "rgba(255,255,255,0.05)";
  ctx.fillRect(0, s / 2, s, 1);
  ctx.fillStyle = "rgba(245,179,1,0.1)";
  ctx.fillRect(0, 0, s, 2);
  tex.refresh();
}

/**
 * A Hamster dev: the NFT art is the head (big and round, so the Hamster is the face), studio headphones, a hoodie in
 * the seat color with a lanyard ID badge, jeans and sneakers. Faces right; flip for left.
 */
export function makeCharacter(scene: Phaser.Scene, key: string, suit: number, faceKey: string | null) {
  const { tex, ctx } = canvasTex(scene, key, CHAR_W, CHAR_H);
  const outline = "#2a1c10";
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.lineWidth = 4;
  ctx.strokeStyle = outline;

  // Stubby pink feet.
  for (const fx of [46, 82]) {
    ctx.fillStyle = "#f3b8b0";
    ctx.beginPath();
    ctx.ellipse(fx, 146, 15, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  // Back paw.
  ctx.fillStyle = shade(suit, 0.6);
  ctx.beginPath();
  ctx.ellipse(24, 106, 9, 16, 0.25, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Chubby body in the crew's suit color, so players can say "I saw Pink at the red lever".
  const body = ctx.createLinearGradient(24, 72, 104, 146);
  body.addColorStop(0, shade(suit, 1.2));
  body.addColorStop(0.55, shade(suit, 1));
  body.addColorStop(1, shade(suit, 0.6));
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.ellipse(64, 108, 42, 39, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Fluffy belly.
  ctx.fillStyle = "rgba(255,245,232,0.92)";
  ctx.beginPath();
  ctx.ellipse(64, 116, 25, 23, 0, 0, Math.PI * 2);
  ctx.fill();

  // Tool belt with a gold buckle.
  ctx.fillStyle = "#3a2a18";
  ctx.fillRect(26, 112, 76, 8);
  ctx.fillStyle = "#f5b301";
  roundRect(ctx, 56, 109, 16, 14, 3);
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.lineWidth = 4;

  // Front paw.
  ctx.fillStyle = shade(suit, 0.9);
  ctx.beginPath();
  ctx.ellipse(104, 106, 9, 16, -0.25, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#f3b8b0";
  ctx.beginPath();
  ctx.arc(106, 121, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Head: the portrait already has ears, cheeks and gear on a clear background.
  if (faceKey && scene.textures.exists(faceKey)) {
    const img = scene.textures.get(faceKey).getSourceImage() as CanvasImageSource;
    ctx.drawImage(img, 64 - 54, -6, 108, 108);
  } else {
    ctx.fillStyle = "#e8b98a";
    ctx.beginPath();
    ctx.arc(64, 46, 36, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  tex.refresh();
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

export { hex };
