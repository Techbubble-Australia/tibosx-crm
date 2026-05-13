import type { LucideIcon } from "lucide-react";
import { FileText, PhoneCall, Rocket, ShieldCheck } from "lucide-react";
import { marketingHomePayload, type MarketingHomePayload } from "@/lib/data/marketing-home-payload";
import { HOME_IMAGE_MAP } from "@/lib/home-image-map";
import type { StaticImageData } from "next/image";
import defaultHomeImage from "@image/techbubble_-_home_1.png";

const STEP_ICONS: Record<string, LucideIcon> = {
  PhoneCall,
  FileText,
  Rocket,
  ShieldCheck,
};

function mapImage(key: string, fallback?: StaticImageData): StaticImageData {
  return HOME_IMAGE_MAP[key] ?? fallback ?? defaultHomeImage;
}

/** Coerces CMS / form values (array, newline string, CSV) into a clean string[]. */
function normalizeStringList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((t) => String(t).trim()).filter(Boolean);
  }
  if (typeof value === "string") {
    return value
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
}

function normalizePlatformTags(value: unknown): string[] {
  return normalizeStringList(value);
}

export type EngagementBulletListStyle = "checkboxes" | "feature_icons";

function inferEngagementBulletListStyle(id: string, explicit: unknown): EngagementBulletListStyle {
  if (explicit === "feature_icons" || explicit === "checkboxes") {
    return explicit;
  }
  if (id === "staff") {
    return "feature_icons";
  }
  return "checkboxes";
}

/** Homepage “Our services” tabs: any count; coerces CMS shapes and legacy rows without bulletListStyle. */
function normalizeEngagementModels(raw: unknown): Array<{
  id: string;
  navLabel: string;
  label: string;
  description: string;
  bullets: string[];
  tags: string[];
  bulletListStyle: EngagementBulletListStyle;
}> {
  const fallback = marketingHomePayload.engagement.models.map((m) => ({
    ...m,
    bullets: normalizeStringList(m.bullets),
    tags: normalizeStringList(m.tags),
    bulletListStyle: inferEngagementBulletListStyle(m.id, (m as { bulletListStyle?: unknown }).bulletListStyle),
  }));

  if (!Array.isArray(raw) || raw.length === 0) {
    return fallback;
  }

  const seen = new Set<string>();
  return raw.map((row, index) => {
    const m = row as Record<string, unknown>;
    let id = String(m.id ?? "").trim() || `service-${index + 1}`;
    while (seen.has(id)) {
      id = `${id}-${index}-${seen.size}`;
    }
    seen.add(id);

    return {
      id,
      navLabel: typeof m.navLabel === "string" ? m.navLabel : "",
      label: typeof m.label === "string" ? m.label : "",
      description: typeof m.description === "string" ? m.description : "",
      bullets: normalizeStringList(m.bullets),
      tags: normalizeStringList(m.tags),
      bulletListStyle: inferEngagementBulletListStyle(id, m.bulletListStyle),
    };
  });
}

export function buildMarketingHomeViewModel(content: MarketingHomePayload) {
  return {
    featuredPartnerCard: content.featuredPartners.map((p) => ({
      id: p.id,
      image: mapImage(p.imageKey, HOME_IMAGE_MAP.home_1),
      imageClass: p.imageClass,
    })),
    trustedLogoStrip: content.trustedLogos.map((l) => ({
      name: l.name,
      image: mapImage(l.imageKey, HOME_IMAGE_MAP.home_6),
      width: l.width,
      height: l.height,
    })),
    engagementModels: normalizeEngagementModels(content.engagement.models),
    deliverySteps: content.howItWorks.steps.map((s) => ({
      title: s.title,
      body: s.body,
      icon: STEP_ICONS[s.icon] ?? PhoneCall,
    })),
    platforms: content.platforms.map((p) => ({
      ...p,
      tags: normalizePlatformTags((p as { tags?: unknown }).tags),
    })),
    faqItems: content.faqItems.map((f) => ({ question: f.question, answer: f.answer })),
    statsStrip: content.statsStrip,
    hero: (() => {
      const h = content.hero;
      const sp = h.socialProof;
      const trustChips = normalizeStringList(h.trustChips);
      const initials = normalizeStringList(sp?.initials);
      const defaultSp = marketingHomePayload.hero.socialProof;
      return {
        ...h,
        trustChips,
        socialProof: {
          initials: initials.length ? initials : [...defaultSp.initials],
          clientLabel: typeof sp?.clientLabel === "string" ? sp.clientLabel : defaultSp.clientLabel,
          ratingLabel: typeof sp?.ratingLabel === "string" ? sp.ratingLabel : defaultSp.ratingLabel,
          availableLabel: typeof sp?.availableLabel === "string" ? sp.availableLabel : defaultSp.availableLabel,
        },
      };
    })(),
    engagementHeader: content.engagement.header,
    engagementHelp: content.engagement.helpCard,
    howItWorksHeader: {
      pill: content.howItWorks.pill,
      title: content.howItWorks.title,
      subtitle: content.howItWorks.subtitle,
    },
    platformsIntro: content.platformsIntro,
    journey: content.journey,
    faqAside: content.faqAside,
    scheduleDemo: content.scheduleDemo,
    careersBand: content.careersBand,
    careersCta: content.careersCta,
  };
}

export type MarketingHomeViewModel = ReturnType<typeof buildMarketingHomeViewModel>;
