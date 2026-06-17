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
    tags: ["Salesforce", "ServiceNow", "Microsoft", "Data", "Cloud"],
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
    ctaLabel: "Explore Services",
    ctaHref: "/services",
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
  leadership: {
    pill: "Our Team",
    title: "Meet The Leadership",
    subtitle:
      "The visionaries driving TechBubble's mission to transform businesses through technology.",
    members: [],
  },
  workforce: {
    pill: "Our Complete Team",
    title: "Meet Our Entire Workforce",
    intro:
      "With 150+ expert technicians across multiple specializations and global offices, we bring world-class expertise to every project. Our diverse team ensures excellence across every technology stack.",
    defaultMemberBio:
      "Short professional bio for this team member will appear here. Add a description in Admin → Team members, or edit placeholder text in Site content → About page.",
    stats: [
      { n: "150+", l: "Expert Team Members" },
      { n: "9", l: "Specialized Departments" },
      { n: "5", l: "Global Offices" },
      { n: "10+", l: "Years Experience" },
    ],
    /** Department pill order on About: `active` rows first; counts on site come from published Team members. */
    tabs: [] as { department: string; active: boolean }[],
    management: {
      title: "Management Team",
      memberCountLabel: "5 members",
      people: [
        {
          name: "Yogesh Panchal",
          role: "Delivery Manager, USA",
          bio: "Leads delivery governance and client outcomes for complex programs across the United States.",
          imageKey: "about_us_4",
          imageUrl: "",
        },
        {
          name: "Lakshminarayanan",
          role: "Sr. Manager - Talent Acquisition, India",
          bio: "Builds high-performing squads and hiring pipelines aligned to enterprise skills demand.",
          imageKey: "about_us_6",
          imageUrl: "",
        },
        {
          name: "Dinky Rajpal",
          role: "Sr. Manager - Business Development, India",
          bio: "Partners with clients to shape engagements that balance speed, quality, and commercial clarity.",
          imageKey: "about_us_7",
          imageUrl: "",
        },
        {
          name: "Kamal Rajput",
          role: "Sr. Account Manager, APAC & UK",
          bio: "Owns account strategy across APAC and UK, ensuring continuity from first meeting to delivery.",
          imageKey: "about_us_8",
          imageUrl: "",
        },
      ],
    },
  },
  usp: {
    pill: "Why Choose Us",
    title: "Our Unique Selling Points",
    subtitle: "Discover what makes TechBubble the preferred partner for businesses worldwide.",
    columns: [
      {
        title: "Technical Expertise That Spans Industries",
        body: "Our team is proficient across a wide spectrum of technologies, including SaaS platforms like ServiceNow, Salesforce, and Microsoft, and programming languages such as Java, Ruby, and Laravel. Whether your business requires IT solutions for small projects or complex, large-scale initiatives, our experience and skills make us your go-to partner for any technology stack.",
      },
      {
        title: "World-Class Talent, Available When You Need It",
        body: "We connect you with a vast network of skilled professionals experienced in handling international projects of all complexities. Our resources work within your time zone, ensuring seamless collaboration during your business hours. By outsourcing your IT needs to us, you can focus on what you do best—running your business—while we handle the technical details.",
      },
      {
        title: "24/7 Support & Governance—At No Extra Cost",
        body: "At TechBubble, customer satisfaction is our priority. We deliver tailored solutions, regardless of your budget, while providing round-the-clock professional support and governance at no additional charge. From start to finish, we ensure a smooth, worry-free experience and guarantee exceptional service at every stage of the engagement.",
      },
    ],
  },
  values: {
    pill: "Our Values",
    title: "What Drives Us Forward",
    introLeadBold: "At TechBubble,",
    introRest:
      " We're passionate about innovation and committed to empowering businesses with cutting-edge technology solutions. We believe in fostering a culture that celebrates creativity, collaboration, and continuous growth.",
    pillars: [
      { title: "Innovation", subtitle: "Constantly pushing boundaries with cutting-edge solutions" },
      { title: "Excellence", subtitle: "Delivering exceptional quality in every project" },
      { title: "Partnership", subtitle: "Building lasting relationships with our clients" },
      { title: "Integrity", subtitle: "Operating with transparency and honesty" },
    ],
    missionCard: {
      title: "Our Mission",
      body: "To empower businesses worldwide with innovative technology solutions that drive growth, efficiency, and success in an ever-evolving digital landscape.",
      metrics: [
        { n: "10+", l: "Years Experience" },
        { n: "5", l: "Global Offices" },
      ],
    },
  },
  closingCta: {
    title: "Ready to build something remarkable?",
    description:
      "Join 50+ enterprises who trust TechBubble to power their most critical technology initiatives.",
    primaryLabel: "Book a Free Consultation",
    primaryHref: "/contact",
    secondaryLabel: "Explore Services",
    secondaryHref: "/services",
  },
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
