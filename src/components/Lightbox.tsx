"use client";

import { useEffect, useImperativeHandle, useRef, type PointerEvent as ReactPointerEvent, type Ref } from "react";
import type { Messages } from "@/i18n/types";
import type { Photo } from "@/lib/photos";
import { prefersReducedMotion } from "@/lib/motion";
import type { LightboxTarget } from "./types";
import { CloseIcon, NextIcon, PreviousIcon } from "./icons";

export interface LightboxHandle {
  open: (target: LightboxTarget) => void;
}

interface LightboxProps {
  ref?: Ref<LightboxHandle>;
  messages: Messages;
  photos: Photo[];
  /** The element on the page the picture grows out of and shrinks back into. */
  source: (target: LightboxTarget) => HTMLElement | null;
  /** Scrolls the story to a photo while browsing, so closing lands on it. */
  bringIntoView: (index: number) => void;
}

export function Lightbox({ ref, messages, photos, source, bringIntoView }: LightboxProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const polaroidRef = useRef<HTMLElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const captionRef = useRef<HTMLElement>(null);
  const countRef = useRef<HTMLParagraphElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const state = useRef({
    target: null as LightboxTarget | null,
    busy: false,
    lastFocus: null as HTMLElement | null,
    swipeX: null as number | null,
    swipeY: 0,
  });

  const isOpen = () => rootRef.current?.hidden === false;
  const isCard = () => state.current.target?.kind === "card";
  const currentSource = () => (state.current.target ? source(state.current.target) : null);

  function rotationOf(element: HTMLElement): number {
    if (isCard()) {
      return 0;
    }
    const wrap = element.closest(".pol-wrap");
    return wrap ? parseFloat(getComputedStyle(wrap).getPropertyValue("--r")) || 0 : 0;
  }

  /** Puts the current picture in and sizes it to fit the screen. */
  function fill() {
    const target = state.current.target;
    const polaroid = polaroidRef.current;
    const frame = frameRef.current;
    const image = imageRef.current;
    const caption = captionRef.current;
    if (!target || !polaroid || !frame || !image || !caption) {
      return;
    }
    let ratio = 2 / 3;
    if (target.kind === "card") {
      const cardImage = source(target)?.querySelector("img");
      image.src = cardImage?.currentSrc || cardImage?.src || "";
      image.alt = cardImage?.alt ?? "";
      caption.textContent = "";
    } else {
      const photo = photos[target.index];
      const pageImage = source(target)?.querySelector("img");
      image.src = photo.src;
      image.alt = photo.alt;
      caption.textContent = photo.caption;
      ratio = pageImage?.naturalWidth ? pageImage.naturalWidth / pageImage.naturalHeight : 1;
      if (countRef.current) {
        countRef.current.textContent = `${target.index + 1} / ${photos.length}`;
      }
      [target.index - 1, target.index + 1].forEach((neighbour) => {
        if (photos[neighbour]) {
          new Image().src = photos[neighbour].src;
        }
      });
    }
    const phone = window.innerWidth < 600;
    const pad = target.kind === "card" ? 0 : phone ? 10 : 16;
    polaroid.style.padding = target.kind === "card" ? "0" : `${pad}px ${pad}px 0`;
    const captionHeight = target.kind === "card" ? 0 : caption.offsetHeight || 64;
    const maxWidth = Math.min(window.innerWidth * (phone ? 0.94 : 0.86), 1200) - pad * 2;
    const maxHeight = window.innerHeight * (phone ? 0.74 : 0.84) - captionHeight - pad;
    let width = maxWidth;
    let height = width / ratio;
    if (height > maxHeight) {
      height = maxHeight;
      width = height * ratio;
    }
    frame.style.width = `${width}px`;
    frame.style.height = `${height}px`;
    polaroid.style.width = `${width + pad * 2}px`;
  }

  /** FLIP: animates the lightbox from (or back to) the element on the page. */
  function flipFrom(element: HTMLElement, reverse: boolean): Animation {
    const polaroid = polaroidRef.current as HTMLElement;
    const to = polaroid.getBoundingClientRect();
    const from = element.getBoundingClientRect();
    const scale = element.offsetWidth / polaroid.offsetWidth;
    const dx = from.left + from.width / 2 - (to.left + to.width / 2);
    const dy = from.top + from.height / 2 - (to.top + to.height / 2);
    const onScreen = from.bottom > 0 && from.top < window.innerHeight;
    const keyframes: Keyframe[] = [
      {
        transform: onScreen ? `translate(${dx}px,${dy}px) rotate(${rotationOf(element)}deg) scale(${scale})` : "translateY(40px) scale(.9)",
        opacity: onScreen ? 1 : 0,
      },
      {
        transform: "none",
        opacity: 1,
      },
    ];
    return polaroid.animate(reverse ? keyframes.reverse() : keyframes, {
      duration: prefersReducedMotion() ? 1 : reverse ? 480 : 620,
      easing: reverse ? "cubic-bezier(.4,0,.2,1)" : "cubic-bezier(.2,.9,.25,1.05)",
      fill: "both",
    });
  }

  function open(target: LightboxTarget) {
    const root = rootRef.current;
    const element = source(target);
    if (state.current.busy || !root || !element) {
      return;
    }
    state.current.target = target;
    state.current.lastFocus = document.activeElement as HTMLElement | null;
    root.classList.toggle("single", target.kind === "card" || photos.length < 2);
    root.classList.toggle("card-mode", target.kind === "card");
    root.hidden = false;
    document.documentElement.style.overflow = "hidden";
    fill();
    element.style.visibility = "hidden";
    requestAnimationFrame(() => root.classList.add("open"));
    state.current.busy = true;
    flipFrom(element, false).finished.then(() => {
      state.current.busy = false;
    });
    closeRef.current?.focus({ preventScroll: true });
  }

  function close() {
    const root = rootRef.current;
    const element = currentSource();
    if (state.current.busy || !root || root.hidden || !element) {
      return;
    }
    state.current.busy = true;
    root.classList.remove("open");
    flipFrom(element, true).finished.then(() => {
      element.style.visibility = "";
      root.hidden = true;
      document.documentElement.style.overflow = "";
      state.current.busy = false;
      polaroidRef.current?.getAnimations().forEach((animation) => animation.cancel());
      state.current.lastFocus?.focus?.({ preventScroll: true });
    });
  }

  async function step(direction: number) {
    const polaroid = polaroidRef.current;
    const target = state.current.target;
    if (state.current.busy || !polaroid || !target || target.kind === "card" || photos.length < 2) {
      return;
    }
    state.current.busy = true;
    const reduced = prefersReducedMotion();
    await polaroid.animate(
      [
        {
          transform: "none",
          opacity: 1,
        },
        {
          transform: `translateX(${-direction * 70}px) rotate(${-direction * 4}deg)`,
          opacity: 0,
        },
      ],
      {
        duration: reduced ? 1 : 220,
        easing: "ease-in",
        fill: "forwards",
      },
    ).finished;
    const previous = currentSource();
    if (previous) {
      previous.style.visibility = "";
    }
    const index = (target.index + direction + photos.length) % photos.length;
    state.current.target = {
      kind: "photo",
      index,
    };
    bringIntoView(index);
    const next = currentSource();
    if (next) {
      next.style.visibility = "hidden";
    }
    polaroid.getAnimations().forEach((animation) => animation.cancel());
    fill();
    await polaroid.animate(
      [
        {
          transform: `translateX(${direction * 70}px) rotate(${direction * 4}deg)`,
          opacity: 0,
        },
        {
          transform: "none",
          opacity: 1,
        },
      ],
      {
        duration: reduced ? 1 : 360,
        easing: "cubic-bezier(.2,.9,.25,1)",
      },
    ).finished;
    state.current.busy = false;
  }

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const root = rootRef.current;
      if (!root || root.hidden) {
        return;
      }
      if (event.key === "Escape") {
        close();
      } else if (event.key === "ArrowRight") {
        void step(1);
      } else if (event.key === "ArrowLeft") {
        void step(-1);
      } else if (event.key === "Tab") {
        /* keep the focus inside the lightbox */
        const buttons = Array.from(root.querySelectorAll("button")).filter((button) => button.offsetParent !== null);
        const index = buttons.indexOf(document.activeElement as HTMLButtonElement);
        if (event.shiftKey && index <= 0) {
          event.preventDefault();
          buttons[buttons.length - 1]?.focus();
        } else if (!event.shiftKey && index === buttons.length - 1) {
          event.preventDefault();
          buttons[0]?.focus();
        }
      }
    };
    const onResize = () => {
      if (isOpen()) {
        fill();
      }
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onResize);
    };
  });

  useImperativeHandle(ref, () => ({
    open,
  }));

  /* swipe left/right to browse, down to close */
  function onPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    state.current.swipeX = event.clientX;
    state.current.swipeY = event.clientY;
  }

  function onPointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    const startX = state.current.swipeX;
    if (startX == null) {
      return;
    }
    const dx = event.clientX - startX;
    const dy = event.clientY - state.current.swipeY;
    state.current.swipeX = null;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
      void step(dx < 0 ? 1 : -1);
    } else if (dy > 90 && Math.abs(dy) > Math.abs(dx)) {
      close();
    }
  }

  return (
    <div ref={rootRef} className="lb" role="dialog" aria-modal="true" aria-label={messages.photos} hidden onPointerDown={onPointerDown} onPointerUp={onPointerUp}>
      <div className="lb-bg" onClick={close} />
      <figure ref={polaroidRef} className="lb-pol">
        <div ref={frameRef} className="lb-ph">
          <img ref={imageRef} alt="" />
        </div>
        <figcaption ref={captionRef} />
      </figure>
      <button ref={closeRef} className="lb-btn lb-close" type="button" aria-label={messages.close} onClick={close}>
        <CloseIcon />
      </button>
      <button className="lb-btn lb-prev" type="button" aria-label={messages.previous} onClick={() => void step(-1)}>
        <PreviousIcon />
      </button>
      <button className="lb-btn lb-next" type="button" aria-label={messages.next} onClick={() => void step(1)}>
        <NextIcon />
      </button>
      <p ref={countRef} className="lb-count" />
    </div>
  );
}
