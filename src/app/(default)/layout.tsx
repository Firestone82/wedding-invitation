import type { ReactNode } from "react";
import { defaultLanguage } from "@/i18n";
import { RootDocument } from "../RootDocument";

/** The root address `/` shows the default language. */
export default function DefaultLayout({ children }: { children: ReactNode }) {
  return <RootDocument language={defaultLanguage}>{children}</RootDocument>;
}
