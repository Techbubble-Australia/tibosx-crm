import { prisma } from "../client";

/** When true, FAQ home/pricing rows are wiped and re-created; job listings get a full overwrite from seed defs. Default is false so `db:seed` does not erase admin/CMS edits. */
const forceDemoRelations =
  process.env.FORCE_DEMO_SEED === "1" || process.env.FORCE_DEMO_SEED === "true";

const DEFAULT_CLIENT_ID = "default-client-internal";

const categoryDefs = [
  { name: "ServiceNow", order: 0 },
  { name: "Salesforce", order: 1 },
  { name: "Microsoft", order: 2 },
  { name: "Engineering", order: 3 },
];

const technologyDefs = [
  { name: "ServiceNow", categoryName: "ServiceNow", order: 0 },
  { name: "Salesforce", categoryName: "Salesforce", order: 1 },
  { name: "Microsoft", categoryName: "Microsoft", order: 2 },
  { name: "Azure", categoryName: "Microsoft", order: 3 },
  { name: "AI/ML", categoryName: "Engineering", order: 4 },
];

const departmentDefs = [{ name: "Engineering", order: 0 }];

async function seedJobTaxonomies() {
  for (const c of categoryDefs) {
    await prisma.jobCategory.upsert({
      where: { name: c.name },
      create: { name: c.name, order: c.order },
      update: { order: c.order },
    });
  }

  const categories = await prisma.jobCategory.findMany();
  const categoryIdByName = new Map(categories.map((category) => [category.name, category.id]));

  for (const t of technologyDefs) {
    const categoryId = categoryIdByName.get(t.categoryName);
    if (!categoryId) {
      continue;
    }
    await prisma.jobTechnology.upsert({
      where: { categoryId_name: { categoryId, name: t.name } },
      create: { name: t.name, categoryId, order: t.order },
      update: { order: t.order },
    });
  }
  for (const d of departmentDefs) {
    await prisma.jobDepartment.upsert({
      where: { name: d.name },
      create: { name: d.name, order: d.order },
      update: { order: d.order },
    });
  }
}

async function seedDefaultClient() {
  await prisma.client.upsert({
    where: { id: DEFAULT_CLIENT_ID },
    create: {
      id: DEFAULT_CLIENT_ID,
      name: "Internal",
      website: "",
      country: "Australia",
      order: 0,
      active: true,
    },
    update: { name: "Internal", country: "Australia", active: true },
  });
}

function inferCategory(title: string): string {
  const t = title.toLowerCase();
  if (t.includes("servicenow")) return "ServiceNow";
  if (t.includes("salesforce")) return "Salesforce";
  if (t.includes("microsoft") || t.includes("azure")) return "Microsoft";
  return "Engineering";
}

function inferTechnology(title: string): string {
  const t = title.toLowerCase();
  if (t.includes("servicenow")) return "ServiceNow";
  if (t.includes("salesforce")) return "Salesforce";
  if (t.includes("azure")) return "Azure";
  if (t.includes("microsoft")) return "Microsoft";
  if (t.includes("ai") || t.includes("ml")) return "AI/ML";
  return "ServiceNow";
}

