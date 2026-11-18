/**
 * A value that can differ per language, keyed by language code:
 *
 *   {
 *     cs: "Svatba Anny a Jakuba",
 *     en: "Anna & Jakub's wedding",
 *   }
 *
 * or one plain value used for every language. A language that is missing falls back to the default language.
 */
export type Localized<T> = T | { [languageCode: string]: T };

export interface LanguageConfig {
  /** Short code used in the address (`/en/`) and as the key of localized values. */
  code: string;
  /** Text on the language switch. */
  label: string;
  /** Locale for dates, e.g. "cs-CZ" or "en-GB". */
  locale: string;
}

export interface CalendarConfig {
  title: Localized<string>;
  description: Localized<string>;
  /** Reminder in the .ics file, days before the wedding; 0 = none. */
  reminderDaysBefore: number;
  /** Name of the downloaded .ics file, without extension. */
  fileName: string;
}

export interface MusicConfig {
  /** File in `public/`, e.g. "music.mp3"; "" = no music. */
  src: string;
  /** 0 – 1. */
  volume: number;
  /** Second of the song when the Save the Date pops up; 0 = no syncing. */
  revealAt: number;
  /** "auto" = start the song so the Save the Date lands on `revealAt`; or a fixed second to start at. */
  start: "auto" | number;
}

export interface ShowConfig {
  /** Seconds each photo stays on top of the pile. */
  photoInterval: number;
  /** How many photos fly out of the opened envelope. */
  flyCount: number;
}

export interface WeddingConfig {
  names: string;
  /** Text stamped into the wax seal. */
  monogram: string;
  /** Language of the root address `/`. Must be one of `languages`. */
  defaultLanguage: string;
  /** Every language gets its own page at `/<code>/` and needs a messages file in `src/i18n/messages/`. */
  languages: LanguageConfig[];
  /** YYYY-MM-DD. */
  date: string;
  /** HH:MM for a timed calendar event, "" for an all-day event. */
  time: string;
  /** Length of the calendar event when `time` is set. */
  durationHours: number;
  /** Offset of the venue's time zone on the wedding day, e.g. "+02:00". */
  utcOffset: string;
  /** IANA time zone of the venue, used by Google Calendar. */
  timeZone: string;
  /** Venue address, shown under the card and used in the calendar event; "" = hidden. */
  place: Localized<string>;
  /** Link to the venue on a map; shows the map button; "" = hidden. */
  mapUrl: Localized<string>;
  calendar: CalendarConfig;
  /** Save the Date picture in `public/`, portrait 2:3. */
  inviteImage: Localized<string>;
  music: MusicConfig;
  show: ShowConfig;
}
