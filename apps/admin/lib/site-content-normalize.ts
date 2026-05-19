import {
  announcementBarPayload,
  aboutPagePayload,
  careersPagePayload,
  servicesPagePayload,
  pricingPagePayload,
  contactPagePayload,
  legalPagesPayload,
  caseStudiesPagePayload,
  siteFooterPayload,
} from "@site-content/defaults";
import { marketingHomePayload } from "@site-content/marketing-home";
import { deepMerge } from "@/lib/deep-merge";
import type { AboutPagePayload } from "@/components/site-content/AboutPageForm";
import type { CareersPagePayload } from "@/components/site-content/CareersPageForm";
import type { ServicesPagePayload } from "@/components/site-content/ServicesPageForm";
import type { PricingPagePayload } from "@/components/site-content/PricingPageForm";
import type { SiteFooterPayload } from "@/components/site-content/SiteFooterForm";
import type { MarketingHomePayload } from "@site-content/marketing-home";
import { compactNestedStringArrays } from "@/lib/multiline-list";

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
  "contact_page",
  "legal_pages",
  "case_studies_page",
  "site_footer",
] as const;

export type SiteContentFormKey = (typeof SITE_CONTENT_FORM_KEYS)[number];

/** Short labels for the Site pages list (every key should appear even before DB seed). */
export const SITE_CONTENT_KEY_LABELS: Record<SiteContentFormKey, string> = {
  announcement_bar: "Announcement bar",
  marketing_home: "Marketing homepage",
  services_page: "Services page",
  pricing_page: "Pricing page",
  about_page: "About page",
  careers_page: "Careers page",
  contact_page: "Contact page",
  legal_pages: "Legal pages (privacy, terms, cookies)",
  case_studies_page: "Case studies listing",
  site_footer: "Site footer (offices, contact block)",
};

export function isVisualSiteContentKey(key: string): key is SiteContentFormKey {
  return (SITE_CONTENT_FORM_KEYS as readonly string[]).includes(key);
}

/**
 * Coerces known form quirks before persisting (e.g. textarea fields stored as strings).
 * Does not mutate the input object.
 */
export function serializeSiteContentForPersist(key: string, payload: unknown): unknown {
  if (key === "site_footer" && payload && typeof payload === "object" && !Array.isArray(payload)) {
    const p = payload as SiteFooterPayload;
    const offices = p.offices
      .map((o) => ({
        flagCode: o.flagCode,
        region: typeof o.region === "string" ? o.region.trim() : "",
        entity: typeof o.entity === "string" ? o.entity.trim() : "",
        address: typeof o.address === "string" ? o.address.trim() : "",
      }))
      .filter((o) => o.region.length > 0 || o.entity.length > 0 || o.address.length > 0);
    return {
      ...p,
      offices: offices.length > 0 ? offices : siteFooterPayload.offices,
    };
  }

  let out: unknown = payload;

  if (key === "marketing_home" && out && typeof out === "object" && !Array.isArray(out)) {
    const p = out as Record<string, unknown>;
    const hero = p.hero;
    if (hero && typeof hero === "object" && !Array.isArray(hero)) {
      const h = hero as Record<string, unknown>;
      const tc = h.trustChips;
      if (typeof tc === "string") {
        const trustChips = tc.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
        out = { ...p, hero: { ...h, trustChips } };
      }
    }
  }

  if (isVisualSiteContentKey(key) && out && typeof out === "object" && !Array.isArray(out)) {
    out = compactNestedStringArrays(out as Record<string, unknown>);
  }

  return out;
}

function mergeLegalPages(raw: unknown): typeof legalPagesPayload {
  const base = clone(legalPagesPayload);
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return base;
  }
  const r = raw as Partial<typeof legalPagesPayload>;
  return {
    privacy: deepMerge(base.privacy as Record<string, unknown>, (r.privacy ?? {}) as Record<string, unknown>) as (typeof base)["privacy"],
    terms: deepMerge(base.terms as Record<string, unknown>, (r.terms ?? {}) as Record<string, unknown>) as (typeof base)["terms"],
    cookies: deepMerge(base.cookies as Record<string, unknown>, (r.cookies ?? {}) as Record<string, unknown>) as (typeof base)["cookies"],
  };
}

export function normalizeSiteContentPayload(key: string, raw: unknown): unknown {
  if (!isVisualSiteContentKey(key)) {
    return raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {};
  }

  if (key === "legal_pages") {
    return mergeLegalPages(raw);
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
      case "contact_page":
        return clone(contactPagePayload);
      case "case_studies_page":
        return clone(caseStudiesPagePayload);
      case "site_footer":
        return clone(siteFooterPayload);
      default:
        return {};
    }
  })();

  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return base;
  }

  return deepMerge(base as Record<string, unknown>, raw as Record<string, unknown>);
}
