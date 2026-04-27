import type { Prisma } from "@prisma/client";
import { prisma } from "../client";

const SHARED_BODY: Omit<
  Prisma.CaseStudyCreateInput,
  | "slug"
  | "title"
  | "subtitle"
  | "category"
  | "clientName"
  | "featuredImage"
  | "heroStat1Value"
  | "heroStat1Label"
  | "heroStat2Value"
  | "heroStat2Label"
  | "heroStat3Value"
  | "heroStat3Label"
  | "featured"
  | "published"
> = {
  backgroundTitle: "Context",
  backgroundContent:
    "The client needed a delivery partner that could combine platform depth with pragmatic execution — aligning stakeholders, de-risking delivery, and producing measurable outcomes.",
  challengeTitle: "The challenge",
  challengeContent:
    "Complex requirements, compressed timelines, and the need for quality without compromising velocity.",
  challengeStat1Value: "High",
  challengeStat1Label: "Delivery complexity",
  challengeStat2Value: "Tight",
  challengeStat2Label: "Timeline pressure",
  challengeStat3Value: "Critical",
  challengeStat3Label: "Quality bar",
  problem1Title: "Fragmented processes",
  problem1Content: "Manual workflows and inconsistent tooling slowed teams down.",
  problem2Title: "Integration risk",
  problem2Content: "Systems needed to connect reliably without creating operational blind spots.",
  problem3Title: "Skills gap",
  problem3Content: "Specialist expertise was required to accelerate delivery safely.",
  problem4Title: "Governance",
  problem4Content: "Leaders needed transparency, reporting, and predictable milestones.",
  solutionTitle: "Our approach",
  solutionContent:
    "TechBubble structured the engagement around clear outcomes, weekly governance, and incremental releases — reducing risk while maintaining momentum.",
  phase1Title: "Discovery & alignment",
  phase1Duration: "Week 1",
  phase1Content: "Confirmed scope, success metrics, architecture guardrails, and delivery plan.",
  phase1Tags: ["Discovery", "Architecture", "Planning"],
  phase2Title: "Build & integrate",
  phase2Duration: "Weeks 2-6",
  phase2Content: "Implemented capabilities with continuous testing and stakeholder checkpoints.",
  phase2Tags: ["Build", "Integration", "QA"],
  phase3Title: "Stabilise & enable",
  phase3Duration: "Weeks 7-8",
  phase3Content: "Hypercare, documentation, training, and handover to internal teams.",
  phase3Tags: ["Hypercare", "Training", "Handover"],
  phase4Title: null,
  phase4Duration: null,
  phase4Content: null,
  phase4Tags: [],
  techStackTitle: "Technology",
  techStackIntro: "Platforms and patterns chosen for long-term maintainability.",
  tech1Name: "Core platform",
  tech1Description: "Primary delivery surface",
  tech1Icon: "platform",
  tech2Name: "Integration",
  tech2Description: "APIs and automation",
  tech2Icon: "platform",
  tech3Name: "Data",
  tech3Description: "Reporting and insights",
  tech3Icon: "platform",
  tech4Name: "Identity & access",
  tech4Description: "Secure access patterns",
  tech4Icon: "platform",
  tech5Name: "Quality",
  tech5Description: "Testing and release discipline",
  tech5Icon: "platform",
  tech6Name: "Operations",
  tech6Description: "Runbooks and monitoring",
  tech6Icon: "platform",
  testimonialQuote: "TechBubble brought clarity, pace, and strong communication throughout the engagement.",
  testimonialAuthorName: "Program Sponsor",
  testimonialAuthorTitle: "Technology Leadership",
  testimonialAuthorCompany: "Client organisation",
  testimonialAuthorInitials: "PS",
  resultsTitle: "Outcomes",
  resultsContent: "Delivery milestones were met with strong stakeholder satisfaction and a foundation for continuous improvement.",
  resultStat1Value: "On track",
  resultStat1Label: "Milestones",
  resultStat2Value: "Strong",
  resultStat2Label: "Adoption",
  resultStat3Value: "High",
  resultStat3Label: "Confidence",
};

