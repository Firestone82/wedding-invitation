import type { ReactNode } from "react";
import { languageCodes } from "@/i18n";
import { RootDocument } from "../RootDocument";

export const dynamicParams = false;

export function generateStaticParams() {
  return languageCodes.map((lang) => ({
    lang,
  }));
}

export default async function LanguageLayout({ children, params }: { children: ReactNode; params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  return <RootDocument language={lang}>{children}</RootDocument>;
}
