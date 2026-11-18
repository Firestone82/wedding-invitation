import type { WeddingConfig } from "./types";

/**
 * Everything about the wedding lives here.
 * Texts of the page are in `src/i18n/messages/<language>.ts`, photos and captions in `content/photos.json`.
 */
export const wedding: WeddingConfig = {
  names: "Anna & Jakub",
  monogram: "A&J",

  defaultLanguage: "cs",
  languages: [
    {
      code: "cs",
      label: "CZ",
      locale: "cs-CZ",
    },
    {
      code: "en",
      label: "EN",
      locale: "en-GB",
    },
  ],

  date: "2027-07-05",
  time: "",
  durationHours: 12,
  utcOffset: "+02:00",
  timeZone: "Europe/Prague",

  place: "",
  mapUrl: "",

  calendar: {
    title: {
      cs: "Svatba Anny a Jakuba",
      en: "Anna & Jakub's wedding",
    },
    description: {
      cs: "Anna & Jakub se berou! Těšíme se na vás.",
      en: "Anna & Jakub are getting married! We can't wait to see you.",
    },
    reminderDaysBefore: 7,
    fileName: "wedding-anna-jakub",
  },

  inviteImage: {
    cs: "invite/cs.webp",
    en: "invite/en.webp",
  },

  music: {
    src: "music.mp3",
    volume: 0.5,
    revealAt: 0,
    start: "auto",
  },

  show: {
    photoInterval: 1,
    flyCount: 4,
  },
};
