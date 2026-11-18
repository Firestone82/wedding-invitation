"use client";

import { useEffect, useImperativeHandle, useRef, useState, type Ref } from "react";
import { flushSync } from "react-dom";
import type { Messages } from "@/i18n/types";
import type { Photo } from "@/lib/photos";
import { clamp, preloadImage, seededRandom, signed, sleep } from "@/lib/motion";
import { FADE_LEAD, SCATTER_LEAD } from "@/lib/timeline";

export interface PhotoShowHandle {
  /** Plays the show; resolves when the Save the Date should pop up. */
  play: () => Promise<void>;
  /** Fades the show out and clears it. */
  close: () => void;
}

interface PhotoShowProps {
  ref?: Ref<PhotoShowHandle>;
  photos: Photo[];
  messages: Messages;
  /** Milliseconds each photo stays on top. */
  intervalMs: number;
  /** Second of the song when the Save the Date pops up; 0 = not synced to music. */
  revealAt: number;
  /** Current second of the song, or null when no music is playing. */
  songTime: () => number | null;
  /** Called once the show covers the screen. */
  onCovered: () => void;
}

interface Run {
  skip: boolean;
  next: (() => void) | null;
}

/** Waits until the song reaches `second` (or there is no music, or `maxMs` passes, or the run ends). */
function untilSong(songTime: () => number | null, second: number, maxMs: number, alive: () => boolean): Promise<void> {
  return new Promise((resolve) => {
    const startedAt = performance.now();
    const check = () => {
      const now = songTime();
      if (now == null || now >= second || performance.now() - startedAt > maxMs || !alive()) {
        resolve();
        return;
      }
      requestAnimationFrame(check);
    };
    check();
  });
}

