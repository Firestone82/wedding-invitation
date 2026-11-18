import { clamp, hasFinePointer } from "./motion";

/** Where the guest is pointing: mouse position or phone tilt, as -1…1 from the centre of the screen. */
export const pointer = {
  /** Target in -1…1; animation loops ease towards it. */
  x: 0,
  y: 0,
  /** Last pointer position in pixels. */
  clientX: 0,
  clientY: 0,
};

let lastMove = 0;
let installed = false;

/** Starts listening to the mouse and to the phone's tilt sensor. Safe to call many times. */
export function trackPointer(): void {
  if (installed) {
    return;
  }
  installed = true;
  pointer.clientX = window.innerWidth / 2;
  pointer.clientY = window.innerHeight / 2;

  window.addEventListener(
    "pointermove",
    (event) => {
      pointer.clientX = event.clientX;
      pointer.clientY = event.clientY;
      lastMove = performance.now();
      pointer.x = clamp((event.clientX / window.innerWidth) * 2 - 1, -1, 1);
      pointer.y = clamp((event.clientY / window.innerHeight) * 2 - 1, -1, 1);
    },
    { passive: true },
  );

  if (!hasFinePointer()) {
    window.addEventListener(
      "deviceorientation",
      (event) => {
        if (event.gamma == null || event.beta == null || performance.now() - lastMove < 1500) {
          return;
        }
        pointer.x = clamp(event.gamma / 25, -1, 1);
        pointer.y = clamp((event.beta - 45) / 25, -1, 1);
      },
      { passive: true },
    );
  }
}
