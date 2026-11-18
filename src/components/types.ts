import type { MusicConfig, ShowConfig } from "@/config/types";
import type { Messages } from "@/i18n/types";
import type { CalendarEvent } from "@/lib/calendar";
import type { Photo } from "@/lib/photos";

export interface LanguageLink {
  code: string;
  label: string;
  href: string;
}

/** Everything the invitation needs, already resolved for one language on the server. */
export interface InvitationData {
  language: string;
  messages: Messages;
  names: string;
  monogram: string;
  photos: Photo[];
  inviteImage: string;
  place: string;
  mapUrl: string;
  googleCalendarUrl: string;
  calendarEvent: CalendarEvent;
  calendarFileName: string;
  music: MusicConfig;
  show: ShowConfig;
  /** The other languages, for the switch on the envelope. */
  otherLanguages: LanguageLink[];
}

export type LightboxTarget =
  | {
      kind: "photo";
      index: number;
    }
  | {
      kind: "card";
    };
