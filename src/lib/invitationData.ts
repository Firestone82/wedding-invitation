import type { Metadata, Viewport } from "next";
import { wedding } from "@/config/wedding";
import { getLanguage, getMessages, localize } from "@/i18n";
import type { InvitationData } from "@/components/types";
import { asset, languagePath } from "./assets";
import { googleCalendarUrl, type CalendarEvent } from "./calendar";
import { photosFor } from "./photos";

/** Everything the page needs for one language, resolved at build time. */
export function invitationData(code: string): InvitationData {
  const language = getLanguage(code);
  const place = localize(wedding.place, code);
  const calendarEvent: CalendarEvent = {
    title: localize(wedding.calendar.title, code),
    description: localize(wedding.calendar.description, code),
    place,
    date: wedding.date,
    time: wedding.time,
    durationHours: wedding.durationHours,
    utcOffset: wedding.utcOffset,
    timeZone: wedding.timeZone,
    reminderDaysBefore: wedding.calendar.reminderDaysBefore,
    uid: `${wedding.date.replace(/-/g, "")}-${wedding.names.replace(/\W+/g, "").toLowerCase()}@wedding-invitation`,
  };
  return {
    language: language.code,
    messages: getMessages(code),
    names: wedding.names,
    monogram: wedding.monogram,
    photos: photosFor(code),
    inviteImage: asset(localize(wedding.inviteImage, code)),
    place,
    mapUrl: localize(wedding.mapUrl, code),
    googleCalendarUrl: googleCalendarUrl(calendarEvent, code),
    calendarEvent,
    calendarFileName: wedding.calendar.fileName,
    music: {
      ...wedding.music,
      src: wedding.music.src ? asset(wedding.music.src) : "",
    },
    show: wedding.show,
    otherLanguages: wedding.languages
      .filter((other) => other.code !== code)
      .map((other) => ({
        code: other.code,
        label: other.label,
        href: languagePath(other.code),
      })),
  };
}

export function invitationMetadata(code: string): Metadata {
  const messages = getMessages(code);
  const siteUrl = process.env.SITE_URL;
  return {
    metadataBase: siteUrl ? new URL(siteUrl) : undefined,
    title: messages.title,
    description: messages.description,
    icons: {
      icon: asset("favicon.svg"),
    },
    alternates: {
      languages: Object.fromEntries(wedding.languages.map((language) => [language.locale, languagePath(language.code)])),
    },
    openGraph: {
      title: `${wedding.names} · Save the date`,
      description: `${messages.kicker}. ${messages.openLetter}.`,
      locale: getLanguage(code).locale.replace("-", "_"),
      images: [asset(localize(wedding.inviteImage, code))],
    },
  };
}

export const invitationViewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#F1E8D4",
};
