export interface CalendarEvent {
  title: string;
  description: string;
  place: string;
  /** YYYY-MM-DD. */
  date: string;
  /** HH:MM, or "" for an all-day event. */
  time: string;
  durationHours: number;
  utcOffset: string;
  timeZone: string;
  reminderDaysBefore: number;
  uid: string;
}

const pad = (value: number): string => String(value).padStart(2, "0");

const ymd = (date: Date): string => `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}`;

const utcStamp = (date: Date): string => date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

function eventRange(event: CalendarEvent) {
  const [year, month, day] = event.date.split("-").map(Number);
  if (event.time) {
    const start = new Date(`${event.date}T${event.time}:00${event.utcOffset}`);
    const end = new Date(start.getTime() + event.durationHours * 3_600_000);
    return {
      google: `${utcStamp(start)}/${utcStamp(end)}`,
      icsStart: `DTSTART:${utcStamp(start)}`,
      icsEnd: `DTEND:${utcStamp(end)}`,
    };
  }
  const first = new Date(Date.UTC(year, month - 1, day));
  const next = new Date(Date.UTC(year, month - 1, day + 1));
  return {
    google: `${ymd(first)}/${ymd(next)}`,
    icsStart: `DTSTART;VALUE=DATE:${ymd(first)}`,
    icsEnd: `DTEND;VALUE=DATE:${ymd(next)}`,
  };
}

export function googleCalendarUrl(event: CalendarEvent, language: string): string {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    dates: eventRange(event).google,
    details: event.description,
    hl: language,
  });
  if (event.place) {
    params.set("location", event.place);
  }
  if (event.time) {
    params.set("ctz", event.timeZone);
  }
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

const icsEscape = (text: string): string => text.replace(/\\/g, "\\\\").replace(/([,;])/g, "\\$1").replace(/\n/g, "\\n");

export function icsFile(event: CalendarEvent): string {
  const range = eventRange(event);
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//wedding-invitation//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${event.uid}`,
    `DTSTAMP:${utcStamp(new Date())}`,
    range.icsStart,
    range.icsEnd,
    `SUMMARY:${icsEscape(event.title)}`,
    `DESCRIPTION:${icsEscape(event.description)}`,
  ];
  if (event.place) {
    lines.push(`LOCATION:${icsEscape(event.place)}`);
  }
  if (event.reminderDaysBefore > 0) {
    lines.push(
      "BEGIN:VALARM",
      "ACTION:DISPLAY",
      `DESCRIPTION:${icsEscape(event.title)}`,
      `TRIGGER:-P${event.reminderDaysBefore}D`,
      "END:VALARM",
    );
  }
  lines.push("END:VEVENT", "END:VCALENDAR");
  return lines.join("\r\n");
}

/** Saves the .ics file; iPhones and iPads open it straight in the Calendar app. */
export function downloadIcs(event: CalendarEvent, fileName: string): void {
  const ics = icsFile(event);
  const isIos =
    /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  if (isIos) {
    window.location.href = `data:text/calendar;charset=utf-8,${encodeURIComponent(ics)}`;
    return;
  }
  const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `${fileName}.ics`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}
