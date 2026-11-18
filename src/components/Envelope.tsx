"use client";

import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import type { Messages } from "@/i18n/types";
import type { Photo } from "@/lib/photos";
import { burstLeaves, flyPhotosOut } from "@/lib/effects";
import { FULL_SCREEN_QUERY, animate, prefersReducedMotion, seededRandom, signed, sleep } from "@/lib/motion";
import { pointer, trackPointer } from "@/lib/pointer";
import { flyPlan } from "@/lib/timeline";
import { useMediaQuery } from "@/lib/useMediaQuery";
import { TapIcon } from "./icons";
import { LanguageSwitch } from "./LanguageSwitch";
import { Seal } from "./Seal";
import type { LanguageLink } from "./types";

interface EnvelopeProps {
  monogram: string;
  messages: Messages;
  otherLanguages: LanguageLink[];
  photos: Photo[];
  flyCount: number;
  /** Personal greeting under the heading (from `?pro=`), or "". */
  greeting: string;
  /** Called right inside the tap on the seal, where browsers still allow starting music. */
  onTap: () => void;
  /** Called when the envelope has opened and slid away. */
  onOpened: () => void;
}

interface DustParticle {
  left: string;
  top: string;
  size: string;
  duration: string;
  depth: string;
  delay: string;
}

const pocketGradients = (
  <defs>
    <linearGradient id="pocket-left" x1="0" x2="1">
      <stop offset="0" stopColor="#4D5A39" />
      <stop offset="1" stopColor="#5A6843" />
    </linearGradient>
    <linearGradient id="pocket-right" x1="1" x2="0">
      <stop offset="0" stopColor="#4A5636" />
      <stop offset="1" stopColor="#576541" />
    </linearGradient>
    <linearGradient id="pocket-bottom" x1="0" y1="1" x2="0" y2="0">
      <stop offset="0" stopColor="#53613C" />
      <stop offset="1" stopColor="#64734C" />
    </linearGradient>
  </defs>
);

