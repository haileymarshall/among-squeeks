import { useId } from "react";
import { hex } from "@/shared/suits";

/** Mix a 0xRRGGBB color toward black (k < 1) or white (k > 1). */
function tone(c: number, k: number) {
  const ch = [(c >> 16) & 255, (c >> 8) & 255, c & 255].map((v) => Math.round(k < 1 ? v * k : v + (255 - v) * (k - 1)));
  return `rgb(${ch.join(",")})`;
}

/** Vector hamster, same design as the in-game sprite (game/textures.ts makeCharacter). Faces right; flip with CSS. */
export function HamsterDev({ hamsterId, color, className, style }: { hamsterId: number; color: number; className?: string; style?: React.CSSProperties }) {
  const id = useId().replace(/:/g, "");
  const ink = "#2a1c10";
  return (
    <svg viewBox="0 0 128 156" className={className} style={style} aria-hidden>
      <defs>
        <linearGradient id={`b${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={tone(color, 1.18)} />
          <stop offset="0.55" stopColor={hex(color)} />
          <stop offset="1" stopColor={tone(color, 0.6)} />
        </linearGradient>
      </defs>
      <g stroke={ink} strokeWidth="4" strokeLinejoin="round">
        {[46, 82].map((x) => (
          <ellipse key={x} cx={x} cy="146" rx="15" ry="8" fill="#f3b8b0" />
        ))}
        <ellipse cx="24" cy="106" rx="9" ry="16" fill={tone(color, 0.6)} transform="rotate(14 24 106)" />
        <ellipse cx="64" cy="108" rx="42" ry="39" fill={`url(#b${id})`} />
      </g>
      <ellipse cx="64" cy="116" rx="25" ry="23" fill="#fff5e8" opacity="0.92" />
      <rect x="26" y="112" width="76" height="8" fill="#3a2a18" />
      <rect x="56" y="109" width="16" height="14" rx="3" fill="#f5b301" stroke={ink} strokeWidth="2" />
      <ellipse cx="104" cy="106" rx="9" ry="16" fill={tone(color, 0.9)} stroke={ink} strokeWidth="4" transform="rotate(-14 104 106)" />
      <circle cx="106" cy="121" r="6" fill="#f3b8b0" stroke={ink} strokeWidth="4" />
      <image href={`hamsters/${hamsterId}.svg`} x="10" y="-6" width="108" height="108" />
    </svg>
  );
}
