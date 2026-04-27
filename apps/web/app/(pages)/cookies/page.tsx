import type { Metadata } from "next";
import Link from "next/link";
import { LegalDocShell, LegalHeading } from "@/components/LegalDocShell";

export const metadata: Metadata = {
  title: "Cookie Notice | TechBubble",
  description: "How TechBubble uses cookies and similar technologies on its websites.",
};

export default function CookiesPage() {
  return (
    <LegalDocShell title="Cookie Notice">
      <p>
        This notice explains how TechBubble uses cookies and similar technologies on our websites. It should be read
        together with our{" "}
        <Link href="/privacy" className="font-semibold text-[#111111] underline">
          Privacy Policy
        </Link>
        .
      </p>

      <LegalHeading>What are cookies?</LegalHeading>
      <p>
        Cookies are small text files stored on your device when you visit a site. They help the site function, remember
        preferences, measure performance, or support security.
      </p>

      <LegalHeading>How we use them</LegalHeading>
      <p>
        We may use strictly necessary cookies (e.g. security, load balancing), functional cookies (e.g. language or
        session choices), and analytics cookies to understand aggregate traffic and improve our marketing sites. Specific
        names and lifetimes depend on the tools we deploy and may change as we update our stack.
      </p>

      <LegalHeading>Your choices</LegalHeading>
      <p>
        You can control cookies through your browser settings (block, delete, or alert). Blocking some cookies may
        affect site behaviour. For analytics, industry opt-out tools may be available depending on the provider we use.
      </p>

      <LegalHeading>Updates</LegalHeading>
      <p>We may revise this notice when our practices or regulations change. Check the last updated date on this page.</p>

      <LegalHeading>Contact</LegalHeading>
      <p>
        Privacy-related questions:{" "}
        <Link href="mailto:hello@techbubble.com.au" className="font-semibold text-[#111111] underline">
          hello@techbubble.com.au
        </Link>
        .
      </p>
    </LegalDocShell>
  );
}
