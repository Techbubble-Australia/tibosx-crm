import type { LucideIcon } from "lucide-react";
import { FileText, PhoneCall, Rocket, ShieldCheck } from "lucide-react";
import type { MarketingHomePayload } from "@/lib/data/marketing-home-payload";
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
    engagementModels: [...content.engagement.models],
    deliverySteps: content.howItWorks.steps.map((s) => ({
      title: s.title,
      body: s.body,
      icon: STEP_ICONS[s.icon] ?? PhoneCall,
    })),
    platforms: content.platforms.map((p) => ({ ...p })),
    faqItems: content.faqItems.map((f) => ({ question: f.question, answer: f.answer })),
    statsStrip: content.statsStrip,
    hero: content.hero,
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
