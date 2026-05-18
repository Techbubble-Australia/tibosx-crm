import { prisma } from "../client";

const jobDefs = [
  {
    slug: "senior-servicenow-developer",
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
    slug: "mulesoft-integration-specialist",
    title: "MuleSoft Integration Specialist",
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
    slug: "mulesoft-integration-lead",
    title: "MuleSoft Integration Lead",
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
  for (const j of jobDefs) {
    await prisma.jobListing.upsert({
      where: { slug: j.slug },
      create: { ...j, description: "", published: true },
      update: { ...j, description: "", published: true },
    });
  }

  await prisma.faqItem.deleteMany({ where: { category: { in: ["home", "pricing"] } } });
  await prisma.faqItem.createMany({
    data: [
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
    ],
  });

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
      role: "Founder & Director, Australia",
      department: "Leadership",
      order: 0,
      featuredLeadershipOrder: 1,
      description:
        "Sets the strategic direction for TechBubble and leads enterprise partnerships across APAC and North America.",
    },
    {
      name: "Jeet Bhatt",
      role: "Founder & Director, Australia",
      department: "Leadership",
      order: 1,
      featuredLeadershipOrder: 2,
      description: "",
    },
    {
      name: "Dhruv Bhatt",
      role: "Head of Product, Australia",
      department: "Leadership",
      order: 2,
      featuredLeadershipOrder: 3,
      description: "",
    },
    {
      name: "Yogesh Panchal",
      role: "Delivery Manager, USA",
      department: "Management Team",
      order: 0,
      description: "",
    },
    {
      name: "Lakshminarayanan",
      role: "Sr. Manager - Talent Acquisition, India",
      department: "Management Team",
      order: 1,
      description: "",
    },
    {
      name: "Dinky Rajpal",
      role: "Sr. Manager - Business Development, India",
      department: "Management Team",
      order: 2,
      description: "",
    },
    {
      name: "Kamal Rajput",
      role: "Sr. Account Manager, APAC & UK",
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
