"use client";

import type { Messages } from "@/i18n/types";
import { SoundOffIcon, SoundOnIcon } from "./icons";

export function MusicToggle({ on, messages, onToggle }: { on: boolean; messages: Messages; onToggle: () => void }) {
  return (
    <button
      className={on ? "music" : "music muted"}
      type="button"
      aria-pressed={on}
      aria-label={on ? messages.musicOff : messages.musicOn}
      onClick={(event) => {
        event.stopPropagation();
        onToggle();
      }}
    >
      {on ? <SoundOnIcon /> : <SoundOffIcon />}
    </button>
  );
}
