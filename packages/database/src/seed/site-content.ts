import type { Prisma } from "@prisma/client";
import { prisma } from "../client";
import { marketingHomePayload } from "./data/marketing-home-payload";
import {
  aboutPagePayload,
  announcementBarPayload,
  careersPagePayload,
  pricingPagePayload,
  servicesPagePayload,
} from "./data/site-wide-content";

const entries: { key: string; label: string; payload: Prisma.InputJsonValue }[] = [
  { key: "marketing_home", label: "Marketing homepage", payload: marketingHomePayload as Prisma.InputJsonValue },
  { key: "announcement_bar", label: "Top announcement bar", payload: announcementBarPayload as Prisma.InputJsonValue },
  { key: "services_page", label: "Services page", payload: servicesPagePayload as Prisma.InputJsonValue },
  { key: "pricing_page", label: "Pricing page", payload: pricingPagePayload as Prisma.InputJsonValue },
  { key: "about_page", label: "About page", payload: aboutPagePayload as Prisma.InputJsonValue },
  { key: "careers_page", label: "Careers page", payload: careersPagePayload as Prisma.InputJsonValue },
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
