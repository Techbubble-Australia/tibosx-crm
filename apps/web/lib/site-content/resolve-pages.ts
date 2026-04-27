import {
  aboutPagePayload,
  careersPagePayload,
  pricingPagePayload,
  servicesPagePayload,
} from "@site-content/defaults";

export type ServicesPagePayload = typeof servicesPagePayload;
export type PricingPagePayload = typeof pricingPagePayload;
export type AboutPagePayload = typeof aboutPagePayload;
export type CareersPagePayload = typeof careersPagePayload;

export function resolveServicesPage(raw: unknown): ServicesPagePayload {
  if (!raw || typeof raw !== "object") return servicesPagePayload;
  const r = raw as Partial<ServicesPagePayload>;
  return {
    ...servicesPagePayload,
    ...r,
    hero: { ...servicesPagePayload.hero, ...r.hero },
    highlights: r.highlights ?? servicesPagePayload.highlights,
    engagementSection: { ...servicesPagePayload.engagementSection, ...r.engagementSection },
    serviceModels: r.serviceModels ?? servicesPagePayload.serviceModels,
    processSection: { ...servicesPagePayload.processSection, ...r.processSection },
    processSteps: r.processSteps ?? servicesPagePayload.processSteps,
    cta: { ...servicesPagePayload.cta, ...r.cta },
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

export function resolveAboutPage(raw: unknown): AboutPagePayload {
  if (!raw || typeof raw !== "object") return aboutPagePayload;
  const r = raw as Partial<AboutPagePayload>;
  return {
    ...aboutPagePayload,
    ...r,
    hero: { ...aboutPagePayload.hero, ...r.hero },
    mission: { ...aboutPagePayload.mission, ...r.mission },
    statsStrip: r.statsStrip ?? aboutPagePayload.statsStrip,
    missionCards: r.missionCards ?? aboutPagePayload.missionCards,
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
