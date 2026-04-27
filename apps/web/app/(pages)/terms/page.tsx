import type { Metadata } from "next";
import Link from "next/link";
import { LegalDocShell, LegalHeading } from "@/components/LegalDocShell";

export const metadata: Metadata = {
  title: "Terms of Use | TechBubble",
  description: "Terms governing use of TechBubble websites and marketing content.",
};

export default function TermsPage() {
  return (
    <LegalDocShell title="Terms of Use">
      <p>
        These terms govern your access to TechBubble&apos;s public websites and informational content (not a substitute
        for a signed services agreement). By using our sites, you agree to these terms. If you do not agree, do not use
        the sites.
      </p>

      <LegalHeading>Services &amp; information</LegalHeading>
      <p>
        Site content is for general information. Proposals, statements of work, or master agreements supersede any
        conflicting description on the website. Availability of talent or timelines on marketing pages are illustrative,
        not guarantees.
      </p>

      <LegalHeading>Acceptable use</LegalHeading>
      <p>
        You must not misuse our sites (including attempting unauthorised access, introducing malware, scraping in breach
        of robots.txt or rate limits, or using our brand in a misleading way). We may suspend access where necessary to
        protect our systems or users.
      </p>

      <LegalHeading>Intellectual property</LegalHeading>
      <p>
        TechBubble and its licensors own trademarks, logos, and site content unless otherwise noted. You may not copy,
        modify, or distribute our materials without prior written permission, except for fair personal use or as
        permitted by law.
      </p>

      <LegalHeading>Disclaimer</LegalHeading>
      <p>
        Sites and content are provided &quot;as is&quot; without warranties to the extent permitted by law. We are not
        liable for indirect or consequential loss arising from use of the sites.
      </p>

      <LegalHeading>Governing law</LegalHeading>
      <p>
        These terms are governed by the laws applicable in New South Wales, Australia, subject to mandatory consumer
        protections in your jurisdiction.
      </p>

      <LegalHeading>Contact</LegalHeading>
      <p>
        Questions about these terms:{" "}
        <Link href="mailto:hello@techbubble.com.au" className="font-semibold text-[#111111] underline">
          hello@techbubble.com.au
        </Link>
        .
      </p>
    </LegalDocShell>
  );
}