/** The front of the envelope below the flap: two side folds and the bottom fold. */
function Pocket({ fullScreen }: { fullScreen: boolean }) {
  const line = {
    fill: "none",
    vectorEffect: "non-scaling-stroke",
  } as const;
  if (fullScreen) {
    return (
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        {pocketGradients}
        <path d="M0,0 L52,54 L0,100Z" fill="url(#pocket-left)" />
        <path d="M100,0 L48,54 L100,100Z" fill="url(#pocket-right)" />
        <path d="M0,100 L50,47 L100,100Z" fill="url(#pocket-bottom)" />
        <path d="M0,100 L50,47 L100,100" {...line} stroke="#3E4A2D" strokeWidth="1.2" opacity=".8" />
        <path d="M0,100.6 L50,47.6 L100,100.6" {...line} stroke="#7D8C5E" strokeWidth="1" opacity=".55" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 100 68" preserveAspectRatio="none" aria-hidden="true">
      {pocketGradients}
      <path d="M0,1 Q0,0 1,0 L53,37 L1,68 Q0,68 0,67Z" fill="url(#pocket-left)" />
      <path d="M100,1 Q100,0 99,0 L47,37 L99,68 Q100,68 100,67Z" fill="url(#pocket-right)" />
      <path d="M0,67 L50,31 L100,67 Q100,68 99,68 L1,68 Q0,68 0,67Z" fill="url(#pocket-bottom)" />
      <path d="M0.5,67.5 L50,31 L99.5,67.5" {...line} stroke="#3E4A2D" strokeWidth="1.2" opacity=".8" />
      <path d="M0,67.6 L50,31.6 L100,67.6" {...line} stroke="#7D8C5E" strokeWidth="1" opacity=".55" />
    </svg>
  );
}

export function Envelope({ monogram, messages, otherLanguages, photos, flyCount, greeting, onTap, onOpened }: EnvelopeProps) {
  const fullScreen = useMediaQuery(FULL_SCREEN_QUERY);
  const [opened, setOpened] = useState(false);
  const [dust, setDust] = useState<DustParticle[]>([]);

  const fullScreenRef = useRef(fullScreen);
  const openingRef = useRef(false);
  const randomRef = useRef(seededRandom(1907));
  const introRef = useRef<HTMLElement>(null);
  const headRef = useRef<HTMLElement>(null);
  const hintRef = useRef<HTMLParagraphElement>(null);
  const dustRef = useRef<HTMLDivElement>(null);
  const tiltRef = useRef<HTMLDivElement>(null);
  const envRef = useRef<HTMLDivElement>(null);
  const flapRef = useRef<HTMLDivElement>(null);
  const flapShadowRef = useRef<HTMLDivElement>(null);
  const sealRef = useRef<HTMLDivElement>(null);
  const halfLeftRef = useRef<HTMLDivElement>(null);
  const halfRightRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fullScreenRef.current = fullScreen;
  }, [fullScreen]);

  /* floating specks of light */
  useEffect(() => {
    const random = seededRandom(77);
    const count = window.innerWidth < 600 ? 12 : 22;
    setDust(
      Array.from({ length: count }, () => ({
        left: `${random() * 100}%`,
        top: `${random() * 100}%`,
        size: `${(2 + random() * 4).toFixed(1)}px`,
        duration: `${(4 + random() * 6).toFixed(1)}s`,
        depth: (0.3 + random() * 1.4).toFixed(2),
        delay: `-${(random() * 6).toFixed(1)}s`,
      })),
    );
  }, []);

  /* the envelope follows the cursor or the tilt of the phone */
  useEffect(() => {
    trackPointer();
    let x = 0;
    let y = 0;
    let frame = 0;
    const loop = () => {
      x += (pointer.x - x) * 0.07;
      y += (pointer.y - y) * 0.07;
      const tilt = tiltRef.current;
      const env = envRef.current;
      const dustLayer = dustRef.current;
      if (tilt && env && dustLayer) {
        tilt.style.transform = fullScreenRef.current
          ? `scale(1.1) rotateX(${(-y * 5).toFixed(2)}deg) rotateY(${(x * 7).toFixed(2)}deg)`
          : `rotateX(${(12 - y * 13).toFixed(2)}deg) rotateY(${(-6 + x * 20).toFixed(2)}deg)`;
        env.style.setProperty("--gx", `${(50 - x * 45).toFixed(1)}%`);
        env.style.setProperty("--gy", `${(25 - y * 35).toFixed(1)}%`);
        dustLayer.style.setProperty("--mx", `${(-x * 24).toFixed(1)}px`);
        dustLayer.style.setProperty("--my", `${(-y * 16).toFixed(1)}px`);
      }
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, []);

  async function open() {
    const intro = introRef.current;
    const env = envRef.current;
    const seal = sealRef.current;
    const flap = flapRef.current;
    const flapShadow = flapShadowRef.current;
    const head = headRef.current;
    const halves = [halfLeftRef.current, halfRightRef.current];
    if (openingRef.current || !intro || !env || !seal || !flap || !flapShadow || !head || !halves[0] || !halves[1]) {
      return;
    }
    openingRef.current = true;
    onTap();
    setOpened(true);
    if (hintRef.current) {
      hintRef.current.style.opacity = "0";
    }

    if (prefersReducedMotion()) {
      await animate(intro, [{ opacity: 1 }, { opacity: 0 }], { duration: 400 }).finished;
      onOpened();
      return;
    }

    const random = randomRef.current;
    const fullScreenNow = fullScreenRef.current;
    const width = env.offsetWidth;
    const height = env.offsetHeight;

    /* 1 — press the seal */
    await animate(seal, [{ transform: "translateZ(7px) scale(1)" }, { transform: "translateZ(3px) scale(.88)" }], {
      duration: 170,
      easing: "ease-out",
    }).finished;

    /* 2 — it cracks into two halves that fall away, with crumbs of wax and a burst of leaves */
    seal.style.visibility = "hidden";
    halves.forEach((half, i) => {
      if (!half) {
        return;
      }
      const direction = i === 0 ? -1 : 1;
      half.style.visibility = "visible";
      animate(
        half,
        [
          {
            transform: "translateZ(7px) translate(0,0) rotate(0)",
            opacity: 1,
          },
          {
            transform: `translateZ(30px) translate(${direction * width * 0.06}px,${-height * 0.05}px) rotate(${direction * 16}deg)`,
            opacity: 1,
            offset: 0.22,
          },
          {
            transform: `translateZ(40px) translate(${direction * width * 0.18}px,${height * (fullScreenNow ? 0.7 : 1.4)}px) rotate(${direction * 110}deg)`,
            opacity: 0,
          },
        ],
        {
          duration: 1300,
          easing: "cubic-bezier(.35,0,.75,.6)",
        },
      );
    });
    for (let i = 0; i < 9; i++) {
      const crumb = document.createElement("div");
      crumb.className = "crumb";
      crumb.style.left = `${48 + (random() * 6 - 3)}%`;
      crumb.style.top = fullScreenNow ? "50%" : "62%";
      env.appendChild(crumb);
      const fall = height * (fullScreenNow ? 0.3 + random() * 0.3 : 0.6 + random() * 0.7);
      animate(
        crumb,
        [
          {
            transform: "translateZ(8px) translate(0,0)",
            opacity: 1,
          },
          {
            transform: `translateZ(20px) translate(${signed(random) * width * 0.25}px,${fall}px) rotate(${random() * 360}deg)`,
            opacity: 0,
          },
        ],
        {
          duration: 900 + random() * 600,
          easing: "cubic-bezier(.3,0,.8,.5)",
        },
      );
    }
    const sealBox = seal.getBoundingClientRect();
    burstLeaves(sealBox.left + sealBox.width / 2, sealBox.top + sealBox.height / 2, random);

    /* 3 — the flap swings open */
    await sleep(140);
    animate(flapShadow, [{ opacity: 1 }, { opacity: 0 }], { duration: 350 });
    animate(
      flap,
      [
        { transform: "translateZ(5px) rotateX(0deg)" },
        { transform: "translateZ(5px) rotateX(120deg)", offset: 0.6 },
        { transform: "translateZ(-1px) rotateX(180deg)" },
      ],
      {
        duration: 1100,
        easing: "cubic-bezier(.5,0,.2,1)",
      },
    );
    animate(
      head,
      [
        {
          opacity: 1,
          transform: "none",
        },
        {
          opacity: 0,
          transform: "translateY(-30px)",
        },
      ],
      { duration: 500 },
    );
    await sleep(750);

    /* 4 — a few photos fly out towards the guest */
    const box = env.getBoundingClientRect();
    const origin = {
      x: box.left + box.width / 2,
      y: box.top + box.height * (fullScreenNow ? 0.42 : 0.14),
    };
    const list: (Photo | null)[] = photos.length > 0 ? photos : [null, null, null];
    const plan = flyPlan(list.length, flyCount, fullScreenNow);
    const layer = flyPhotosOut(list.slice(0, plan.count), origin, plan.gap, random);
    await sleep((plan.count - 1) * plan.gap + 1000);

    /* 5 — the envelope slides away (no fading: opacity would flatten the 3D scene) */
    animate(env, [{ transform: "translate3d(0,0,0)" }, { transform: `translate3d(0,${window.innerHeight * 1.1}px,0)` }], {
      duration: 900,
      easing: "cubic-bezier(.6,0,.6,1)",
    });
    if (dustRef.current) {
      animate(dustRef.current, [{ opacity: 1 }, { opacity: 0 }], { duration: 900 });
    }
    await sleep(450);
    layer.remove();
    onOpened();
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      void open();
    }
  }

  const hiddenHalf = { visibility: "hidden" } as const;

  return (
    <section ref={introRef} className={opened ? "intro opened" : "intro"} aria-label={messages.envelope}>
      <LanguageSwitch languages={otherLanguages} label={messages.language} />
      <div ref={dustRef} className="dust" aria-hidden="true">
        {dust.map((speck, i) => (
          <i
            key={i}
            style={
              {
                left: speck.left,
                top: speck.top,
                "--s": speck.size,
                "--d": speck.duration,
                "--k": speck.depth,
                animationDelay: speck.delay,
              } as CSSProperties
            }
          />
        ))}
      </div>

      <header ref={headRef} className="intro-head">
        <p className="kicker">{messages.kicker}</p>
        {greeting && <h1 className="script">{greeting}</h1>}
      </header>

      <div className="scene">
        <div ref={tiltRef} className="tilt">
          <div className="float">
            <div ref={envRef} className="env" role="button" tabIndex={0} aria-label={messages.openLetter} onClick={() => void open()} onKeyDown={onKeyDown}>
              <div className="env-shadow" />
              <div className="env-back">
                <div className="lining pattern" />
              </div>
              <div className="env-pocket">
                <div className="pocket-art">
                  <Pocket fullScreen={fullScreen} />
                </div>
                <div className="tex" />
                <div className="glare" />
              </div>
              <div ref={flapShadowRef} className="flap-shadow" />
              <div ref={flapRef} className="flap">
                <div className="flap-front">
                  <div className="tex" />
                  <div className="glare" />
                </div>
                <div className="flap-back pattern" />
              </div>
              <div className="seal-pulse" />
              <div ref={sealRef} className="seal">
                <Seal monogram={monogram} />
              </div>
              <div ref={halfLeftRef} className="seal-half" style={hiddenHalf}>
                <Seal monogram={monogram} part="left" />
              </div>
              <div ref={halfRightRef} className="seal-half" style={hiddenHalf}>
                <Seal monogram={monogram} part="right" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <p ref={hintRef} className="hint">
        <span>{messages.tapTheSeal}</span>
        <TapIcon />
      </p>
    </section>
  );
}
