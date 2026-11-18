import { useId } from "react";

function blobPath(radius: number, seed: number, points = 28, wobble = 0.07): string {
  const coords: [number, number][] = [];
  for (let i = 0; i < points; i++) {
    const angle = (i / points) * Math.PI * 2;
    const k = 1 + wobble * Math.sin(i * 2.7 + seed) + wobble * 0.6 * Math.cos(i * 5.3 + seed * 2);
    coords.push([50 + Math.cos(angle) * radius * k, 50 + Math.sin(angle) * radius * k]);
  }
  let d = `M${coords[0][0].toFixed(2)},${coords[0][1].toFixed(2)}`;
  for (let i = 0; i < points; i++) {
    const current = coords[i];
    const following = coords[(i + 1) % points];
    d += ` Q${current[0].toFixed(2)},${current[1].toFixed(2)} ${((current[0] + following[0]) / 2).toFixed(2)},${((current[1] + following[1]) / 2).toFixed(2)}`;
  }
  return `${d}Z`;
}

const SEAL_OUTLINE = blobPath(47, 1.3);
const CRACK = "L52,-10 L47,20 L56,34 L46,50 L55,63 L48,80 L53,110";
const CLIP = {
  whole: "M-10,-10H110V110H-10Z",
  left: `M-10,-10 ${CRACK} L-10,110Z`,
  right: `M110,-10 ${CRACK} L110,110Z`,
};

export type SealPart = keyof typeof CLIP;

/** Wax seal with the couple's monogram; `part` draws one half of the cracked seal. */
export function Seal({ monogram, part = "whole" }: { monogram: string; part?: SealPart }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true">
      <defs>
        <radialGradient id={`wax-${id}`} cx="38%" cy="32%" r="75%">
          <stop offset="0" stopColor="#FBF3E1" />
          <stop offset=".55" stopColor="#EADCBF" />
          <stop offset="1" stopColor="#CDBB93" />
        </radialGradient>
        <radialGradient id={`stamp-${id}`} cx="60%" cy="65%" r="70%">
          <stop offset="0" stopColor="#E9DAB9" />
          <stop offset="1" stopColor="#D8C69E" />
        </radialGradient>
        <clipPath id={`clip-${id}`}>
          <path d={CLIP[part]} />
        </clipPath>
      </defs>
      <g clipPath={`url(#clip-${id})`}>
        <path d={SEAL_OUTLINE} fill={`url(#wax-${id})`} />
        <circle cx="50" cy="50" r="33" fill={`url(#stamp-${id})`} stroke="#C7B48A" strokeWidth="1.4" />
        <circle cx="50" cy="50" r="29" fill="none" stroke="#F8F0DC" strokeWidth=".8" opacity=".8" />
        <text
          x="50"
          y="60"
          textAnchor="middle"
          fontSize="30"
          fill="#9A8255"
          stroke="#FBF4E2"
          strokeWidth=".35"
          paintOrder="stroke"
          style={{ fontFamily: "var(--font-script), cursive" }}
        >
          {monogram}
        </text>
        <path d="M30 76 q20 8 40 0" stroke="#C7B48A" strokeWidth=".8" fill="none" />
        <ellipse cx="34" cy="28" rx="10" ry="5" fill="#fff" opacity=".35" transform="rotate(-30 34 28)" />
        {part !== "whole" && <path d={`M52,-10 ${CRACK}`} fill="none" stroke="#B9A577" strokeWidth="1.2" />}
      </g>
    </svg>
  );
}