function mini(
  fields: Pick<
    Prisma.CaseStudyCreateInput,
    | "slug"
    | "title"
    | "subtitle"
    | "category"
    | "clientName"
    | "featuredImage"
    | "heroStat1Value"
    | "heroStat1Label"
    | "heroStat2Value"
    | "heroStat2Label"
    | "heroStat3Value"
    | "heroStat3Label"
    | "featured"
  > &
    Partial<Pick<Prisma.CaseStudyCreateInput, "bannerImage" | "contentImage">>
): Prisma.CaseStudyCreateInput {
  const { bannerImage, contentImage, ...rest } = fields;
  const featured = rest.featuredImage;
  return {
    ...SHARED_BODY,
    ...rest,
    bannerImage: (bannerImage?.trim() || featured) ?? "",
    contentImage: contentImage?.trim() ?? "",
    published: true,
  };
}

export async function seedCaseStudiesBulk() {
  const rows: Prisma.CaseStudyCreateInput[] = [
    mini({
      slug: "toyota-usa-servicenow",
      title: "Toyota USA — Enterprise ServiceNow Implementation",
      subtitle:
        "Toyota USA required a ServiceNow partner who could combine deep technical expertise with the agility to handle a complex, multi-domain rollout. TechBubble delivered a comprehensive implementation covering ITSM, CSM, and custom workflows — with post-launch support that ensured zero business disruption.",
      category: "ServiceNow",
      clientName: "Toyota USA",
      featuredImage: "/images/case-studies/toyota.jpg",
      heroStat1Value: "40%",
      heroStat1Label: "Efficiency gains",
      heroStat2Value: "3",
      heroStat2Label: "Domains delivered",
      heroStat3Value: "24/7",
      heroStat3Label: "Support coverage",
      featured: false,
    }),
    mini({
      slug: "nextcare-salesforce",
      title: "NextCare Aged Services — Salesforce UX Overhaul",
      subtitle:
        "NextCare needed a complete re-architecture of their Salesforce environment to support growing operational complexity across multiple care facilities. TechBubble rebuilt their data model, redesigned user-facing flows, and delivered a custom reporting layer — meeting tight regulatory deadlines.",
      category: "Salesforce",
      clientName: "NextCare Aged Services",
      featuredImage: "/images/case-studies/nextcare.jpg",
      heroStat1Value: "60%",
      heroStat1Label: "Faster reporting",
      heroStat2Value: "5 star",
      heroStat2Label: "Client rating",
      heroStat3Value: "100%",
      heroStat3Label: "Compliance posture",
      featured: false,
    }),
    mini({
      slug: "brainpower-offshore",
      title: "BrainPower LLC — Offshore Talent Program at Scale",
      subtitle:
        "Skeptical of offshore models, BrainPower LLC partnered with TechBubble to pilot an offshore staffing program across five concurrent client engagements. TechBubble's governance model and timezone-aligned teams removed every hesitation — delivering consistent quality across all projects.",
      category: "Staffing",
      clientName: "BrainPower LLC",
      featuredImage: "/images/case-studies/brainpower.jpg",
      heroStat1Value: "5",
      heroStat1Label: "Clients served",
      heroStat2Value: "35%",
      heroStat2Label: "Cost reduction",
      heroStat3Value: "100%",
      heroStat3Label: "Quality bar",
      featured: false,
    }),
    mini({
      slug: "nidi-tech-salesforce",
      title: "Nidi Tech Solutions — Salesforce Process Transformation",
      subtitle:
        "Nidi Tech required a highly configurable Salesforce solution aligned to complex business logic across their sales and service operations. TechBubble delivered an end-to-end implementation that significantly improved operational efficiency and customer satisfaction scores within the first quarter post-launch.",
      category: "Salesforce",
      clientName: "Nidi Tech Solutions",
      featuredImage: "/images/case-studies/nidi.jpg",
      heroStat1Value: "45%",
      heroStat1Label: "Ops efficiency uplift",
      heroStat2Value: "Q1",
      heroStat2Label: "ROI realised in",
      heroStat3Value: "High",
      heroStat3Label: "Satisfaction",
      featured: false,
    }),
  ];

  for (const data of rows) {
    await prisma.caseStudy.upsert({
      where: { slug: data.slug },
      create: data,
      update: data,
    });
  }
}
