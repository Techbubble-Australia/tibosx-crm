import Link from "next/link";
import { Fragment } from "react";
import { LegalHeading } from "@/components/LegalDocShell";
import type { LegalPagesPayload } from "@/lib/site-content/resolve-pages";

type LegalSingleDoc = LegalPagesPayload["privacy"] | LegalPagesPayload["terms"] | LegalPagesPayload["cookies"];

function RichParagraph({ text }: { text: string }) {
  const email = "hello@techbubble.com.au";
  if (!text.includes(email)) {
    return <>{text}</>;
  }
  const parts = text.split(email);
  return (
    <>
      {parts.map((part, i) => (
        <Fragment key={`${i}-${part.slice(0, 8)}`}>
          {part}
          {i < parts.length - 1 ? (
            <Link href={`mailto:${email}`} className="font-semibold text-[#111111] underline">
              {email}
            </Link>
          ) : null}
        </Fragment>
      ))}
    </>
  );
}

export function LegalDocFromPayload({ doc }: { doc: LegalSingleDoc }) {
  return (
    <>
      {"privacyPolicyLink" in doc && doc.privacyPolicyLink ? (
        <p>
          {doc.intro}
          <Link href={doc.privacyPolicyLink.href} className="font-semibold text-[#111111] underline">
            {doc.privacyPolicyLink.label}
          </Link>
          {doc.introAfterLink ?? ""}
        </p>
      ) : (
        <p>
          <RichParagraph text={doc.intro} />
        </p>
      )}

      {doc.sections.map((section) => (
        <Fragment key={section.heading}>
          <LegalHeading>{section.heading}</LegalHeading>
          {section.paragraphs.map((para, i) => (
            <p key={`${section.heading}-${i}`}>
              <RichParagraph text={para} />
            </p>
          ))}
        </Fragment>
      ))}
    </>
  );
}
