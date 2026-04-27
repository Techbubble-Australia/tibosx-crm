/** Additional SiteContent keys (seeded). Icon names map to lucide-react on the client. */

export const announcementBarPayload = {
  badge: "NEW",
  message: "TechBubble now offers AI-matched talent onboarding in under 24 hours —",
  linkText: "See how it works →",
  linkHref: "/contact",
};

export const servicesPagePayload = {
  hero: {
    title: "Your Trusted Partner at Every Step of the Journey",
    subtitle:
      "From AI-powered staff augmentation to fixed-fee project delivery and custom product engineering — we have the expertise and talent to accelerate your enterprise.",
  },
  highlights: [
    {
      title: "Rapid Deployment",
      description: "Get started in under 24 hours with our streamlined onboarding process.",
      bodyWidth: "w-[213px]",
    },
    {
      title: "Timezone Aligned",
      description: "Our teams work in your timezone for seamless real-time collaboration.",
      bodyWidth: "w-[213px]",
    },
    {
      title: "Quality Assured",
      description: "Rigorous quality standards and governance at no additional cost.",
      bodyWidth: "w-[204px]",
    },
    {
      title: "Global Reach",
      description: "Offices in USA, Australia, India, and Philippines for local support.",
      bodyWidth: "w-[196px]",
    },
  ],
};

export const pricingPagePayload = {
  hero: {
    title: "Flexible Pricing for Every Enterprise",
    subtitle:
      "No rate cards on the shelf — every engagement is tailored to your exact requirements. Tell us what you need and we'll price it competitively within 24 hours.",
  },
  valueStrip: [
    { text: "Rapid No lock-in contracts", width: "w-[162px]" },
    { text: "Response within 24 hours", width: "w-[152px]" },
    { text: "48-hour Replacement guarantee", width: "w-[227px]" },
    { text: "Transparent weekly reporting", width: "w-[193px]" },
    { text: "Timezone-aligned delivery", width: "w-[161px]" },
  ],
  cardsSection: {
    eyebrow: "Our Engagement Models",
    title: "Choose the Model That Fits Your Needs",
    subtitle: "Three proven engagement models — each designed to give you maximum value and zero surprises.",
  },
  models: [
    {
      name: "STARTER",
      title: "Staff Augmentation",
      description: "Skilled engineers deployed to your team, fast. T&M pricing with full flexibility.",
      price: "Custom",
      priceNote: "based on role",
      features: [
        "1-10 engineers placed",
        "Onboarded in <24 hours",
        "Timezone-aligned resources",
        "Flexible scale up/down",
        "Dedicated account manager",
        "48-hour replacement guarantee",
      ],
      cta: "Get a Quote",
      popular: false,
    },
    {
      name: "Professional",
      title: "Project Delivery",
      description: "Fixed-fee SaaS implementations with full end-to-end delivery assurance.",
      price: "Fixed Fee",
      priceNote: "",
      features: [
        "ServiceNow or Salesforce project",
        "Dedicated project team assembled",
        "Milestone-based delivery plan",
        "99% on-budget delivery record",
        "3-month post-launch support",
        "Beat-any-quote guarantee",
      ],
      cta: "Start a Project",
      popular: true,
    },
    {
      name: "ENTERPRISE",
      title: "Product Engineering",
      description: "Full-scale product development with a dedicated AI-powered engineering team.",
      price: "Tailored",
      priceNote: "your scope",
      features: [
        "5-50+ dedicated engineers",
        "Full-stack & mobile development",
        "AI/ML integration included",
        "DevSecOps pipeline setup",
        "24/7 support & governance",
        "Dedicated VP of Engineering",
      ],
      cta: "Talk to Sales",
      popular: false,
    },
  ],
};

export const aboutPagePayload = {
  hero: {
    titleLine1: "Trusted Technology Partner",
    titleLine2: "Not Just a Vendor",
    subtitle:
      "Founded by engineers, powered by AI. We connect the world's most ambitious enterprises with top 1% tech talent — fast, transparent, and measurably better.",
  },
  mission: {
    eyebrow: "Our Mission",
    title: "Empowering enterprises with world-class technology talent",
    body:
      "At TechBubble, we provide tailored AI-powered IT solutions and digital strategies to help Australian and global enterprises thrive. Our focus is on efficiency, security, and innovation.\nPartner with TechBubble to unlock tailored, innovative solutions that drive success and position your business for long-term growth.",
  },
  statsStrip: [
    { n: "150+", l: "Expert Technicians", labelClass: "text-[12px] font-medium leading-4" },
    { n: "50+", l: "Enterprise Clients", labelClass: "text-[12px] font-medium leading-4" },
    { n: "24/7", l: "Support Available", labelClass: "text-[12px] font-medium leading-4" },
    { n: "98%", l: "Client Satisfaction Rate", labelClass: "text-[14px] font-normal leading-5 tracking-[0.035px]" },
  ],
  missionCards: [
    { title: "Speed First", text: "AI-matched specialists deployed in under 24 hours — no waiting, no ramp-up." },
    { title: "Top 1% Only", text: "Every consultant passes rigorous multi-stage vetting before we put them forward." },
    { title: "Timezone Aligned", text: "Resources matched to your working hours — real-time collaboration guaranteed." },
    { title: "SLA-Backed", text: "Contractual guarantees, 24/7 support, and dedicated governance on every engagement." },
    { title: "AI-Infused", text: "Our AI-matching engine reduces time-to-hire by 70% versus traditional models." },
    { title: "Innovation-Led", text: "Continuous upskilling ensures our talent stays ahead of every platform curve." },
  ],
};

export const careersPagePayload = {
  hero: {
    title: "Build the Future of Enterprise Technology With Us",
    subtitle:
      "At TechBubble, we celebrate creativity, collaboration, and continuous growth. Whether you're a seasoned professional or just starting out — your ideas matter here.",
  },
  cultureSection: {
    eyebrow: "Life at TechBubble",
    title: "Why People Love Working Here",
    subtitle:
      "We've built a culture where talented people do the best work of their careers — and have fun doing it.",
  },
  statsStrip: [
    { kind: "number", value: "6", label: "Global Offices" },
    { kind: "number", value: "50+", label: "Team Members" },
    { kind: "icon", icon: "Laptop", label: "Remote-Friendly" },
    { kind: "icon", icon: "TrendingUp", label: "Fast Growth" },
  ],
  benefits: [
    "Competitive salary and benefits package",
    "Work with cutting-edge technologies",
    "Career growth and learning opportunities",
    "Flexible work arrangements",
    "Collaborative and inclusive culture",
  ],
  cultureCards: [
    {
      title: "Collaboration First",
      description:
        "Cross-functional teams working across geographies, sharing knowledge and lifting each other up.",
      icon: "Users",
    },
    {
      title: "Growth Without Limits",
      description:
        "Continuous learning, certification support, and a clear path to leadership for every team member.",
      icon: "TrendingUp",
    },
    {
      title: "Innovation Culture",
      description:
        "Your ideas get heard. We actively encourage experimentation, new approaches, and creative problem-solving.",
      icon: "Lightbulb",
    },
    {
      title: "Global Exposure",
      description:
        "Work with enterprise clients across Australia, USA, UK, India, Philippines, and Middle East.",
      icon: "Globe",
    },
    {
      title: "Work-Life Balance",
      description:
        "Flexible arrangements, remote-friendly roles, and a management team that genuinely respects your time.",
      icon: "Clock",
    },
    {
      title: "Recognition & Rewards",
      description: "Performance bonuses, spot awards, and a culture that celebrates wins — big and small.",
      icon: "Award",
    },
  ],
};
