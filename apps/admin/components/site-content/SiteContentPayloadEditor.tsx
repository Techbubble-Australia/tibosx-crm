"use client";

import type { MarketingHomePayload } from "@site-content/marketing-home";
import { AnnouncementBarForm } from "./AnnouncementBarForm";
import { AboutPageForm, type AboutPagePayload } from "./AboutPageForm";
import { CareersPageForm, type CareersPagePayload } from "./CareersPageForm";
import { ServicesPageForm, type ServicesPagePayload } from "./ServicesPageForm";
import { PricingPageForm, type PricingPagePayload } from "./PricingPageForm";
import { MarketingHomeForm } from "./MarketingHomeForm";
import { ContactPageForm, type ContactPagePayload } from "./ContactPageForm";
import { LegalPagesForm, type LegalPagesPayload } from "./LegalPagesForm";
import { CaseStudiesPageForm, type CaseStudiesPagePayload } from "./CaseStudiesPageForm";
import { SiteFooterForm, type SiteFooterPayload } from "./SiteFooterForm";
import { isVisualSiteContentKey } from "@/lib/site-content-normalize";

export function SiteContentPayloadEditor({
  siteKey,
  payload,
  onPayloadChange,
}: {
  siteKey: string;
  payload: unknown;
  onPayloadChange: (next: unknown) => void;
}) {
  if (!isVisualSiteContentKey(siteKey)) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">
        <p className="font-semibold">No visual editor for this key</p>
        <p className="mt-2 text-amber-800">
          Use one of the seeded keys (e.g. <code className="rounded bg-white px-1">services_page</code>) or contact
          engineering to add a form for <code className="rounded bg-white px-1">{siteKey}</code>.
        </p>
      </div>
    );
  }

  switch (siteKey) {
    case "announcement_bar":
      return (
        <AnnouncementBarForm
          value={payload as { badge: string; message: string; linkText: string; linkHref: string }}
          onChange={onPayloadChange}
        />
      );
    case "about_page":
      return <AboutPageForm value={payload as AboutPagePayload} onChange={onPayloadChange} />;
    case "careers_page":
      return <CareersPageForm value={payload as CareersPagePayload} onChange={onPayloadChange} />;
    case "services_page":
      return <ServicesPageForm value={payload as ServicesPagePayload} onChange={onPayloadChange} />;
    case "pricing_page":
      return <PricingPageForm value={payload as PricingPagePayload} onChange={onPayloadChange} />;
    case "marketing_home":
      return (
        <MarketingHomeForm value={payload as MarketingHomePayload} onChange={onPayloadChange} />
      );
    case "contact_page":
      return <ContactPageForm value={payload as ContactPagePayload} onChange={onPayloadChange} />;
    case "legal_pages":
      return <LegalPagesForm value={payload as LegalPagesPayload} onChange={onPayloadChange} />;
    case "case_studies_page":
      return <CaseStudiesPageForm value={payload as CaseStudiesPagePayload} onChange={onPayloadChange} />;
    case "site_footer":
      return <SiteFooterForm value={payload as SiteFooterPayload} onChange={onPayloadChange} />;
    default:
      return null;
  }
}
