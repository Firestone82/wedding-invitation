"use client";

import { useEffect, useImperativeHandle, useMemo, useRef, type CSSProperties, type PointerEvent, type Ref } from "react";
import type { Messages } from "@/i18n/types";
import type { Photo } from "@/lib/photos";
import { clamp, hasFinePointer, prefersReducedMotion, seededRandom, signed } from "@/lib/motion";
import { ChevronDownIcon } from "./icons";

export interface PhotoStoryHandle {
  /** The polaroid button of a photo, for the lightbox to grow out of. */
  polaroid: (index: number) => HTMLButtonElement | null;
  /** Scrolls a photo into the middle of the screen and shows it right away. */
  bringIntoView: (index: number) => void;
  /** Re-measures positions after the layout changed. */
  measure: () => void;
}

interface PhotoStoryProps {
  ref?: Ref<PhotoStoryHandle>;
  names: string;
  messages: Messages;
  photos: Photo[];
  /** The page is visible; runs the parallax and the progress dots. */
  active: boolean;
  onOpenPhoto: (index: number) => void;
}

/** Fixed "random" tilt of each polaroid and its tape. */
function layoutFor(count: number) {
  const random = seededRandom(1907);
  return Array.from({ length: count }, (_, i) => {
    const turn = signed(random) * 5.5;
    return {
      "--r": `${turn.toFixed(2)}deg`,
      "--r0": `${(turn + (i % 2 ? 14 : -14)).toFixed(1)}deg`,
      "--dxm": i % 2 ? "4vw" : "-4vw",
      "--tr": `${(signed(random) * 6).toFixed(1)}deg`,
      "--tpx": `${(signed(random) * 30).toFixed(0)}px`,
    } as CSSProperties;
  });
}

