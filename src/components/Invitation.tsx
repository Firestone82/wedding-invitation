"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { MusicPlayer } from "@/lib/music";
import { isFullScreenEnvelope, prefersReducedMotion } from "@/lib/motion";
import { photoIntervalMs, plannedRevealDelay } from "@/lib/timeline";
import { Envelope } from "./Envelope";
import { InviteSection, type InviteSectionHandle } from "./InviteSection";
import { Lightbox, type LightboxHandle } from "./Lightbox";
import { MusicToggle } from "./MusicToggle";
import { PhotoShow, type PhotoShowHandle } from "./PhotoShow";
import { PhotoStory, type PhotoStoryHandle } from "./PhotoStory";
import type { InvitationData, LightboxTarget } from "./types";

interface MusicState {
  started: boolean;
  on: boolean;
}

type DebugWindow = Window & {
  __songTime?: () => number | null;
  __audio?: () => HTMLAudioElement | null;
  __plan?: () => number;
};

/**
 * The whole invitation: envelope → photos flying out → photo show → Save the Date,
 * with the scrollable photo story above the Save the Date.
 *
 * Address extras: `?pro=Name` greets the guest, `?open` skips the envelope, `?debug` exposes timing helpers.
 */
export function Invitation({ data }: { data: InvitationData }) {
  const { messages, photos, music, show } = data;
  const intervalMs = photoIntervalMs(show.photoInterval);

  const [introVisible, setIntroVisible] = useState(true);
  const [pageVisible, setPageVisible] = useState(false);
  const [greeting, setGreeting] = useState("");
  const [musicState, setMusicState] = useState<MusicState>({
    started: false,
    on: true,
  });

  const playerRef = useRef<MusicPlayer | null>(null);
  const showRef = useRef<PhotoShowHandle>(null);
  const storyRef = useRef<PhotoStoryHandle>(null);
  const inviteRef = useRef<InviteSectionHandle>(null);
  const lightboxRef = useRef<LightboxHandle>(null);

  const songTime = useCallback(() => playerRef.current?.songTime() ?? null, []);

  const revealDelay = useCallback(
    () => plannedRevealDelay(photos.length, show.flyCount, intervalMs, isFullScreenEnvelope()),
    [photos.length, show.flyCount, intervalMs],
  );

  useEffect(() => {
    if ("scrollRestoration" in history) {
      history.scrollRestoration = "manual";
    }
    window.scrollTo(0, 0);

    const player = new MusicPlayer(music.src, music.volume, () =>
      setMusicState({
        started: player.started && player.available,
        on: player.on,
      }),
    );
    playerRef.current = player;

    const query = new URLSearchParams(window.location.search);
    const name = query.get("pro");
    if (name) {
      setGreeting(name.slice(0, 60));
    }
    if (query.has("debug")) {
      const debug = window as DebugWindow;
      debug.__songTime = () => player.songTime();
      debug.__audio = () => player.element;
      debug.__plan = revealDelay;
    }
    if (query.has("open")) {
      setIntroVisible(false);
      showPage(true);
    }
    return () => player.dispose();
  }, []);

  function showPage(toTop: boolean) {
    document.documentElement.classList.remove("locked");
    flushSync(() => setPageVisible(true));
    if (toTop) {
      window.scrollTo(0, 0);
    }
    storyRef.current?.measure();
  }

  function toInvite() {
    showPage(false);
    inviteRef.current?.reveal();
    storyRef.current?.measure();
    showRef.current?.close();
  }

  function startMusic() {
    const player = playerRef.current;
    if (!player) {
      return;
    }
    const startAt = music.start === "auto" ? (music.revealAt ? Math.max(0, music.revealAt - revealDelay()) : 0) : music.start;
    player.start(startAt);
  }

  async function onEnvelopeOpened() {
    if (prefersReducedMotion() || photos.length === 0) {
      setIntroVisible(false);
      toInvite();
      return;
    }
    await showRef.current?.play();
    toInvite();
  }

  const lightboxSource = useCallback((target: LightboxTarget): HTMLElement | null => {
    return target.kind === "card" ? (inviteRef.current?.card() ?? null) : (storyRef.current?.polaroid(target.index) ?? null);
  }, []);

  return (
    <>
      {introVisible && (
        <Envelope
          monogram={data.monogram}
          messages={messages}
          otherLanguages={data.otherLanguages}
          photos={photos}
          flyCount={show.flyCount}
          greeting={greeting}
          onTap={startMusic}
          onOpened={() => void onEnvelopeOpened()}
        />
      )}

      <main className={pageVisible ? "page shown" : "page"} aria-hidden={!pageVisible}>
        <PhotoStory
          ref={storyRef}
          names={data.names}
          messages={messages}
          photos={photos}
          active={pageVisible}
          onOpenPhoto={(index) =>
            lightboxRef.current?.open({
              kind: "photo",
              index,
            })
          }
        />
        <InviteSection
          ref={inviteRef}
          messages={messages}
          monogram={data.monogram}
          image={data.inviteImage}
          place={data.place}
          mapUrl={data.mapUrl}
          googleCalendarUrl={data.googleCalendarUrl}
          calendarEvent={data.calendarEvent}
          calendarFileName={data.calendarFileName}
          active={pageVisible}
          onEnlarge={() =>
            lightboxRef.current?.open({
              kind: "card",
            })
          }
        />
      </main>

      <PhotoShow
        ref={showRef}
        photos={photos}
        messages={messages}
        intervalMs={intervalMs}
        revealAt={music.revealAt}
        songTime={songTime}
        onCovered={() => setIntroVisible(false)}
      />

      {musicState.started && <MusicToggle on={musicState.on} messages={messages} onToggle={() => playerRef.current?.toggle()} />}

      <Lightbox
        ref={lightboxRef}
        messages={messages}
        photos={photos}
        source={lightboxSource}
        bringIntoView={(index) => storyRef.current?.bringIntoView(index)}
      />
    </>
  );
}
