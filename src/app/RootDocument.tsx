import type { ReactNode } from "react";
import { fontVariables } from "./fonts";
import "./globals.css";

/** `<html>` shared by the root page and the language pages; scrolling stays locked until the envelope opens. */
export function RootDocument({ language, children }: { language: string; children: ReactNode }) {
  return (
    <html lang={language} className={`${fontVariables} locked`}>
      <body>{children}</body>
    </html>
  );
}
