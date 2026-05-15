import type { Metadata } from "next";
import { LegalDocShell } from "@/components/LegalDocShell";
import { LegalDocFromPayload } from "@/components/legal/LegalDocFromPayload";
import { fetchSiteContentPayload } from "@/lib/fetch-site-content";
import { resolveLegalPages } from "@/lib/site-content/resolve-pages";

export const metadata: Metadata = {
  title: "Terms of Use | TechBubble",
  description: "Terms governing use of TechBubble websites and marketing content.",
};

export default async function TermsPage() {
  const raw = await fetchSiteContentPayload<unknown>("legal_pages");
  const legal = resolveLegalPages(raw);
  const doc = legal.terms;

  return (
    <LegalDocShell title={doc.shellTitle} lastUpdated={doc.lastUpdated}>
      <LegalDocFromPayload doc={doc} />
    </LegalDocShell>
  );
}