export function PhotoStory({ ref, names, messages, photos, active, onOpenPhoto }: PhotoStoryProps) {
  const layout = useMemo(() => layoutFor(photos.length), [photos.length]);
  const storyRef = useRef<HTMLElement>(null);
  const threadRef = useRef<HTMLElement>(null);
  const countRef = useRef<HTMLSpanElement>(null);
  const hintRef = useRef<HTMLDivElement>(null);
  const wrapRefs = useRef<(HTMLDivElement | null)[]>([]);
  const polaroidRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const dotRefs = useRef<(HTMLButtonElement | null)[]>([]);
  /** Page-space centre of each polaroid without parallax, and its parallax strength. */
  const centres = useRef<number[]>([]);
  const dirty = useRef(true);

  function measure() {
    const scrollY = window.scrollY;
    centres.current = wrapRefs.current.map((wrap) => {
      if (!wrap) {
        return 0;
      }
      const box = wrap.getBoundingClientRect();
      const shift = parseFloat(wrap.style.getPropertyValue("--py")) || 0;
      return box.top + scrollY - shift + box.height / 2;
    });
    dirty.current = true;
  }

  function markLoaded(index: number) {
    wrapRefs.current[index]?.classList.add("loaded");
  }

  /* polaroids drop in as they scroll into view; photos loaded before hydration count as loaded */
  useEffect(() => {
    polaroidRefs.current.forEach((button, i) => {
      const image = button?.querySelector("img");
      if (image?.complete && image.naturalWidth > 0) {
        markLoaded(i);
      }
    });
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            observer.unobserve(entry.target);
          }
        }),
      {
        rootMargin: "0px 0px -10% 0px",
        threshold: 0.18,
      },
    );
    wrapRefs.current.forEach((wrap) => wrap && observer.observe(wrap));
    const thread = threadRef.current;
    if (thread) {
      thread.style.gap = `${clamp(Math.floor((window.innerHeight * 0.55) / Math.max(photos.length, 1)) - 9, 6, 16)}px`;
    }
    const onResize = () => measure();
    const onScroll = () => {
      dirty.current = true;
    };
    window.addEventListener("resize", onResize, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    void document.fonts?.ready.then(measure);
    measure();
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onScroll);
    };
  }, [photos.length]);

  /* parallax, the progress dots and the scroll hint */
  useEffect(() => {
    if (!active) {
      return;
    }
    measure();
    const reduced = prefersReducedMotion();
    let frame = 0;
    const loop = () => {
      if (dirty.current) {
        dirty.current = false;
        const viewCentre = window.scrollY + window.innerHeight / 2;
        let current = -1;
        let closest = Infinity;
        wrapRefs.current.forEach((wrap, i) => {
          if (!wrap) {
            return;
          }
          const offset = centres.current[i] - viewCentre;
          if (!reduced) {
            const strength = i % 2 ? 0.06 : 0.11;
            wrap.style.setProperty("--py", `${clamp(-offset * strength, -90, 90).toFixed(1)}px`);
          }
          if (Math.abs(offset) < closest) {
            closest = Math.abs(offset);
            current = i;
          }
        });
        const story = storyRef.current?.getBoundingClientRect();
        const thread = threadRef.current;
        if (story && thread) {
          thread.classList.toggle("on", photos.length > 1 && story.top < window.innerHeight * 0.5 && story.bottom > window.innerHeight * 0.55);
        }
        dotRefs.current.forEach((dot, i) => {
          dot?.classList.toggle("cur", i === current);
          dot?.classList.toggle("done", i < current);
        });
        const dot = dotRefs.current[current];
        const count = countRef.current;
        if (dot && count) {
          count.textContent = `${current + 1} / ${photos.length}`;
          count.style.setProperty("--cy", `${dot.offsetTop + dot.offsetHeight / 2}px`);
        }
        hintRef.current?.classList.toggle("on", window.scrollY < 60 && photos.length > 0);
      }
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [active, photos.length]);

  useImperativeHandle(ref, () => ({
    polaroid: (index) => polaroidRefs.current[index] ?? null,
    bringIntoView: (index) => {
      const wrap = wrapRefs.current[index];
      if (!wrap) {
        return;
      }
      wrap.scrollIntoView({ block: "center" });
      wrap.classList.add("in", "loaded");
      measure();
    },
    measure,
  }));

  function tiltTowards(event: PointerEvent<HTMLButtonElement>) {
    if (!hasFinePointer()) {
      return;
    }
    const button = event.currentTarget;
    const box = button.getBoundingClientRect();
    button.style.setProperty("--tx", `${(((event.clientX - box.left) / box.width - 0.5) * 14).toFixed(2)}deg`);
    button.style.setProperty("--ty", `${(-((event.clientY - box.top) / box.height - 0.5) * 14).toFixed(2)}deg`);
  }

  function untilt(event: PointerEvent<HTMLButtonElement>) {
    event.currentTarget.style.removeProperty("--tx");
    event.currentTarget.style.removeProperty("--ty");
  }

  return (
    <>
      <section ref={storyRef} className="story">
        <header className="story-head">
          <p className="kicker">{messages.ourStory}</p>
          <h2 className="script">{names}</h2>
        </header>
        <div className="pols">
          {photos.map((photo, i) => (
            <div
              key={i}
              ref={(element) => {
                wrapRefs.current[i] = element;
              }}
              className="pol-wrap"
              style={layout[i]}
            >
              <div className="pol-anim">
                <button
                  ref={(element) => {
                    polaroidRefs.current[i] = element;
                  }}
                  className="pol"
                  type="button"
                  aria-label={`${messages.enlargePhoto}: ${photo.caption || `${messages.photo} ${i + 1}`}`}
                  onClick={() => onOpenPhoto(i)}
                  onPointerMove={tiltTowards}
                  onPointerLeave={untilt}
                >
                  <span className="tape" aria-hidden="true" />
                  <span className="ph">
                    <img
                      src={photo.src}
                      alt={photo.alt}
                      style={{ objectPosition: photo.position }}
                      loading={i < 3 ? "eager" : "lazy"}
                      decoding="async"
                      onLoad={() => markLoaded(i)}
                      onError={() => markLoaded(i)}
                    />
                  </span>
                  <span className="cap">{photo.caption}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div ref={hintRef} className="scroll-hint" aria-hidden="true">
        <span>{messages.scrollDown}</span>
        <ChevronDownIcon />
      </div>

      <nav ref={threadRef} className="thread" aria-label={messages.photos}>
        {photos.map((photo, i) => (
          <button
            key={i}
            ref={(element) => {
              dotRefs.current[i] = element;
            }}
            type="button"
            aria-label={`${messages.photo} ${i + 1}`}
            onClick={() =>
              wrapRefs.current[i]?.scrollIntoView({
                behavior: prefersReducedMotion() ? "auto" : "smooth",
                block: "center",
              })
            }
          />
        ))}
        <span ref={countRef} className="count" />
      </nav>
    </>
  );
}
