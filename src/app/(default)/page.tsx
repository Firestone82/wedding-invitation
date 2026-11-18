import { Invitation } from "@/components/Invitation";
import { defaultLanguage } from "@/i18n";
import { invitationData, invitationMetadata, invitationViewport } from "@/lib/invitationData";

export const metadata = invitationMetadata(defaultLanguage);
export const viewport = invitationViewport;

export default function DefaultPage() {
  return <Invitation data={invitationData(defaultLanguage)} />;
}
