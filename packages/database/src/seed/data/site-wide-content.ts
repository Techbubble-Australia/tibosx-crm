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
  /** Hero trust row — icon keys map in apps/web services page */
  highlights: [
    {
      title: "Scalability",
      description: "Elastic capacity to scale specialist teams up or down as your priorities shift.",
      icon: "Scaling",
    },
    {
      title: "Transparency",
      description: "Weekly reporting, clear milestones, and predictable governance on every engagement.",
      icon: "Transparency",
    },
    {
      title: "Quality Assured",
      description: "Multi-stage vetting, code review, and QA baked into every delivery increment.",
      icon: "Quality",
    },
    {
      title: "Global Reach",
      description: "Delivery hubs across APAC, North America, the UK, and the Middle East.",
      icon: "Global",
    },
  ],
  projectServices: {
    eyebrow: "01. Services",
    title: "Project Services",
    body: "End-to-end delivery for complex enterprise initiatives — from discovery and solution architecture through build, QA, and handover. We embed senior practitioners who align to your governance model and ship outcomes on a predictable cadence.",
    bullets: [
      "Discovery workshops and joint solution shaping",
      "Architecture, roadmaps, and delivery governance",
      "Agile squads integrated with your tools and ceremonies",
      "Hypercare, documentation, and clean knowledge transfer",
    ],
    tags: ["Strategy", "Design", "Development", "QA", "DevOps"],
    missionCard: {
      title: "Our Mission",
      body: "We make world-class engineering talent accessible to ambitious enterprises — combining AI-enabled matching with human judgment, transparent delivery, and uncompromising quality.",
      metrics: [
        { value: "10+", label: "Years Experience" },
        { value: "6+", label: "Offices" },
      ],
    },
  },
  productDevelopment: {
    eyebrow: "02. Services",
    title: "Product Development",
    intro:
      "Whether you are launching a greenfield product or modernising a legacy estate, we bring product-minded engineers, designers, and platform specialists who ship increments every sprint.",
    bullets: [
      "End-to-end product squads with design and engineering",
      "Design systems, UX research, and accessibility baked in",
      "Cloud-native architectures and secure release pipelines",
      "Continuous delivery automation and observability",
    ],
    metricsBar: [
      { value: "150+", label: "Projects delivered" },
      { value: "18+", label: "Tech stacks" },
      { value: "AI Driven", label: "Solutions" },
      { value: "24/7", label: "Support" },
    ],
    tags: ["React", "Node.js", "Python", "AWS", "Kubernetes", "AI/ML"],
  },
  staffingServices: {
    eyebrow: "03. Services",
    title: "Staffing Services",
    body: "Scale your teams with pre-vetted specialists who embed in your workflows, tools, and ceremonies — onboarded in as little as 24 hours with SLA-backed performance.",
    bullets: [
      "AI-matched profiles within hours of your request",
      "Timezone-aligned squads for real-time collaboration",
      "Governance, reporting, and escalation paths included",
      "48-hour replacement guarantee on eligible engagements",
    ],
    tags: ["Salesforce", "ServiceNow", "MuleSoft", "Data", "Cloud"],
    metricsTitle: "Key Metrics",
    metrics: [
      { value: "24h", label: "Response time" },
      { value: "98%", label: "Success rate" },
      { value: "150+", label: "Talent pool" },
    ],
  },
  processSection: {
    eyebrow: "Our process",
    title: "From Request to Results in 4 Steps",
    subtitle: "A clear, repeatable path from first conversation to measurable outcomes.",
  },
  /** Lucide icon keys: MessageCircle | LineChart | FileText | Rocket */
  processSteps: [
    {
      icon: "MessageCircle",
      title: "Initial Contact",
      description: "Share your goals, constraints, and timeline — we align on scope and success metrics.",
    },
    {
      icon: "LineChart",
      title: "Analysis",
      description: "We assess skills, platforms, and delivery model fit — then propose the right team shape.",
    },
    {
      icon: "FileText",
      title: "Proposal",
      description: "Transparent plan, milestones, commercials, and governance — agreed before kick-off.",
    },
    {
      icon: "Rocket",
      title: "Implementation",
      description: "Specialists onboard fast, deliver in cadence, and hand over with documentation and training.",
    },
  ],
  cta: {
    title: "Ready to Transform Your Business?",
    description:
      "Tell us about your roadmap and we will respond with a tailored approach — typically within four business hours.",
    primaryLabel: "Contact Us",
    primaryHref: "/contact",
    secondaryLabel: "Learn More",
    secondaryHref: "/about",
    checklist: ["Dedicated engagement lead", "Clear outcomes and KPIs", "No-obligation discovery session"],
  },
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
  faqs: [
    {
      question: "How quickly can you onboard a resource?",
      answer:
        "Our AI-matching engine can identify and propose a vetted candidate within hours of your request. Full onboarding — contracts signed, tools set up, team introductions — typically completes within one business day. For very specialised roles, allow up to 48 hours.",
    },
    {
      question: "Do you work with startups or only enterprises?",
      answer:
        "We work with organisations of all sizes — from funded startups to Fortune 500 enterprises. Our engagement models are flexible enough to accommodate different budgets and requirements.",
    },
    {
      question: "What happens if a placed resource doesn't work out?",
      answer:
        "We offer a 48-hour replacement guarantee. If a resource isn't the right fit, we'll find a replacement at no additional cost. Your satisfaction is our priority.",
    },
    {
      question: "How does your pricing work?",
      answer:
        "We offer three engagement models: Staff Augmentation (time & materials), Project Delivery (fixed fee), and Product Engineering (custom scope). Each is designed to provide maximum value and zero surprises.",
    },
    {
      question: "Do your resources work in my timezone?",
      answer:
        "Yes, we provide timezone-aligned resources. With offices across APAC, North America, and Europe, we can provide coverage for most timezone requirements.",
    },
    {
      question: "What industries do you serve?",
      answer:
        "We serve a wide range of industries including healthcare, finance, government, retail, manufacturing, and technology. Our consultants bring relevant industry experience to every engagement.",
    },
  ],
  rateCardSection: {
    eyebrow: "Rate Card",
    title: "Request a Detailed Rate Card",
    subtitle:
      "Help us understand your requirements, so that we can offer you our best price. Our team will get back to you within 24 hours with a customized quote.",
    bullets: [
      "150+ skilled professionals across technologies",
      "Personalized consultation with our experts",
      "AI-powered resource matching for best fit",
    ],
    footerChips: ["Response within 24 hours", "Free consultation call", "Zero obligation"],
    formTitle: "Get Your Custom Quote",
    formSubtitle: "Fill out the form and we'll be in touch within 24 hours.",
    formSubmitLabel: "Request Rate Card",
  },
  faqSection: {
    eyebrow: "FAQ",
    titleLines: ["Questions we", "hear all the", "time"],
    asideBlurb:
      "Can't find what you're looking for? Our team is happy to answer any questions directly.",
    asideCtaLabel: "Talk to us",
    asideCtaHref: "/contact",
  },
  closingCta: {
    title: "Ready to Transform Your Business?",
    description:
      "Join 50+ enterprises who trust TechBubble to power their most critical technology initiatives.",
    primaryLabel: "Request a Free Consultation",
    primaryHref: "/contact",
    secondaryLabel: "View Pricing",
    secondaryHref: "/pricing",
  },
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
