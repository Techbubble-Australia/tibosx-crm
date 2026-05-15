import {
  aboutPagePayload,
  careersPagePayload,
  pricingPagePayload,
  servicesPagePayload,
  contactPagePayload,
  legalPagesPayload,
  caseStudiesPagePayload,
  siteFooterPayload,
} from "@site-content/defaults";
import { deepMerge } from "@/lib/deep-merge";

export type ServicesPagePayload = typeof servicesPagePayload;
export type PricingPagePayload = typeof pricingPagePayload;
export type AboutPagePayload = typeof aboutPagePayload;
export type CareersPagePayload = typeof careersPagePayload;
export type ContactPagePayload = typeof contactPagePayload;
export type LegalPagesPayload = typeof legalPagesPayload;
export type CaseStudiesPagePayload = typeof caseStudiesPagePayload;
export type SiteFooterPayload = typeof siteFooterPayload;

export function resolveServicesPage(raw: unknown): ServicesPagePayload {
  if (!raw || typeof raw !== "object") return servicesPagePayload;
  const r = raw as Partial<ServicesPagePayload>;
  const base = servicesPagePayload;
  return {
    ...base,
    ...r,
    hero: { ...base.hero, ...r.hero },
    highlights: r.highlights ?? base.highlights,
    projectServices: {
      ...base.projectServices,
      ...r.projectServices,
      bullets: r.projectServices?.bullets ?? base.projectServices.bullets,
      tags: r.projectServices?.tags ?? base.projectServices.tags,
      missionCard: {
        ...base.projectServices.missionCard,
        ...r.projectServices?.missionCard,
        metrics: r.projectServices?.missionCard?.metrics ?? base.projectServices.missionCard.metrics,
      },
    },
    productDevelopment: {
      ...base.productDevelopment,
      ...r.productDevelopment,
      bullets: r.productDevelopment?.bullets ?? base.productDevelopment.bullets,
      metricsBar: r.productDevelopment?.metricsBar ?? base.productDevelopment.metricsBar,
      tags: r.productDevelopment?.tags ?? base.productDevelopment.tags,
    },
    staffingServices: {
      ...base.staffingServices,
      ...r.staffingServices,
      bullets: r.staffingServices?.bullets ?? base.staffingServices.bullets,
      tags: r.staffingServices?.tags ?? base.staffingServices.tags,
      metrics: r.staffingServices?.metrics ?? base.staffingServices.metrics,
    },
    processSection: { ...base.processSection, ...r.processSection },
    processSteps: r.processSteps ?? base.processSteps,
    cta: {
      ...base.cta,
      ...r.cta,
      checklist: r.cta?.checklist ?? base.cta.checklist,
    },
  };
}

export function resolvePricingPage(raw: unknown): PricingPagePayload {
  if (!raw || typeof raw !== "object") return pricingPagePayload;
  const r = raw as Partial<PricingPagePayload>;
  return {
    ...pricingPagePayload,
    ...r,
    hero: { ...pricingPagePayload.hero, ...r.hero },
    valueStrip: r.valueStrip ?? pricingPagePayload.valueStrip,
    cardsSection: { ...pricingPagePayload.cardsSection, ...r.cardsSection },
    models: r.models ?? pricingPagePayload.models,
    faqs: r.faqs ?? pricingPagePayload.faqs,
    rateCardSection: { ...pricingPagePayload.rateCardSection, ...r.rateCardSection },
    faqSection: { ...pricingPagePayload.faqSection, ...r.faqSection },
    closingCta: { ...pricingPagePayload.closingCta, ...r.closingCta },
  };
}

function coalesceFeaturedTeamMemberIds(
  value: unknown,
  fallback: AboutPagePayload["leadership"]["featuredTeamMemberIds"],
): AboutPagePayload["leadership"]["featuredTeamMemberIds"] {
  if (!Array.isArray(value)) {
    return fallback;
  }
  const s = value.map((x) => String(x ?? "").trim());
  return [s[0] ?? "", s[1] ?? "", s[2] ?? ""] as AboutPagePayload["leadership"]["featuredTeamMemberIds"];
}

