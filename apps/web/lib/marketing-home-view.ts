import type { LucideIcon } from "lucide-react";
import { FileText, PhoneCall, Rocket, ShieldCheck } from "lucide-react";
import { marketingHomePayload, type MarketingHomePayload } from "@/lib/data/marketing-home-payload";
import { HOME_IMAGE_MAP } from "@/lib/home-image-map";
import { deepMerge } from "@/lib/deep-merge";
import { resolveMediaUrl } from "@/lib/media-url";
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

type JsonObject = Record<string, unknown>;

function mergeHomeObject<A extends JsonObject>(fallback: A, actual: unknown): A {
  if (!actual || typeof actual !== "object" || Array.isArray(actual)) {
    return fallback;
  }
  return deepMerge(fallback, actual as JsonObject) as A;
}

function pickHomeArray<T>(value: unknown, fallback: readonly T[]): T[] {
  if (Array.isArray(value) && value.length > 0) {
    return value as T[];
  }
  return [...fallback];
}

function pickHomeLogoArray<T>(value: unknown, fallback: readonly T[]): T[] {
  if (Array.isArray(value)) {
    return value as T[];
  }
  return [...fallback];
}

type HomeLogoRow = {
  name: string;
  imageKey?: string;
  imageUrl?: string;
  width?: number;
  height?: number;
};

function resolveHomeLogoStrip(logos: HomeLogoRow[], defaultImageKey: string) {
  return logos.flatMap((row) => {
    const custom = typeof row.imageUrl === "string" ? row.imageUrl.trim() : "";
    const imageKey = typeof row.imageKey === "string" ? row.imageKey.trim() : "";
    if (!custom && !imageKey) {
      return [];
    }

    const width = Number(row.width) || 180;
    const height = Number(row.height) || 80;
    const name = typeof row.name === "string" && row.name.trim() ? row.name.trim() : "Supplier logo";

    if (custom) {
      return [{ name, src: resolveMediaUrl(custom), width, height }];
    }

    const bundled = HOME_IMAGE_MAP[imageKey] ?? HOME_IMAGE_MAP[defaultImageKey];
    if (!bundled) {
      return [];
    }

    return [
      {
        name,
        src: mapImage(imageKey, bundled).src,
        width,
        height,
      },
    ];
  });
}

export function buildMarketingHomeViewModel(content: MarketingHomePayload) {
  const engagement = mergeHomeObject(
    marketingHomePayload.engagement as unknown as JsonObject,
    content.engagement,
  ) as MarketingHomePayload["engagement"];
  const howItWorks = mergeHomeObject(
    marketingHomePayload.howItWorks as unknown as JsonObject,
    content.howItWorks,
  ) as MarketingHomePayload["howItWorks"];
  const statsStrip = mergeHomeObject(
    marketingHomePayload.statsStrip as unknown as JsonObject,
    content.statsStrip,
  ) as MarketingHomePayload["statsStrip"];
  const heroBase = mergeHomeObject(marketingHomePayload.hero as unknown as JsonObject, content.hero) as MarketingHomePayload["hero"];
  const platformsIntro = mergeHomeObject(
    marketingHomePayload.platformsIntro as unknown as JsonObject,
    content.platformsIntro,
  ) as MarketingHomePayload["platformsIntro"];
  const journey = mergeHomeObject(
    marketingHomePayload.journey as unknown as JsonObject,
    content.journey,
  ) as MarketingHomePayload["journey"];
  const scheduleDemo = mergeHomeObject(
    marketingHomePayload.scheduleDemo as unknown as JsonObject,
    content.scheduleDemo,
  ) as MarketingHomePayload["scheduleDemo"];
  const careersBand = mergeHomeObject(
    marketingHomePayload.careersBand as unknown as JsonObject,
    content.careersBand,
  ) as MarketingHomePayload["careersBand"];
  const careersCta = mergeHomeObject(
    marketingHomePayload.careersCta as unknown as JsonObject,
    content.careersCta,
  ) as MarketingHomePayload["careersCta"];
  const featuredPartners = pickHomeArray(content.featuredPartners, marketingHomePayload.featuredPartners);
  const governmentSupplierLogos = pickHomeLogoArray(
    content.governmentSupplierLogos,
    marketingHomePayload.governmentSupplierLogos,
  );
  const trustedLogos = pickHomeArray(content.trustedLogos, marketingHomePayload.trustedLogos);
  const platforms = pickHomeArray(content.platforms, marketingHomePayload.platforms);

  return {
    featuredPartnerCard: featuredPartners.map((p) => ({
      id: p.id,
      image: mapImage(p.imageKey, HOME_IMAGE_MAP.home_1),
      imageClass: p.imageClass,
    })),
    governmentSupplierStrip: resolveHomeLogoStrip(governmentSupplierLogos, "gov_nsw"),
    trustedLogoStrip: resolveHomeLogoStrip(trustedLogos, "home_6"),
    engagementModels: normalizeEngagementModels(engagement.models),
    deliverySteps: howItWorks.steps.map((s) => ({
      title: s.title,
      body: s.body,
      icon: STEP_ICONS[s.icon] ?? PhoneCall,
    })),
    platforms: platforms.map((p) => ({
      ...p,
      tags: normalizePlatformTags((p as { tags?: unknown }).tags),
    })),
    statsStrip,
    hero: (() => {
      const h = heroBase;
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
    engagementHeader: engagement.header,
    engagementHelp: engagement.helpCard,
    howItWorksHeader: {
      pill: howItWorks.pill,
      title: howItWorks.title,
      subtitle: howItWorks.subtitle,
    },
    platformsIntro,
    journey,
    scheduleDemo,
    careersBand,
    careersCta,
  };
}

export type MarketingHomeViewModel = ReturnType<typeof buildMarketingHomeViewModel>;
