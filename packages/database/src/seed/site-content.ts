import type { Prisma } from "@prisma/client";
import { prisma } from "../client";
import { marketingHomePayload } from "./data/marketing-home-payload";
import {
  aboutPagePayload,
  announcementBarPayload,
  careersPagePayload,
  pricingPagePayload,
  servicesPagePayload,
  contactPagePayload,
  legalPagesPayload,
  caseStudiesPagePayload,
  siteFooterPayload,
} from "./data/site-wide-content";

const entries: { key: string; label: string; payload: Prisma.InputJsonValue }[] = [
  { key: "marketing_home", label: "Marketing homepage", payload: marketingHomePayload as Prisma.InputJsonValue },
  { key: "announcement_bar", label: "Announcement bar", payload: announcementBarPayload as Prisma.InputJsonValue },
  { key: "services_page", label: "Services page", payload: servicesPagePayload as Prisma.InputJsonValue },
  { key: "pricing_page", label: "Pricing page", payload: pricingPagePayload as Prisma.InputJsonValue },
  { key: "about_page", label: "About page", payload: aboutPagePayload as Prisma.InputJsonValue },
  { key: "careers_page", label: "Careers page", payload: careersPagePayload as Prisma.InputJsonValue },
  { key: "contact_page", label: "Contact page", payload: contactPagePayload as Prisma.InputJsonValue },
  { key: "legal_pages", label: "Legal pages (privacy, terms, cookies)", payload: legalPagesPayload as Prisma.InputJsonValue },
  { key: "case_studies_page", label: "Case studies listing", payload: caseStudiesPagePayload as Prisma.InputJsonValue },
  { key: "site_footer", label: "Site footer (offices, contact block)", payload: siteFooterPayload as Prisma.InputJsonValue },
];

export async function seedSiteContent() {
  for (const e of entries) {
    await prisma.siteContent.upsert({
      where: { key: e.key },
      create: { key: e.key, label: e.label, payload: e.payload },
      update: { label: e.label, payload: e.payload },
    });
  }
}