const jobDefs = [
  {
    slug: "senior-servicenow-developer",
    referenceNumber: "JRN001",
    title: "Senior ServiceNow Developer",
    location: "Australia",
    country: "Australia",
    flag: "🇦🇺",
    type: "full-time",
    workMode: "remote",
    department: "Engineering",
    order: 0,
  },
  {
    slug: "salesforce-solutions-architect",
    referenceNumber: "JRN002",
    title: "Salesforce Solutions Architect",
    location: "USA",
    country: "USA",
    flag: "🇺🇸",
    type: "contract",
    workMode: "remote",
    department: "Engineering",
    order: 1,
  },
  {
    slug: "ai-ml-engineer",
    referenceNumber: "JRN003",
    title: "AI / ML Engineer",
    location: "India",
    country: "India",
    flag: "🇮🇳",
    type: "full-time",
    workMode: "hybrid",
    department: "Engineering",
    order: 2,
  },
  {
    slug: "microsoft-integration-specialist",
    referenceNumber: "JRN004",
    title: "Microsoft Integration Specialist",
    location: "Philippines",
    country: "Philippines",
    flag: "🇵🇭",
    type: "contract",
    workMode: "remote",
    department: "Engineering",
    order: 3,
  },
  {
    slug: "senior-servicenow-consultant",
    referenceNumber: "JRN005",
    title: "Senior ServiceNow Consultant",
    location: "Australia",
    country: "Australia",
    flag: "🇦🇺",
    type: "full-time",
    workMode: "remote",
    department: "Engineering",
    order: 4,
  },
  {
    slug: "salesforce-technical-architect",
    referenceNumber: "JRN006",
    title: "Salesforce Technical Architect",
    location: "USA",
    country: "USA",
    flag: "🇺🇸",
    type: "full-time",
    workMode: "remote",
    department: "Engineering",
    order: 5,
  },
  {
    slug: "microsoft-integration-lead",
    referenceNumber: "JRN007",
    title: "Microsoft Integration Lead",
    location: "Australia",
    country: "Australia",
    flag: "🇦🇺",
    type: "full-time",
    workMode: "hybrid",
    department: "Engineering",
    order: 6,
  },
  {
    slug: "data-engineer-azure-aws",
    referenceNumber: "JRN008",
    title: "Data Engineer (Azure/AWS)",
    location: "India",
    country: "India",
    flag: "🇮🇳",
    type: "full-time",
    workMode: "remote",
    department: "Engineering",
    order: 7,
  },
  {
    slug: "senior-react-developer",
    referenceNumber: "JRN009",
    title: "Senior React Developer",
    location: "Philippines",
    country: "Philippines",
    flag: "🇵🇭",
    type: "full-time",
    workMode: "remote",
    department: "Engineering",
    order: 8,
  },
];

const faqRows = [
  {
    category: "home" as const,
    order: 0,
    question: "How quickly can you onboard a resource?",
    answer:
      "Our AI-matching engine can identify and propose a vetted candidate within hours of your request. Full onboarding — contracts signed, tools set up, team introductions — typically completes within one business day. For very specialised roles, allow up to 48 hours.",
  },
  {
    category: "home" as const,
    order: 1,
    question: "Do you work with startups or only enterprises?",
    answer:
      "We work with organisations of all sizes — from funded startups to Fortune 500 enterprises. Our engagement models are flexible enough to accommodate different budgets and requirements.",
  },
  {
    category: "home" as const,
    order: 2,
    question: "What happens if a placed resource doesn't work out?",
    answer:
      "We offer a 48-hour replacement guarantee. If a resource isn't the right fit, we'll find a replacement at no additional cost. Your satisfaction is our priority.",
  },
  {
    category: "home" as const,
    order: 3,
    question: "How does your pricing work?",
    answer:
      "We offer three engagement models: Staff Augmentation (time & materials), Project Delivery (fixed fee), and Product Engineering (custom scope). Each is designed to provide maximum value and zero surprises.",
  },
  {
    category: "home" as const,
    order: 4,
    question: "Do your resources work in my timezone?",
    answer:
      "Yes, we provide timezone-aligned resources. With offices across APAC, North America, and Europe, we can provide coverage for most timezone requirements.",
  },
  {
    category: "home" as const,
    order: 5,
    question: "What industries do you serve?",
    answer:
      "We serve a wide range of industries including healthcare, finance, government, retail, manufacturing, and technology. Our consultants bring relevant industry experience to every engagement.",
  },
];

