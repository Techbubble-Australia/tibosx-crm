import {
  announcementBarPayload,
  aboutPagePayload,
  careersPagePayload,
  servicesPagePayload,
  pricingPagePayload,
} from "@site-content/defaults";
import { marketingHomePayload } from "@site-content/marketing-home";
import { deepMerge } from "@/lib/deep-merge";
import type { AboutPagePayload } from "@/components/site-content/AboutPageForm";
import type { CareersPagePayload } from "@/components/site-content/CareersPageForm";
import type { ServicesPagePayload } from "@/components/site-content/ServicesPageForm";
import type { PricingPagePayload } from "@/components/site-content/PricingPageForm";
import type { MarketingHomePayload } from "@site-content/marketing-home";

function clone<T>(x: T): T {
  return JSON.parse(JSON.stringify(x)) as T;
}

export const SITE_CONTENT_FORM_KEYS = [
  "announcement_bar",
  "marketing_home",
  "services_page",
  "pricing_page",
  "about_page",
  "careers_page",
] as const;

export type SiteContentFormKey = (typeof SITE_CONTENT_FORM_KEYS)[number];

export function isVisualSiteContentKey(key: string): key is SiteContentFormKey {
  return (SITE_CONTENT_FORM_KEYS as readonly string[]).includes(key);
}

export function normalizeSiteContentPayload(key: string, raw: unknown): unknown {
  if (!isVisualSiteContentKey(key)) {
    return raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {};
  }
  const base = (() => {
    switch (key) {
      case "announcement_bar":
        return clone(announcementBarPayload);
      case "about_page":
        return clone(aboutPagePayload) as AboutPagePayload;
      case "careers_page":
        return clone(careersPagePayload) as CareersPagePayload;
      case "services_page":
        return clone(servicesPagePayload) as ServicesPagePayload;
      case "pricing_page":
        return clone(pricingPagePayload) as PricingPagePayload;
      case "marketing_home":
        return clone(marketingHomePayload) as MarketingHomePayload;
      default:
        return {};
    }
  })();
  return deepMerge(base as Record<string, unknown>, raw);
}
