import { clamp } from "./motion";

type WindowWithWebkitAudio = Window & { webkitAudioContext?: typeof AudioContext };

/**
 * Background music. Browsers only allow sound after a tap, so `start` must be called from the tap on the seal.
 * Volume goes through Web Audio where possible, because iOS ignores `audio.volume`.
 */
export class MusicPlayer {
  private audio: HTMLAudioElement | null = null;
  private context: AudioContext | null = null;
  private gain: GainNode | null = null;
  private readonly volume: number;
  private readonly onChange: () => void;
  private readonly onVisibility = () => this.handleVisibility();

  started = false;
  on = true;

  constructor(src: string, volume: number, onChange: () => void) {
    this.volume = clamp(volume || 0.5, 0, 1);
    this.onChange = onChange;
    if (!src) {
      return;
    }
    const audio = new Audio();
    audio.src = src;
    audio.loop = true;
    audio.preload = "auto";
    audio.addEventListener("error", () => {
      this.audio = null;
      this.onChange();
    });
    this.audio = audio;
    document.addEventListener("visibilitychange", this.onVisibility);
  }

  get available(): boolean {
    return this.audio !== null;
  }

  /** The audio element, for debugging. */
  get element(): HTMLAudioElement | null {
    return this.audio;
  }

  /** Current second of the song while it is playing and not muted, otherwise null. */
  songTime(): number | null {
    return this.audio && !this.audio.paused && this.on ? this.audio.currentTime : null;
  }

  /** Starts the song at `startAt` seconds, fading in. Call from inside a tap/click handler. */
  start(startAt: number): void {
    const audio = this.audio;
    if (!audio) {
      return;
    }
    try {
      const AudioContextClass = window.AudioContext ?? (window as WindowWithWebkitAudio).webkitAudioContext;
      if (AudioContextClass && !this.context) {
        this.context = new AudioContextClass();
        const source = this.context.createMediaElementSource(audio);
        this.gain = this.context.createGain();
        this.gain.gain.value = 0;
        source.connect(this.gain).connect(this.context.destination);
      }
      void this.context?.resume();
    } catch {
      this.context = null;
      this.gain = null;
    }
    if (!this.gain) {
      audio.volume = 0;
    }
    const seek = () => {
      if (startAt > 0 && audio.currentTime < startAt - 0.3) {
        try {
          audio.currentTime = startAt;
        } catch {
          /* not seekable yet */
        }
      }
    };
    seek();
    if (audio.readyState < 1 || audio.currentTime < startAt - 0.3) {
      audio.addEventListener("loadedmetadata", seek, { once: true });
    }
    audio.play().catch(() => undefined);
    this.fadeTo(this.volume, 2.5);
    this.started = true;
    this.on = true;
    this.onChange();
  }

  toggle(): void {
    const audio = this.audio;
    if (!audio) {
      return;
    }
    this.on = !this.on;
    if (this.on) {
      void this.context?.resume();
      audio.play().catch(() => undefined);
      this.fadeTo(this.volume, 0.6);
    } else {
      this.fadeTo(0, 0.4);
      setTimeout(() => {
        if (!this.on) {
          audio.pause();
        }
      }, 450);
    }
    this.onChange();
  }

  dispose(): void {
    document.removeEventListener("visibilitychange", this.onVisibility);
    this.audio?.pause();
    void this.context?.close();
  }

  private fadeTo(target: number, seconds: number): void {
    if (this.gain && this.context) {
      const now = this.context.currentTime;
      this.gain.gain.cancelScheduledValues(now);
      this.gain.gain.setValueAtTime(this.gain.gain.value, now);
      this.gain.gain.linearRampToValueAtTime(target, now + seconds);
      return;
    }
    const audio = this.audio;
    if (!audio) {
      return;
    }
    const from = audio.volume;
    const startedAt = performance.now();
    const step = () => {
      const progress = Math.min(1, (performance.now() - startedAt) / (seconds * 1000));
      audio.volume = from + (target - from) * progress;
      if (progress < 1) {
        requestAnimationFrame(step);
      }
    };
    step();
  }

  private handleVisibility(): void {
    if (!this.audio || !this.on || !this.started) {
      return;
    }
    if (document.hidden) {
      this.audio.pause();
    } else {
      this.audio.play().catch(() => undefined);
    }
  }
}
