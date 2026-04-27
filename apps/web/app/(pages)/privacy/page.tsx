import type { Metadata } from "next";
import Link from "next/link";
import { LegalDocShell, LegalHeading } from "@/components/LegalDocShell";

export const metadata: Metadata = {
  title: "Privacy Policy | TechBubble",
  description: "How TechBubble collects, uses, and protects personal information.",
};

export default function PrivacyPage() {
  return (
    <LegalDocShell title="Privacy Policy">
      <p>
        TechBubble Pty Ltd and affiliated entities (&quot;TechBubble&quot;, &quot;we&quot;, &quot;us&quot;) respect your
        privacy. This policy describes how we handle personal information when you use our websites, contact forms, and
        services. It is a summary for transparency; engage qualified counsel before relying on it for compliance
        decisions.
      </p>

      <LegalHeading>Information we collect</LegalHeading>
      <p>
        We may collect identifiers and contact details you provide (name, email, phone, company), enquiry and application
        content, technical data such as IP address and browser type, and usage data from our sites. Job applications may
        include resume or portfolio links you submit.
      </p>

      <LegalHeading>How we use information</LegalHeading>
      <p>
        We use this information to respond to enquiries, deliver and improve our services, operate our business,
        communicate with you, meet legal obligations, and protect our rights. We do not sell your personal information.
      </p>

      <LegalHeading>Disclosure</LegalHeading>
      <p>
        We may share data with service providers who assist our operations (hosting, email, analytics), professional
        advisers, or authorities where required by law. Cross-border transfers may apply given our global offices.
      </p>

      <LegalHeading>Retention &amp; security</LegalHeading>
      <p>
        We retain information only as long as needed for the purposes above or as required by law. We apply reasonable
        technical and organisational measures; no method of transmission over the internet is completely secure.
      </p>

      <LegalHeading>Your choices</LegalHeading>
      <p>
        Depending on your location, you may have rights to access, correct, delete, or restrict processing of your
        personal data, or to object to certain processing. Contact us at{" "}
        <Link href="mailto:hello@techbubble.com.au" className="font-semibold text-[#111111] underline">
          hello@techbubble.com.au
        </Link>{" "}
        for requests.
      </p>

      <LegalHeading>Changes</LegalHeading>
      <p>We may update this policy from time to time. The &quot;Last updated&quot; date above reflects the latest revision.</p>
    </LegalDocShell>
  );
}
