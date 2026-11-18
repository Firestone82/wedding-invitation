"use client";

import { useEffect, useImperativeHandle, useRef, type Ref } from "react";
import type { Messages } from "@/i18n/types";
import { downloadIcs, type CalendarEvent } from "@/lib/calendar";
import { clamp, hasFinePointer, prefersReducedMotion } from "@/lib/motion";
import { pointer, trackPointer } from "@/lib/pointer";
import { CalendarIcon, DownloadIcon, PhotosIcon, PinIcon } from "./icons";
import { Seal } from "./Seal";

export interface InviteSectionHandle {
  /** Sizes the card so card and buttons fit the visible screen. */
  fit: () => void;
  /** Scrolls to the invitation and plays its flip-in. */
  reveal: () => void;
  /** The card's front, for the lightbox to grow out of. */
  card: () => HTMLButtonElement | null;
}

interface InviteSectionProps {
  ref?: Ref<InviteSectionHandle>;
  messages: Messages;
  monogram: string;
  image: string;
  place: string;
  mapUrl: string;
  googleCalendarUrl: string;
  calendarEvent: CalendarEvent;
  calendarFileName: string;
  /** The page is visible; runs the card's tilt. */
  active: boolean;
  onEnlarge: () => void;
}

export function InviteSection({
  ref,
  messages,
  monogram,
  image,
  place,
  mapUrl,
  googleCalendarUrl,
  calendarEvent,
  calendarFileName,
  active,
  onEnlarge,
}: InviteSectionProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const actionsRef = useRef<HTMLDivElement>(null);
  const tiltRef = useRef<HTMLDivElement>(null);
  const frontRef = useRef<HTMLButtonElement>(null);

  function fit() {
    const section = sectionRef.current;
    const actions = actionsRef.current;
    if (!section || !actions) {
      return;
    }
    const viewport = window.visualViewport;
    const height = viewport ? viewport.height : window.innerHeight;
    const width = Math.min(window.innerWidth, viewport ? viewport.width : window.innerWidth);
    actions.style.maxWidth = `${Math.min(560, width - 20)}px`;
    const gap = 16;
    const padTop = 10;
    const padBottom = 16;
    const room = height - actions.offsetHeight - gap - padTop - padBottom;
    const cardWidth = Math.max(160, Math.min(width - 20, room / 1.5, 760));
    section.style.setProperty("--cardw", `${cardWidth.toFixed(1)}px`);
    /* centre card and buttons in the part of the screen the guest actually sees */
    const content = cardWidth * 1.5 + gap + actions.offsetHeight;
    section.style.paddingTop = `${Math.max(padTop, (height - content) / 2).toFixed(1)}px`;
    section.style.minHeight = `${Math.max(window.innerHeight, height)}px`;
  }

  function scrollToSection() {
    const section = sectionRef.current;
    if (section) {
      window.scrollTo(0, section.getBoundingClientRect().top + window.scrollY);
    }
  }

  useEffect(() => {
    fit();
    window.addEventListener("resize", fit, { passive: true });
    window.visualViewport?.addEventListener("resize", fit, { passive: true });
    return () => {
      window.removeEventListener("resize", fit);
      window.visualViewport?.removeEventListener("resize", fit);
    };
  }, []);

  /* the card leans towards the cursor; on touch screens it sways gently */
  useEffect(() => {
    if (!active || prefersReducedMotion()) {
      return;
    }
    trackPointer();
    const fine = hasFinePointer();
    let x = 0;
    let y = 0;
    let screenX = 0;
    let screenY = 0;
    let frame = 0;
    const loop = (time: number) => {
      const section = sectionRef.current;
      const tilt = tiltRef.current;
      const front = frontRef.current;
      if (section && tilt && front) {
        const box = section.getBoundingClientRect();
        screenX += (pointer.x - screenX) * 0.07;
        screenY += (pointer.y - screenY) * 0.07;
        if (box.top < window.innerHeight && box.bottom > 0) {
          let gx: number;
          let gy: number;
          if (fine) {
            const card = tilt.getBoundingClientRect();
            gx = clamp((pointer.clientX - (card.left + card.width / 2)) / (card.width * 0.9), -1, 1);
            gy = clamp((pointer.clientY - (card.top + card.height / 2)) / (card.height * 0.9), -1, 1);
          } else {
            gx = Math.sin(time / 1900) * 0.35 + screenX * 0.6;
            gy = Math.cos(time / 2400) * 0.3 + screenY * 0.4;
          }
          x += (gx * 11 - x) * 0.08;
          y += (-gy * 9 - y) * 0.08;
          tilt.style.transform = `rotateY(${x.toFixed(2)}deg) rotateX(${y.toFixed(2)}deg)`;
          front.style.setProperty("--gx", `${(50 + x * 4).toFixed(1)}%`);
          front.style.setProperty("--gy", `${(30 - y * 4).toFixed(1)}%`);
        }
      }
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [active]);

  useImperativeHandle(ref, () => ({
    fit,
    reveal: () => {
      fit();
      scrollToSection();
      requestAnimationFrame(() => {
        fit();
        scrollToSection();
      });
      sectionRef.current?.classList.add("in");
    },
    card: () => frontRef.current,
  }));

  return (
    <section ref={sectionRef} className="invite">
      <div className="card-scene">
        <div ref={tiltRef} className="card-tilt">
          <div className="card-flip">
            <button ref={frontRef} className="card-face card-front" type="button" aria-label={messages.enlargeInvitation} onClick={onEnlarge}>
              <img src={image} width={1024} height={1536} alt={messages.invitationAlt} />
              <span className="card-glare" aria-hidden="true" />
              <span className="card-shine" aria-hidden="true" />
            </button>
            <div className="card-face card-back" aria-hidden="true">
              <div className="card-seal">
                <Seal monogram={monogram} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div ref={actionsRef} className="invite-actions">
        {place && <p className="place">{place}</p>}
        <div className="btns">
          <a className="btn primary" href={googleCalendarUrl} target="_blank" rel="noopener">
            <CalendarIcon />
            <span>{messages.googleCalendar}</span>
          </a>
          <button className="btn" type="button" onClick={() => downloadIcs(calendarEvent, calendarFileName)}>
            <DownloadIcon />
            <span>{messages.appleOutlook}</span>
          </button>
          {mapUrl && (
            <a className="btn" href={mapUrl} target="_blank" rel="noopener">
              <PinIcon />
              <span>{messages.map}</span>
            </a>
          )}
          <button
            className="btn wide"
            type="button"
            onClick={() =>
              window.scrollTo({
                top: 0,
                behavior: prefersReducedMotion() ? "auto" : "smooth",
              })
            }
          >
            <PhotosIcon />
            <span>{messages.viewPhotosAgain}</span>
          </button>
        </div>
      </div>
    </section>
  );
}
