import type { Metadata } from "next";
import { LegalDocShell } from "@/components/LegalDocShell";
import { LegalDocFromPayload } from "@/components/legal/LegalDocFromPayload";
import { fetchSiteContentPayload } from "@/lib/fetch-site-content";
import { resolveLegalPages } from "@/lib/site-content/resolve-pages";

export const metadata: Metadata = {
  title: "Privacy Policy | TechBubble",
  description: "How TechBubble collects, uses, and protects personal information.",
};

export default async function PrivacyPage() {
  const raw = await fetchSiteContentPayload<unknown>("legal_pages");
  const legal = resolveLegalPages(raw);
  const doc = legal.privacy;

  return (
    <LegalDocShell title={doc.shellTitle} lastUpdated={doc.lastUpdated}>
      <LegalDocFromPayload doc={doc} />
    </LegalDocShell>
  );
}