export function resolveAboutPage(raw: unknown): AboutPagePayload {
  if (!raw || typeof raw !== "object") return aboutPagePayload;
  const r = raw as Partial<AboutPagePayload>;
  const base = aboutPagePayload;
  return {
    ...base,
    ...r,
    hero: { ...base.hero, ...r.hero },
    mission: { ...base.mission, ...r.mission },
    statsStrip: r.statsStrip ?? base.statsStrip,
    missionCards: r.missionCards ?? base.missionCards,
    leadership: {
      ...base.leadership,
      ...r.leadership,
      featuredTeamMemberIds: coalesceFeaturedTeamMemberIds(
        r.leadership?.featuredTeamMemberIds ?? base.leadership.featuredTeamMemberIds,
        base.leadership.featuredTeamMemberIds,
      ),
      members: r.leadership?.members ?? base.leadership.members,
    },
    workforce: {
      ...base.workforce,
      ...r.workforce,
      defaultMemberBio: r.workforce?.defaultMemberBio ?? base.workforce.defaultMemberBio,
      stats: r.workforce?.stats ?? base.workforce.stats,
      tabs: r.workforce?.tabs ?? base.workforce.tabs,
      management: {
        ...base.workforce.management,
        ...r.workforce?.management,
        people: r.workforce?.management?.people ?? base.workforce.management.people,
      },
    },
    usp: {
      ...base.usp,
      ...r.usp,
      columns: r.usp?.columns ?? base.usp.columns,
    },
    values: {
      ...base.values,
      ...r.values,
      pillars: r.values?.pillars ?? base.values.pillars,
      missionCard: {
        ...base.values.missionCard,
        ...r.values?.missionCard,
        metrics: r.values?.missionCard?.metrics ?? base.values.missionCard.metrics,
      },
    },
    closingCta: { ...base.closingCta, ...r.closingCta },
  };
}

export function resolveCareersPage(raw: unknown): CareersPagePayload {
  if (!raw || typeof raw !== "object") return careersPagePayload;
  const r = raw as Partial<CareersPagePayload>;
  return {
    ...careersPagePayload,
    ...r,
    hero: { ...careersPagePayload.hero, ...r.hero },
    cultureSection: { ...careersPagePayload.cultureSection, ...r.cultureSection },
    statsStrip: r.statsStrip ?? careersPagePayload.statsStrip,
    benefits: r.benefits ?? careersPagePayload.benefits,
    cultureCards: r.cultureCards ?? careersPagePayload.cultureCards,
  };
}

export function resolveContactPage(raw: unknown): ContactPagePayload {
  if (!raw || typeof raw !== "object") return contactPagePayload;
  return deepMerge(contactPagePayload as unknown as Record<string, unknown>, raw) as ContactPagePayload;
}

export function resolveLegalPages(raw: unknown): LegalPagesPayload {
  if (!raw || typeof raw !== "object") return legalPagesPayload;
  const r = raw as Partial<LegalPagesPayload>;
  const base = legalPagesPayload;
  return {
    privacy: deepMerge(base.privacy as unknown as Record<string, unknown>, r.privacy ?? {}) as LegalPagesPayload["privacy"],
    terms: deepMerge(base.terms as unknown as Record<string, unknown>, r.terms ?? {}) as LegalPagesPayload["terms"],
    cookies: deepMerge(base.cookies as unknown as Record<string, unknown>, r.cookies ?? {}) as LegalPagesPayload["cookies"],
  };
}

export function resolveCaseStudiesPage(raw: unknown): CaseStudiesPagePayload {
  if (!raw || typeof raw !== "object") return caseStudiesPagePayload;
  return deepMerge(caseStudiesPagePayload as unknown as Record<string, unknown>, raw) as CaseStudiesPagePayload;
}

export function resolveSiteFooter(raw: unknown): SiteFooterPayload {
  if (!raw || typeof raw !== "object") return siteFooterPayload;
  return deepMerge(siteFooterPayload as unknown as Record<string, unknown>, raw) as SiteFooterPayload;
}
