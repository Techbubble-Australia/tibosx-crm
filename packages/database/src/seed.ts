import type { Prisma } from "@prisma/client";
import { prisma } from "./client";
import { seedAdminUser } from "./seed/admin-user";
import { seedCaseStudiesBulk } from "./seed/case-study-bulk";
import { seedJobsFaqsTestimonialsTeam } from "./seed/seed-relations";
import { seedSiteContent } from "./seed/site-content";

const FEATURED_CASE_SLUG = "university-of-sydney-rapid-it-talent";

const featuredCaseStudySeed: Prisma.CaseStudyCreateInput = {
  slug: FEATURED_CASE_SLUG,
  title: "University of Sydney — Rapid IT Talent Deployment Across CTO Office",
  subtitle:
    "How TechBubble mobilised platform specialists across the CTO office — accelerating delivery, standardising ServiceNow practices, and improving time-to-value across critical enterprise domains.",
  category: "ServiceNow",
  clientName: "University of Sydney",
  heroStat1Value: "40%",
  heroStat1Label: "EFFICIENCY GAINS",
  heroStat2Value: "3",
  heroStat2Label: "DOMAINS DELIVERED",
  heroStat3Value: "SERVICENOW",
  heroStat3Label: "CATEGORY",
  featuredImage: "/images/case-studies/university-sydney.jpg",
  bannerImages: ["/images/case-studies/university-sydney.jpg"],
  contentImage: "/images/case-studies/university-sydney.jpg",
  backgroundTitle: "Scaling delivery across the CTO office",
  backgroundContent:
    "The University of Sydney needed to scale digital delivery across the CTO office while maintaining governance, security, and speed. Legacy processes and fragmented tooling made it difficult to place the right specialists quickly and keep programmes predictable.\n\nTechBubble partnered with stakeholders to stand up a high-velocity delivery model — aligning architecture, execution, and reporting so teams could ship outcomes without compromising enterprise standards.",
  challengeTitle: "Four Interconnected Problems to Solve Simultaneously",
  challengeContent:
    "The engagement required specialist capability, predictable governance, and fast onboarding — without destabilising teams already running critical services.",
  challengeStat1Value: "6+",
  challengeStat1Label: "Concurrent workstreams requiring coordination",
  challengeStat2Value: "0",
  challengeStat2Label: "Dedicated acceleration model before engagement",
  challengeStat3Value: "12+",
  challengeStat3Label: "Weeks to first measurable milestone",
  problem1Title: "Specialist scarcity",
  problem1Content: "Hard-to-hire platform skills were slowing critical initiatives.",
  problem2Title: "Delivery predictability",
  problem2Content: "Stakeholders needed clearer milestones, reporting, and risk visibility.",
  problem3Title: "Operational load",
  problem3Content: "Internal teams were stretched across maintenance and new delivery.",
  problem4Title: "Governance requirements",
  problem4Content: "Security, compliance, and quality bars could not be compromised for speed.",
  solutionTitle: "A phased delivery model with embedded governance",
  solutionContent:
    "TechBubble deployed a structured playbook: discovery and alignment, accelerated build windows, continuous quality gates, and a clean handover model — ensuring teams stayed productive from week one.",
  phase1Title: "Discovery & mobilisation",
  phase1Duration: "Weeks 1-2",
  phase1Content: "Aligned scope, delivery plan, access, tooling, and success metrics with stakeholders.",
  phase1Tags: ["Discovery", "Planning", "Architecture"],
  phase2Title: "Accelerated delivery",
  phase2Duration: "Weeks 3-8",
  phase2Content: "Executed delivery increments with weekly governance and transparent reporting.",
  phase2Tags: ["Build", "QA", "Governance"],
  phase3Title: "Stabilisation & enablement",
  phase3Duration: "Weeks 9-10",
  phase3Content: "Hypercare, documentation, and enablement for internal teams.",
  phase3Tags: ["Hypercare", "Training", "Handover"],
  phase4Title: null,
  phase4Duration: null,
  phase4Content: null,
  phase4Tags: [],
  techStackTitle: "Technology stack",
  techStackIntro: "Platforms selected to match enterprise standards and long-term maintainability.",
  tech1Name: "ServiceNow",
  tech1Description: "ITSM and digital workflows",
  tech1Icon: "servicenow",
  tech2Name: "Integrations",
  tech2Description: "API-led connectivity patterns",
  tech2Icon: "microsoft",
  tech3Name: "Quality engineering",
  tech3Description: "Automated testing and release discipline",
  tech3Icon: "qa",
  tech4Name: "Cloud services",
  tech4Description: "Secure, scalable foundations",
  tech4Icon: "cloud",
  tech5Name: "Observability",
  tech5Description: "Operational visibility",
  tech5Icon: "monitoring",
  tech6Name: "Collaboration",
  tech6Description: "Documentation and ways of working",
  tech6Icon: "collab",
  testimonialQuote:
    "Working with TechBubble has been outstanding from start to finish. Their technical expertise, attention to detail, and ability to meet tight deadlines were truly remarkable.",
  testimonialAuthorName: "Steven Fan",
  testimonialAuthorTitle: "Head of Technology, Information Technology Services",
  testimonialAuthorCompany: "University of Sydney",
  testimonialAuthorInitials: "SF",
  resultsTitle: "Measurable outcomes",
  resultsContent:
    "Delivery velocity improved with stronger governance, clearer reporting, and higher stakeholder confidence.",
  resultStat1Value: "40%",
  resultStat1Label: "Efficiency gains",
  resultStat2Value: "3",
  resultStat2Label: "Domains delivered",
  resultStat3Value: "High",
  resultStat3Label: "Stakeholder satisfaction",
  published: true,
  featured: true,
};

async function main() {
  await seedAdminUser();

  if (!(await prisma.caseStudy.findUnique({ where: { slug: FEATURED_CASE_SLUG } }))) {
    await prisma.caseStudy.create({ data: featuredCaseStudySeed });
  }

  await seedCaseStudiesBulk();
  await seedJobsFaqsTestimonialsTeam();
  await seedSiteContent();

  console.log(
    "✅ Seed completed (case studies, jobs, FAQs, testimonials, team, site content). " +
      "Demo FAQ wipe + full job overwrite only when FORCE_DEMO_SEED=1. Site JSON reset only when FORCE_SITE_CONTENT=1.",
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
