"use client";

import type { MouseEvent } from "react";
import type { LanguageLink } from "./types";

/** Links to the other languages; keeps the address's query (e.g. a personal `?pro=` greeting). */
export function LanguageSwitch({ languages, label }: { languages: LanguageLink[]; label: string }) {
  if (languages.length === 0) {
    return null;
  }

  function follow(event: MouseEvent<HTMLAnchorElement>, href: string) {
    if (!window.location.search || event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) {
      return;
    }
    event.preventDefault();
    window.location.href = href + window.location.search;
  }

  return (
    <nav className="lang-switch" aria-label={label}>
      {languages.map((language) => (
        <a key={language.code} href={language.href} hrefLang={language.code} lang={language.code} onClick={(event) => follow(event, language.href)}>
          {language.label}
        </a>
      ))}
    </nav>
  );
}
