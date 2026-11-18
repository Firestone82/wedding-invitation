import { clamp } from "./motion";

/** The pile scatters this many seconds before the Save the Date pops up. */
export const SCATTER_LEAD = 1.0;
/** The photo show fades out this many seconds before the Save the Date pops up. */
export const FADE_LEAD = 0.35;

/** How many photos fly out of the envelope and how far apart (ms). */
export function flyPlan(photoCount: number, flyCount: number, fullScreen: boolean) {
  return {
    count: Math.min(photoCount, clamp(Math.round(flyCount || 4), 1, 10)),
    gap: fullScreen ? 190 : 210,
  };
}

/** Milliseconds from the tap on the seal until the photo show starts (see `Envelope.open`). */
export function openingDuration(photoCount: number, flyCount: number, fullScreen: boolean): number {
  const { count, gap } = flyPlan(photoCount || 3, flyCount, fullScreen);
  return 170 + 140 + 750 + (count - 1) * gap + 1000 + 450 + 450 + 60;
}

/** Seconds from the tap on the seal until the Save the Date pops up, at `intervalMs` per photo. */
export function plannedRevealDelay(photoCount: number, flyCount: number, intervalMs: number, fullScreen: boolean): number {
  return openingDuration(photoCount, flyCount, fullScreen) / 1000 + (photoCount * intervalMs) / 1000 + SCATTER_LEAD;
}

export function photoIntervalMs(seconds: number): number {
  return Math.round(clamp(seconds || 1, 0.6, 10) * 1000);
}
