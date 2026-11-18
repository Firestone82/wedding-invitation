import type { Photo } from "./photos";
import { signed } from "./motion";

const LEAF_SHADES = ["#6B7A4E", "#56633F", "#7D8C5E", "#4A5636", "#ECDFC3"];

/** Olive leaves bursting out of the cracked seal and drifting down. */
export function burstLeaves(x: number, y: number, random: () => number): void {
  const count = window.innerWidth < 600 ? 14 : 22;
  for (let i = 0; i < count; i++) {
    const leaf = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    leaf.setAttribute("viewBox", "0 0 24 24");
    leaf.setAttribute("class", "leaf");
    const shade = LEAF_SHADES[i % LEAF_SHADES.length];
    leaf.innerHTML =
      `<path d="M12 2C6 8 6 16 12 22C18 16 18 8 12 2Z" fill="${shade}"/>` +
      `<path d="M12 4V21" stroke="${shade === "#ECDFC3" ? "#C7B48A" : "#3E4A2D"}" stroke-width=".8"/>`;
    const size = 12 + random() * 16;
    leaf.style.width = `${size}px`;
    leaf.style.height = `${size}px`;
    document.body.appendChild(leaf);

    const angle = -Math.PI / 2 + signed(random) * 1.5;
    const speed = 90 + random() * 220;
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed;
    const spin = signed(random) * 540;
    const fall = window.innerHeight * (0.45 + random() * 0.4);
    const sway = signed(random) * 80;
    leaf
      .animate(
        [
          {
            transform: `translate(${x}px,${y}px) rotate(0) scale(.3)`,
            opacity: 0,
          },
          {
            transform: `translate(${x + vx}px,${y + vy}px) rotate(${spin * 0.3}deg) scale(1)`,
            opacity: 1,
            offset: 0.22,
          },
          {
            transform: `translate(${x + vx * 1.2 + sway}px,${y + vy * 0.5 + fall * 0.5}px) rotate(${spin * 0.7}deg) scale(1)`,
            opacity: 1,
            offset: 0.6,
          },
          {
            transform: `translate(${x + vx * 1.3 - sway}px,${y + fall}px) rotate(${spin}deg) scale(.9)`,
            opacity: 0,
          },
        ],
        {
          duration: 2600 + random() * 1400,
          easing: "cubic-bezier(.2,.6,.4,1)",
          fill: "forwards",
        },
      )
      .finished.then(() => leaf.remove());
  }
}

/**
 * Photos rising out of the opened envelope and flying towards the viewer.
 * Returns the layer, which the caller removes when the show takes over.
 */
export function flyPhotosOut(
  photos: (Photo | null)[],
  origin: { x: number; y: number },
  gap: number,
  random: () => number,
): HTMLDivElement {
  const layer = document.createElement("div");
  layer.className = "fly-layer";
  layer.style.perspective = "900px";
  layer.style.perspectiveOrigin = `${origin.x}px ${origin.y}px`;
  document.body.appendChild(layer);

  photos.forEach((photo, i) => {
    const card = document.createElement("div");
    card.className = "fly";
    const frame = document.createElement("div");
    frame.className = "ph";
    if (photo) {
      const image = document.createElement("img");
      image.src = photo.src;
      image.alt = "";
      image.style.objectPosition = photo.position;
      frame.appendChild(image);
    }
    const footer = document.createElement("div");
    footer.className = "cap";
    card.append(frame, footer);
    layer.appendChild(card);

    const width = card.offsetWidth;
    const height = card.offsetHeight;
    const x0 = origin.x - width / 2;
    const y0 = origin.y - height / 2;
    const dx = signed(random) * window.innerWidth * 0.28;
    const dy = signed(random) * window.innerHeight * 0.14;
    const turnStart = signed(random) * 8;
    const turnEnd = turnStart + signed(random) * 25;
    card.animate(
      [
        {
          transform: `translate3d(${x0}px,${y0 + height * 0.25}px,0) rotate(${turnStart}deg) scale(.55)`,
          opacity: 0,
          easing: "cubic-bezier(.2,.7,.3,1)",
        },
        {
          transform: `translate3d(${x0 + dx * 0.15}px,${y0 - height * 0.4}px,30px) rotate(${turnStart}deg) scale(.8)`,
          opacity: 1,
          offset: 0.3,
          easing: "cubic-bezier(.55,0,.85,.4)",
        },
        {
          transform: `translate3d(${x0 + dx}px,${y0 - height * 0.2 + dy}px,560px) rotate(${turnEnd}deg) scale(.8)`,
          opacity: 1,
          offset: 0.86,
          easing: "linear",
        },
        {
          transform: `translate3d(${x0 + dx * 1.15}px,${y0 - height * 0.2 + dy * 1.15}px,700px) rotate(${turnEnd}deg) scale(.8)`,
          opacity: 0,
        },
      ],
      {
        duration: 1500,
        delay: i * gap,
        fill: "both",
      },
    );
  });
  return layer;
}