export async function seedJobsFaqsTestimonialsTeam() {
  await seedJobTaxonomies();
  await seedDefaultClient();

  for (const j of jobDefs) {
    const category = inferCategory(j.title);
    const technology = inferTechnology(j.title);
    const countryCodeMap: Record<string, string> = {
      Australia: "au",
      USA: "us",
      India: "in",
      Philippines: "ph",
    };
    const countryCode = countryCodeMap[j.country] ?? "";
    const locations = countryCode
      ? [{ countryCode, country: j.country, flag: j.flag, label: j.location !== j.country ? j.location : "" }]
      : undefined;
    const base = {
      ...j,
      category,
      technology,
      clientId: DEFAULT_CLIENT_ID,
      description: "",
      published: true,
      ...(locations ? { locations } : {}),
    };
    await prisma.jobListing.upsert({
      where: { slug: j.slug },
      create: base,
      update: forceDemoRelations ? base : { order: j.order, published: true },
    });
  }

  const faqSeedData = [
    ...faqRows.map((r) => ({
      question: r.question,
      answer: r.answer,
      category: r.category,
      order: r.order,
      published: true,
    })),
    ...faqRows.map((r, i) => ({
      question: r.question,
      answer: r.answer,
      category: "pricing",
      order: i,
      published: true,
    })),
  ];

  if (forceDemoRelations) {
    await prisma.faqItem.deleteMany({ where: { category: { in: ["home", "pricing"] } } });
    await prisma.faqItem.createMany({ data: faqSeedData });
  } else {
    const existingFaq = await prisma.faqItem.count({
      where: { category: { in: ["home", "pricing"] } },
    });
    if (existingFaq === 0) {
      await prisma.faqItem.createMany({ data: faqSeedData });
    }
  }

  const testimonials = [
    {
      quote:
        "The Techbubble team helped us transform our ServiceNow implementation in weeks, not months. Their delivery quality and governance discipline were exceptional.",
      authorName: "Vandana K",
      authorTitle: "Director, Digital Programs",
      authorCompany: "Enterprise client",
      authorInitials: "VK",
      order: 0,
    },
    {
      quote:
        "TechBubble has been an absolute game-changer for our business unit. From the initial consultation to the final delivery, their team showed unmatched professionalism, creativity, and technical expertise.",
      authorName: "Haima Prakash",
      authorTitle: "Sr. Manager, Chief Technology Office",
      authorCompany: "University of Sydney",
      authorInitials: "HP",
      order: 1,
    },
  ];

  for (const t of testimonials) {
    const existing = await prisma.testimonial.findFirst({ where: { authorName: t.authorName } });
    if (existing) {
      await prisma.testimonial.update({
        where: { id: existing.id },
        data: { ...t, published: true },
      });
    } else {
      await prisma.testimonial.create({
        data: { ...t, published: true, authorImageUrl: "" },
      });
    }
  }

  const team = [
    {
      name: "Nikita T",
      role: "Founder & Director",
      location: "Australia",
      department: "Leadership",
      order: 0,
      featuredLeadershipOrder: 1,
      description:
        "Sets the strategic direction for TechBubble and leads enterprise partnerships across APAC and North America.",
    },
    {
      name: "Jeet Bhatt",
      role: "Founder & Director",
      location: "Australia",
      department: "Leadership",
      order: 1,
      featuredLeadershipOrder: 2,
      description: "",
    },
    {
      name: "Dhruv Bhatt",
      role: "Head of Product",
      location: "Australia",
      department: "Leadership",
      order: 2,
      featuredLeadershipOrder: 3,
      description: "",
    },
    {
      name: "Yogesh Panchal",
      role: "Delivery Manager",
      location: "USA",
      department: "Management Team",
      order: 0,
      description: "",
    },
    {
      name: "Lakshminarayanan",
      role: "Sr. Manager - Talent Acquisition",
      location: "India",
      department: "Management Team",
      order: 1,
      description: "",
    },
    {
      name: "Dinky Rajpal",
      role: "Sr. Manager - Business Development",
      location: "India",
      department: "Management Team",
      order: 2,
      description: "",
    },
    {
      name: "Kamal Rajput",
      role: "Sr. Account Manager",
      location: "APAC & UK",
      department: "Management Team",
      order: 3,
      description: "",
    },
  ];

  for (const m of team) {
    const existing = await prisma.teamMember.findFirst({
      where: { name: m.name, department: m.department },
    });
    if (existing) {
      await prisma.teamMember.update({
        where: { id: existing.id },
        data: { ...m, published: true, description: m.description ?? "" },
      });
    } else {
      await prisma.teamMember.create({
        data: { ...m, imageUrl: "", published: true, description: m.description ?? "" },
      });
    }
  }
}
