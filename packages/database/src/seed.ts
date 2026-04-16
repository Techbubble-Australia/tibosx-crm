import { prisma } from "./client";

async function main() {
  // Create sample case study
  const caseStudy = await prisma.caseStudy.upsert({
    where: { slug: "university-of-sydney-rapid-it-talent" },
    update: {},
    create: {
      slug: "university-of-sydney-rapid-it-talent",
      title: "University of Sydney — Rapid IT Talent Deployment Across CTO Office",
      subtitle: "How TechBubble rebuilt NextCare's fragmented Salesforce environment from the ground up — delivering regulatory compliance, 60% faster reporting, and a care worker-first UX within a non-negotiable deadline.",
      category: "ServiceNow",
      clientName: "University of Sydney",
      
      heroStat1Value: "SERVICENOW",
      heroStat1Label: "CATEGORY",
      heroStat2Value: "40%",
      heroStat2Label: "EFFICIENCY GAINS",
      heroStat3Value: "3",
      heroStat3Label: "DOMAINS DELIVERED",
      
      featuredImage: "/images/case-studies/university-sydney.jpg",
      
      backgroundTitle: "A Growing Organisation Held Back by Legacy Systems",
      backgroundContent: "NextCare Aged Services operates multiple residential care facilities across Australia, providing essential support to elderly residents and their families. As the organisation grew through new facility acquisitions and expanded service offerings, their technology stack — anchored by an aging, heavily customised Salesforce implementation — increasingly became a liability rather than an enabler.\n\nDespite holding significant operational data across sales, intake, and service functions, the existing Salesforce org had been customised piecemeal over several years. The result was a fragile, poorly documented environment that was slow to use, difficult to maintain, and — critically — unable to produce the compliance reports required by the NDIS (National Disability Insurance Scheme) and the Aged Care Quality and Safety Commission.\n\nWith a scheduled compliance audit on the horizon and a growing roster of facilities requiring unified visibility, NextCare's leadership made the decision to re-architect entirely — and called on TechBubble to lead the engagement.",
      
      challengeTitle: "Four Interconnected Problems to Solve Simultaneously",
      challengeContent: "The engagement wasn't a simple configuration project. It required a complete rethinking of NextCare's Salesforce data architecture, user experience, compliance posture, and operational workflow — all while keeping the existing system running and avoiding disruption to front-line care staff.",
      
      challengeStat1Value: "6+",
      challengeStat1Label: "Years of legacy customisations stacked on an unstable data model",
      challengeStat2Value: "0",
      challengeStat2Label: "Real-time compliance reports available before the project",
      challengeStat3Value: "12+",
      challengeStat3Label: "Weeks until the NDIS compliance audit deadline",
      
      problem1Title: "Fragmented, unmaintainable data architecture",
      problem1Content: "Six years of ad-hoc customisations had created a labyrinthine data model with duplicated objects, broken validation rules, and no documentation. Every change risked breaking something else.",
      
      problem2Title: "No compliance-ready reporting",
      problem2Content: "NDIS and Aged Care Quality Commission reporting was being generated manually from Salesforce exports into Excel — a process that took 3-4 days per report cycle, introduced human error, and would not satisfy auditors.",
      
      problem3Title: "Care workers refusing to use the system",
      problem3Content: "The Salesforce UI had been designed for sales teams, not care workers. Navigation was counterintuitive, screens were cluttered with irrelevant fields, and mobile access was non-functional — leading to widespread workarounds and incomplete data entry.",
      
      problem4Title: "Non-negotiable regulatory deadline",
      problem4Content: "A compliance audit was scheduled within 12 weeks of project kickoff. Any delays would expose NextCare to regulatory penalties and reputational risk with both residents and referral partners.",
      
      solutionTitle: "A Four-Phase Rebuild Built Around People First",
      solutionContent: "TechBubble's approach began not with code, but with people. Before any technical work commenced, the team ran discovery workshops with care workers, facility managers, and executives at NextCare — building a shared understanding of how the organisation actually operated day-to-day, rather than how the system had been configured to assume it would.\n\nThis grounding shaped every design decision that followed. The re-architecture was then executed across four tightly sequenced phases, with compliance reporting as the first deliverable to de-risk the regulatory deadline from the outset.",
      
      phase1Title: "Discovery & Architecture Design",
      phase1Duration: "Weeks 1-2",
      phase1Content: "Comprehensive technical audit of the existing Salesforce org, cataloguing all customisations, data quality issues, and integration dependencies. Stakeholder workshops with care workers, managers, and compliance officers. A full re-architecture blueprint was produced and signed off before any development commenced.",
      phase1Tags: ["Salesforce Org Audit", "Stakeholder Workshops", "Data Model Design", "Architecture Blueprint"],
      
      phase2Title: "Compliance Reporting Layer",
      phase2Duration: "Weeks 3-7",
      phase2Content: "NDIS and Aged Care Quality Commission reporting built first — as a standalone priority — to meet the regulatory deadline. Salesforce Reports and Dashboards were configured with Tableau CRM to provide real-time compliance views, replacing the manual Excel process entirely. Audit documentation prepared in parallel.",
      phase2Tags: ["Salesforce Reports", "Tableau CRM", "NDIS Compliance", "Audit Documentation"],
      
      phase3Title: "Data Model Rebuild & Migration",
      phase3Duration: "Weeks 8-14",
      phase3Content: "The core Salesforce data model was rebuilt from scratch — removing six years of technical debt, merging duplicate objects, and establishing clean record types for residents, facilities, referrals, and care plans. A full data quality and deduplication exercise migrated 100% of historical records into the new model with no data loss.",
      phase3Tags: ["Data Model Re-architecture", "Deduplication", "Data Cleansing"],
      
      phase4Title: null,
      phase4Duration: null,
      phase4Content: null,
      phase4Tags: [],
      
      techStackTitle: "Purpose-Selected Tools for the Job",
      techStackIntro: "Every platform and tool used in this engagement was selected to serve a specific function — nothing was added for its own sake. The stack prioritises maintainability by NextCare's internal team after project completion.",
      
      tech1Name: "Salesforce Service Cloud",
      tech1Description: "Core case management, care tracking, and resident records",
      tech1Icon: "salesforce",
      
      tech2Name: "Salesforce Sales Cloud",
      tech2Description: "Referral and intake pipeline management across facilities",
      tech2Icon: "salesforce",
      
      tech3Name: "Tableau CRM",
      tech3Description: "Real-time NDIS and compliance dashboards for executives and auditors",
      tech3Icon: "tableau",
      
      tech4Name: "Salesforce Flow",
      tech4Description: "All automation — replacing Apex triggers and legacy Process Builder entirely",
      tech4Icon: "salesforce",
      
      tech5Name: "Lightning Web Components",
      tech5Description: "Custom UI components for care plan workflows and mobile ward views",
      tech5Icon: "salesforce",
      
      tech6Name: "Data Loader + Apex",
      tech6Description: "Bulk data migration, deduplication logic, and historical record cleansing",
      tech6Icon: "salesforce",
      
      testimonialQuote: "Working with TechBubble has been outstanding from start to finish. Their technical expertise, attention to detail, and ability to meet tight deadlines were truly remarkable. The code quality, the design, and the overall user experience reflect their genuine commitment to excellence.",
      testimonialAuthorName: "Steven Fan",
      testimonialAuthorTitle: "Head of Technology, Information Technology Services",
      testimonialAuthorCompany: "NextCare Aged Services",
      testimonialAuthorInitials: "SF",
      
      resultsTitle: "Regulatory Compliance Achieved with Room to Spare",
      resultsContent: "NextCare passed its NDIS and Aged Care Quality Commission audits without findings — the first time in the organisation's history. Beyond compliance, the new Salesforce environment delivered measurable operational improvements.",
      
      resultStat1Value: "60%",
      resultStat1Label: "Faster reporting",
      resultStat2Value: "5 star",
      resultStat2Label: "Client rating",
      resultStat3Value: "100%",
      resultStat3Label: "Compliance achieved",
      
      published: true,
    },
  });

  console.log("✅ Seed data created successfully");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
