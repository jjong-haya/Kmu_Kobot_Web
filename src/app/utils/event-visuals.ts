import type { ClubEvent, EventImageTone } from "../api/events";
import mainLogo from "../../assets/mainLogo.png";
import { safeImageUrl } from "./safe-image-url";

const TONE_META: Record<EventImageTone, { from: string; mid: string; to: string; accent: string }> = {
  navy: {
    from: "#061b4c",
    mid: "#103078",
    to: "#6d8fd7",
    accent: "#dbe7ff",
  },
  amber: {
    from: "#472508",
    mid: "#c97818",
    to: "#ffd27a",
    accent: "#fff1c7",
  },
  green: {
    from: "#083324",
    mid: "#1d7b51",
    to: "#8be0b4",
    accent: "#dff8e9",
  },
  slate: {
    from: "#1e252f",
    mid: "#526071",
    to: "#bcc6d1",
    accent: "#eef2f6",
  },
  red: {
    from: "#461516",
    mid: "#b33a35",
    to: "#f4a19a",
    accent: "#ffe4df",
  },
};

export function buildEventImage(event: ClubEvent, imageTone = event.imageTone, variant = 0) {
  const explicitImage = safeImageUrl(event.imageUrl);
  if (explicitImage) return explicitImage;

  if (!imageTone || variant === 0) return mainLogo;

  const tone = TONE_META[imageTone];
  const offset = variant * 24;
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="${tone.from}"/>
          <stop offset="0.54" stop-color="${tone.mid}"/>
          <stop offset="1" stop-color="${tone.to}"/>
        </linearGradient>
        <radialGradient id="glow" cx="0.78" cy="0.18" r="0.72">
          <stop offset="0" stop-color="${tone.accent}" stop-opacity="0.8"/>
          <stop offset="1" stop-color="${tone.accent}" stop-opacity="0"/>
        </radialGradient>
        <pattern id="grid" width="44" height="44" patternUnits="userSpaceOnUse">
          <path d="M44 0H0V44" fill="none" stroke="rgba(255,255,255,.17)" stroke-width="1"/>
        </pattern>
      </defs>
      <rect width="800" height="800" fill="url(#bg)"/>
      <rect width="800" height="800" fill="url(#glow)"/>
      <rect width="800" height="800" fill="url(#grid)" opacity="0.55"/>
      <circle cx="${602 - offset}" cy="${190 + offset / 3}" r="118" fill="rgba(255,255,255,.15)"/>
      <circle cx="${612 - offset}" cy="${190 + offset / 3}" r="66" fill="none" stroke="rgba(255,255,255,.64)" stroke-width="18"/>
      <path d="M92 ${610 - offset / 5}c66-86 132-86 198 0s132 86 198 0 132-86 198 0" fill="none" stroke="rgba(255,255,255,.62)" stroke-width="22" stroke-linecap="round"/>
      <path d="M${118 + offset / 2} 220h250v250H${118 + offset / 2}z" fill="rgba(255,255,255,.08)" stroke="rgba(255,255,255,.36)" stroke-width="3"/>
      <path d="M${178 + offset / 2} 280h130v130H${178 + offset / 2}z" fill="rgba(255,255,255,.12)" stroke="rgba(255,255,255,.48)" stroke-width="3"/>
      <path d="M${242 + offset / 2} 208v-46m0 354v-46M${106 + offset / 2} 345H62m348 0h-44" stroke="rgba(255,255,255,.56)" stroke-width="16" stroke-linecap="round"/>
      <path d="M494 468h166c22 0 40 18 40 40v24c0 22-18 40-40 40H494c-22 0-40-18-40-40v-24c0-22 18-40 40-40z" fill="rgba(255,255,255,.16)" stroke="rgba(255,255,255,.36)" stroke-width="3"/>
      <circle cx="520" cy="573" r="30" fill="rgba(255,255,255,.68)"/>
      <circle cx="638" cy="573" r="30" fill="rgba(255,255,255,.68)"/>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

export function hasEventImage(event: Pick<ClubEvent, "imageUrl">) {
  return Boolean(safeImageUrl(event.imageUrl));
}
