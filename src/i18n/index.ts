import { wedding } from "@/config/wedding";
import type { LanguageConfig, Localized } from "@/config/types";
import type { Messages } from "./types";
import cs from "./messages/cs";
import en from "./messages/en";

/**
 * Messages of every language. To add a language: create `messages/<code>.ts`,
 * register it here and add it to `languages` in `src/config/wedding.ts`.
 */
const messages: Record<string, Messages> = {
  cs,
  en,
};

for (const language of wedding.languages) {
  if (!messages[language.code]) {
    throw new Error(`Language "${language.code}" is configured but src/i18n/messages/${language.code}.ts is not registered in src/i18n/index.ts.`);
  }
}
if (!wedding.languages.some((language) => language.code === wedding.defaultLanguage)) {
  throw new Error(`defaultLanguage "${wedding.defaultLanguage}" is not one of the configured languages.`);
}

export const defaultLanguage = wedding.defaultLanguage;
export const languageCodes = wedding.languages.map((language) => language.code);

export function getLanguage(code: string): LanguageConfig {
  const language = wedding.languages.find((item) => item.code === code);
  if (!language) {
    throw new Error(`Unknown language "${code}".`);
  }
  return language;
}

export function getMessages(code: string): Messages {
  return messages[code] ?? messages[defaultLanguage];
}

function isPerLanguage<T>(value: Localized<T>): value is { [languageCode: string]: T } {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Picks the value for a language, falling back to the default language and then to any language. */
export function localize<T>(value: Localized<T>, code: string): T {
  if (!isPerLanguage(value)) {
    return value;
  }
  if (code in value) {
    return value[code];
  }
  if (defaultLanguage in value) {
    return value[defaultLanguage];
  }
  return Object.values(value)[0];
}

export type { Messages };
