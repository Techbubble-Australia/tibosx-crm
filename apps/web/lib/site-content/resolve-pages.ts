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