export function PhotoShow({ ref, photos, messages, intervalMs, revealAt, songTime, onCovered }: PhotoShowProps) {
  const [visible, setVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const pileRef = useRef<HTMLDivElement>(null);
  const skipRef = useRef<HTMLButtonElement>(null);
  const runRef = useRef<Run | null>(null);
  const randomRef = useRef(seededRandom(4242));

  function skip() {
    const run = runRef.current;
    if (!run) {
      return;
    }
    run.skip = true;
    run.next?.();
  }

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        skip();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function dropPhoto(photo: Photo, ms: number) {
    const pile = pileRef.current;
    if (!pile) {
      return;
    }
    const random = randomRef.current;
    const card = document.createElement("figure");
    card.className = "spol";
    card.style.setProperty("--dev", `${Math.min(1.3, (ms / 1000) * 0.6).toFixed(2)}s`);
    card.style.setProperty("--tr", `${(signed(random) * 6).toFixed(1)}deg`);
    const tape = document.createElement("span");
    tape.className = "tape";
    tape.setAttribute("aria-hidden", "true");
    const frame = document.createElement("div");
    frame.className = "ph";
    const image = document.createElement("img");
    image.src = photo.src;
    image.alt = photo.alt;
    image.style.objectPosition = photo.position;
    frame.appendChild(image);
    const caption = document.createElement("figcaption");
    caption.textContent = photo.caption;
    card.append(tape, frame, caption);
    pile.appendChild(card);

    const turn = signed(random) * 7;
    const x = signed(random) * 5;
    const y = signed(random) * 3;
    const from = `translate3d(${(signed(random) * 30).toFixed(1)}vw,-125vh,0) rotate(${(turn + signed(random) * 40).toFixed(1)}deg) scale(1.25)`;
    const dropMs = Math.min(950, Math.round(ms * 0.85));
    card.animate(
      [
        { transform: from },
        {
          transform: `translate3d(${x}%,${y + 1.5}%,0) rotate(${turn * 0.8}deg) scale(.985)`,
          offset: 0.72,
        },
        { transform: `translate3d(${x}%,${y}%,0) rotate(${turn}deg) scale(1)` },
      ],
      {
        duration: dropMs,
        easing: "cubic-bezier(.2,.75,.25,1)",
        fill: "forwards",
      },
    );
    setTimeout(() => card.classList.add("dev"), Math.min(300, ms * 0.15));
    setTimeout(
      () =>
        pile.animate([{ transform: "scale(1)" }, { transform: "scale(.985)" }, { transform: "scale(1)" }], {
          duration: 320,
          easing: "ease-out",
        }),
      dropMs * 0.67,
    );
    if (pile.children.length > 5) {
      const oldest = pile.children[0];
      oldest.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 400, fill: "forwards" }).finished.then(() => oldest.remove());
    }
  }

  async function play(): Promise<void> {
    const run: Run = {
      skip: false,
      next: null,
    };
    runRef.current = run;
    const alive = () => runRef.current === run;
    flushSync(() => setVisible(true));
    const section = sectionRef.current;
    const bar = barRef.current;
    const pile = pileRef.current;
    if (!section || !bar || !pile) {
      return;
    }
    pile.replaceChildren();
    section.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 450, fill: "both" });
    await sleep(450);
    onCovered();

    const segments = Array.from(bar.querySelectorAll("b"));
    for (let i = 0; i < photos.length && !run.skip; i++) {
      await preloadImage(photos[i].src, 3000);
      if (run.skip || !alive()) {
        break;
      }
      /* with music: spread the photos so the Save the Date lands exactly on `revealAt` */
      let ms = intervalMs;
      const now = songTime();
      if (revealAt && now != null) {
        ms = clamp(((revealAt - SCATTER_LEAD - now) / (photos.length - i)) * 1000, intervalMs * 0.8, intervalMs * 1.2);
      }
      const progress = segments[i].animate([{ transform: "scaleX(0)" }, { transform: "scaleX(1)" }], {
        duration: ms,
        fill: "forwards",
      });
      dropPhoto(photos[i], ms);
      await new Promise<void>((resolve) => {
        const timer = setTimeout(resolve, ms);
        run.next = () => {
          clearTimeout(timer);
          resolve();
        };
      });
      run.next = null;
      progress.finish();
    }
    if (!alive()) {
      return;
    }

    /* finale: the pile scatters, then the Save the Date pops up on the beat */
    if (!run.skip && revealAt) {
      await untilSong(songTime, revealAt - SCATTER_LEAD, 8000, alive);
    }
    if (!alive()) {
      return;
    }
    const random = randomRef.current;
    Array.from(pile.children).forEach((card, k) => {
      const angle = random() * Math.PI * 2;
      const current = getComputedStyle(card).transform;
      card.getAnimations().forEach((animation) => animation.cancel());
      card.animate(
        [
          { transform: current },
          {
            transform: `translate3d(${(Math.cos(angle) * 130).toFixed(0)}vw,${(Math.sin(angle) * 130).toFixed(0)}vh,0) rotate(${(signed(random) * 120).toFixed(0)}deg)`,
          },
        ],
        {
          duration: 900,
          delay: k * 70,
          easing: "cubic-bezier(.5,0,.75,0)",
          fill: "forwards",
        },
      );
    });
    bar.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 500, fill: "forwards" });
    skipRef.current?.animate([{ opacity: 0.7 }, { opacity: 0 }], { duration: 400, fill: "forwards" });
    if (!run.skip && revealAt && songTime() != null) {
      await untilSong(songTime, revealAt - FADE_LEAD, 3000, alive);
    } else {
      await sleep(run.skip ? 500 : (SCATTER_LEAD - FADE_LEAD) * 1000);
    }
  }

  function close() {
    runRef.current = null;
    const section = sectionRef.current;
    if (!section || !visible) {
      return;
    }
    section.animate([{ opacity: 1 }, { opacity: 0 }], { duration: FADE_LEAD * 1000, fill: "forwards" }).finished.then(() => {
      [section, barRef.current, skipRef.current].forEach((element) => element?.getAnimations().forEach((animation) => animation.cancel()));
      pileRef.current?.replaceChildren();
      setVisible(false);
    });
  }

  useImperativeHandle(ref, () => ({
    play,
    close,
  }));

  return (
    <section ref={sectionRef} className="show" aria-label={messages.photos} hidden={!visible}>
      <div ref={barRef} className="show-bar" aria-hidden="true">
        {photos.map((photo, i) => (
          <i key={i}>
            <b />
          </i>
        ))}
      </div>
      <button ref={skipRef} className="show-skip" type="button" onClick={skip}>
        {messages.skip}
      </button>
      <div ref={pileRef} className="show-pile" aria-live="polite" />
    </section>
  );
}
