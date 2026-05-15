import type { Metadata } from "next";
import { LegalDocShell } from "@/components/LegalDocShell";
import { LegalDocFromPayload } from "@/components/legal/LegalDocFromPayload";
import { fetchSiteContentPayload } from "@/lib/fetch-site-content";
import { resolveLegalPages } from "@/lib/site-content/resolve-pages";

export const metadata: Metadata = {
  title: "Cookie Notice | TechBubble",
  description: "How TechBubble uses cookies and similar technologies on its websites.",
};

export default async function CookiesPage() {
  const raw = await fetchSiteContentPayload<unknown>("legal_pages");
  const legal = resolveLegalPages(raw);
  const doc = legal.cookies;

  return (
    <LegalDocShell title={doc.shellTitle} lastUpdated={doc.lastUpdated}>
      <LegalDocFromPayload doc={doc} />
    </LegalDocShell>
  );
}
