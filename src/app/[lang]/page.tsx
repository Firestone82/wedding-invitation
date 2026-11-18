import type { Metadata } from "next";
import { Invitation } from "@/components/Invitation";
import { invitationData, invitationMetadata, invitationViewport } from "@/lib/invitationData";

type Props = {
  params: Promise<{ lang: string }>;
};

export const viewport = invitationViewport;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  return invitationMetadata(lang);
}

export default async function LanguagePage({ params }: Props) {
  const { lang } = await params;
  return <Invitation data={invitationData(lang)} />;
}
