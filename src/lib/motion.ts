export const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

export const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

/** Small seeded random generator (mulberry32), so server and browser render the same "random" tilts. */
export function seededRandom(seed: number): () => number {
  let state = seed | 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Random number in [-1, 1). */
export const signed = (random: () => number): number => random() * 2 - 1;

export const prefersReducedMotion = (): boolean => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export const hasFinePointer = (): boolean => window.matchMedia("(hover: hover) and (pointer: fine)").matches;

/** Phones in portrait: the envelope fills the screen. Keep in sync with the media query in globals.css. */
export const FULL_SCREEN_QUERY = "(max-width: 699px) and (orientation: portrait)";

export const isFullScreenEnvelope = (): boolean => window.matchMedia(FULL_SCREEN_QUERY).matches;

/** Element.animate with the defaults used everywhere: keep the end state, smooth in-out easing. */
export function animate(element: Element, keyframes: Keyframe[], options: KeyframeAnimationOptions = {}): Animation {
  return element.animate(keyframes, {
    fill: "forwards",
    easing: "cubic-bezier(.65,0,.25,1)",
    ...options,
  });
}

/** Resolves when the image has loaded, failed, or after `timeout` ms. */
export function preloadImage(src: string, timeout: number): Promise<void> {
  return new Promise((resolve) => {
    const image = new Image();
    let done = false;
    const finish = () => {
      if (!done) {
        done = true;
        resolve();
      }
    };
    image.onload = finish;
    image.onerror = finish;
    image.src = src;
    setTimeout(finish, timeout);
  });
}
