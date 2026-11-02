// Draws the hamster portraits in public/hamsters. Usage: node scripts/make-hamsters.mjs
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const out = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "hamsters");
mkdirSync(out, { recursive: true });

const FUR = ["#E8B98A", "#D98F5C", "#8D8D99", "#F2E3C9", "#C9A27E", "#E6A5B8", "#B7A58C", "#F0CFA0"];
const GEAR = {
  none: "",
  hardhat:
    '<path d="M24 34C24 14 37 6 50 6s26 8 26 28z" fill="#f5b301" stroke="#7a5a00" stroke-width="1.5"/><rect x="18" y="32" width="64" height="6" rx="3" fill="#d99a00"/><circle cx="50" cy="20" r="5" fill="#fff4c2" stroke="#7a5a00"/>',
  shades:
    '<rect x="25" y="41" width="22" height="13" rx="4" fill="#111"/><rect x="53" y="41" width="22" height="13" rx="4" fill="#111"/><path d="M47 46h6" stroke="#111" stroke-width="3"/><path d="M29 44l6 0" stroke="#fff" stroke-width="1.5" opacity=".6"/>',
  hood:
    '<path d="M11 62C11 25 30 10 50 10s39 15 39 52c0 13-3 25-8 32H19c-5-7-8-19-8-32z" fill="#2c2c35"/><ellipse cx="50" cy="52" rx="24" ry="17" fill="var(--fur)"/>',
  monocle:
    '<circle cx="63" cy="48" r="9.5" fill="#ffffff22" stroke="#f5b301" stroke-width="2.5"/><path d="M72 53c5 8 5 18 2 27" fill="none" stroke="#f5b301" stroke-width="1.5"/>',
  tophat:
    '<rect x="33" y="-1" width="34" height="27" rx="2" fill="#16161c"/><rect x="33" y="17" width="34" height="6" fill="#f5b301"/><rect x="23" y="24" width="54" height="5" rx="2" fill="#16161c"/>',
  headset:
    '<path d="M17 52C17 21 32 12 50 12s33 9 33 40" fill="none" stroke="#222" stroke-width="5"/><rect x="10" y="46" width="11" height="19" rx="4" fill="#222"/><rect x="79" y="46" width="11" height="19" rx="4" fill="#222"/><path d="M84 65c0 10-8 13-19 13" fill="none" stroke="#222" stroke-width="3"/><circle cx="64" cy="78" r="3" fill="#222"/>',
  bow: '<path d="M50 21 33 10v22zM50 21l17-11v22z" fill="#ff7fb0" stroke="#c94f85"/><circle cx="50" cy="21" r="4.5" fill="#d9558a"/>',
  crown:
    '<path d="M30 28 26 8l13 9L50 3l11 14 13-9-4 20z" fill="#f5b301" stroke="#7a5a00" stroke-width="1.5"/><circle cx="50" cy="20" r="3" fill="#ff5a52"/>',
  beanie:
    '<path d="M25 33C25 15 37 8 50 8s25 7 25 25z" fill="#6ea0ff"/><rect x="21" y="29" width="58" height="9" rx="4" fill="#4a78d1"/><circle cx="50" cy="7" r="5" fill="#fff"/>',
  headlamp:
    '<rect x="21" y="30" width="58" height="6" rx="3" fill="#333"/><circle cx="50" cy="30" r="8" fill="#fff4c2" stroke="#333" stroke-width="2.5"/>',
  glasses:
    '<circle cx="37" cy="49" r="9" fill="#ffffff18" stroke="#222" stroke-width="2.5"/><circle cx="63" cy="49" r="9" fill="#ffffff18" stroke="#222" stroke-width="2.5"/><path d="M46 49h8" stroke="#222" stroke-width="2.5"/>',
};
const names = Object.keys(GEAR);

function portrait(i) {
  const fur = FUR[i % FUR.length];
  const gear = names[i % names.length];
  // Hoods and caps sit behind or over the face, so draw them at the right depth.
  const behind = gear === "hood" ? GEAR.hood.replace("var(--fur)", fur) : "";
  const front = gear === "hood" ? "" : GEAR[gear];
  const eyes = gear === "shades" ? "" : '<circle cx="37" cy="49" r="4.6" fill="#111"/><circle cx="63" cy="49" r="4.6" fill="#111"/><circle cx="38.5" cy="47.5" r="1.4" fill="#fff"/><circle cx="64.5" cy="47.5" r="1.4" fill="#fff"/>';
  const ears = gear === "hood" ? "" : `<circle cx="24" cy="26" r="13" fill="${fur}" stroke="#2a1c10" stroke-width="2"/><circle cx="76" cy="26" r="13" fill="${fur}" stroke="#2a1c10" stroke-width="2"/><circle cx="24" cy="26" r="6.5" fill="#f3b8b0"/><circle cx="76" cy="26" r="6.5" fill="#f3b8b0"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="256" height="256">${behind}${ears}<ellipse cx="50" cy="56" rx="35" ry="33" fill="${fur}" stroke="#2a1c10" stroke-width="2"/><ellipse cx="21" cy="67" rx="15" ry="13" fill="${fur}" stroke="#2a1c1033" stroke-width="1.5"/><ellipse cx="79" cy="67" rx="15" ry="13" fill="${fur}" stroke="#2a1c1033" stroke-width="1.5"/><ellipse cx="50" cy="69" rx="17" ry="13" fill="#fff5e8"/>${eyes}<path d="M46 62h8l-4 4.5z" fill="#d9707a"/><path d="M44 71c2 3 4 3 6 0 2 3 4 3 6 0" fill="none" stroke="#5a3a2a" stroke-width="1.6" stroke-linecap="round"/><rect x="47.5" y="73" width="5" height="4.5" rx="1" fill="#fff" stroke="#5a3a2a" stroke-width=".5"/>${front}</svg>\n`;
}

for (let i = 0; i < 24; i++) writeFileSync(join(out, `${i + 1}.svg`), portrait(i));
console.log("Drew 24 hamsters in", out);
