import rawPhotos from "../../content/photos.json";
import type { Localized } from "@/config/types";
import { localize } from "@/i18n";
import { asset } from "./assets";

/** One entry of `content/photos.json`. */
export interface PhotoEntry {
  /** File name in `public/photos/`, or a full URL. */
  file: string;
  /** Text on the polaroid's footer: one text, per language, or "" for none. */
  caption?: Localized<string>;
  /** Centre of the square crop, e.g. "50% 30%". */
  position?: string;
  /** Description for screen readers; defaults to the caption. */
  alt?: Localized<string>;
}

/** A photo ready for the page, in one language. */
export interface Photo {
  src: string;
  caption: string;
  alt: string;
  position: string;
}

const entries = rawPhotos as PhotoEntry[];

export function photosFor(language: string): Photo[] {
  return entries
    .filter((entry) => typeof entry.file === "string" && entry.file.length > 0)
    .map((entry) => {
      const caption = localize(entry.caption ?? "", language) ?? "";
      const alt = entry.alt === undefined ? caption : localize(entry.alt, language);
      const isUrl = /^(https?:|data:)/.test(entry.file);
      return {
        src: isUrl ? entry.file : asset(`photos/${entry.file}`),
        caption,
        alt,
        position: /^[\w\s.%-]{1,40}$/.test(entry.position ?? "") ? (entry.position as string) : "50% 50%",
      };
    });
}
