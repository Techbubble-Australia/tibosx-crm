/**
 * Serializable homepage content seeded into SiteContent.marketing_home.
 * Image fields use keys resolved via HOME_IMAGE_MAP in the client bundle.
 */
export const marketingHomePayload = {
  hero: {
    pillLeft: "NEW",
    pillRight: "AI-matched talent placement in 24–48 hrs",
    title: "We Deliver World-Class Digital Transformations powered by AI",
    subtitle:
      "AI-driven digital transformation across Asia Pacific and North America — connecting ambitious enterprises with the top 1% of platform talent, fast.",
    trustChips: [
      "Onboard in <24 hours",
      "Timezone Aligned",
      "Beat-any-quote guarantee",
      "24/7 support included",
    ],
    socialProof: {
      initials: ["TY", "SC", "TL", "PP", "+"],
      clientLabel: "50+ enterprises served",
      ratingLabel: "4.7 avg. rating",
      availableLabel: "Available now",
    },
  },
  statsStrip: {
    pill: "THE RAPIDLY GROWING COMPANY",
    title: "Transforming Today's Enterprises for Tomorrow's Innovation",
    items: [
      { n: "150+", l: "Tech Specialists Globally" },
      { n: "50+", l: "Enterprise Clients" },
      { n: "6", l: "Global Offices" },
      { n: "98%", l: "Client Satisfaction Rate" },
    ],
  },
  featuredPartners: [
    { id: "vic", imageKey: "home_1", imageClass: "w-[193px]" },
    { id: "qld", imageKey: "home_2", imageClass: "w-[220px]" },
    { id: "sn", imageKey: "home_3", imageClass: "w-[208px]" },
    { id: "mule", imageKey: "home_4", imageClass: "w-[204px]" },
    { id: "sfdc", imageKey: "home_5", imageClass: "w-[177px]" },
  ],
  trustedLogos: [
    { name: "Standard Chartered", imageKey: "home_6", width: 174, height: 68 },
    { name: "VHA Home HealthCare", imageKey: "home_7", width: 160, height: 68 },
    { name: "US Foods", imageKey: "home_8", width: 72, height: 78 },
    { name: "Toyota", imageKey: "home_9", width: 150, height: 40 },
    { name: "University of Sydney", imageKey: "home_10", width: 150, height: 60 },
    { name: "CRMIT", imageKey: "home_11", width: 128, height: 55 },
    { name: "HDFC Bank", imageKey: "home_12", width: 224, height: 56 },
    { name: "Tech Mahindra", imageKey: "home_13", width: 117, height: 80 },
    { name: "FINXL", imageKey: "home_14", width: 150, height: 56 },
    { name: "Endeavour Energy", imageKey: "home_15", width: 170, height: 64 },
    { name: "Oracle", imageKey: "home_23", width: 150, height: 48 },
  ],
  engagement: {
    header: {
      pill: "OUR SERVICES",
      titleLine1: "End-to-end delivery, ",
      titleLine2: "every engagement model",
      subtitle:
        "Whether you need a single specialist or an entire product team, we have the model that fits - AI-matched, timezone-aligned, and ready in hours.",
    },
    models: [
      {
        id: "staff",
        navLabel: "STAFFING SERVICES",
        label: "AI-Infused Staff Augmentation",
        bulletListStyle: "feature_icons" as const,
        description:
          "Our Time & Material-based model deploys rigorously vetted specialists directly into your team — within one business day. We use AI to match the exact skill profile, experience level, and timezone to your requirements.",
        bullets: ["Lightning Onboarding", "Top 1% Talent Only", "Timezone Aligned", "No Lock-in"],
        tags: [
          "ServiceNow",
          "Salesforce",
          "MuleSoft",
          "SharePoint",
          "Snowflake",
          "Power BI",
          "React",
          "Java",
          "AI/ML",
          "AWS/Azure",
        ],
      },
      {
        id: "delivery",
        navLabel: "PROJECT DELIVERY",
        label: "Project Delivery",
        bulletListStyle: "checkboxes" as const,
        description:
          "Fixed-scope programmes with defined milestones — discovery, build, test, and hypercare — predictable delivery without compromising quality.\n\nDiscovery-led: We start with a deep-dive into your requirements to ensure the right solution from day one.\nMilestone billing: Transparent, milestone-based payments for predictable budgeting.\nGovernance built in: Every project is managed with rigorous oversight and quality controls.\nKnowledge transfer: We ensure your team is fully enabled for long-term success.",
        bullets: [
          "Discovery-led",
          "Milestone billing",
          "Governance built in",
          "Knowledge transfer"
        ],
        tags: ["ITSM", "CSM", "Integrations", "CRM", "Custom apps", "QA", "DevOps"],
      },
      {
        id: "product",
        navLabel: "PRODUCT ENGINEERING",
        label: "Product Engineering",
        bulletListStyle: "checkboxes" as const,
        description:
          "Outcome-based product pods — design, build, and run modern applications on your stack with clear ownership from roadmap to production.",
        bullets: [
          "Product trio",
          "CI/CD embedded",
          "Observability",
          "Continuous delivery"
        ],
        tags: ["React", "Node", "Java", "AWS", "Azure", "Kubernetes", "Data", "AI/ML"],
      },
    ],
    helpCard: {
      title: "Not sure which fits?",
      body: "Talk to our solutions team - we'll find the\nright engagement model for your needs.",
      ctaLabel: "Book a Free Call",
    },
  },
  howItWorks: {
    pill: "How It Works",
    title: "From first call to go-live in 4 steps",
    subtitle:
      "We've stripped out every unnecessary step so you can focus on building, not bureaucracy.",
    steps: [
      {
        title: "Book a Free Call",
        body: "Zero commitment. Talk through your requirements, timeline, and budget with our solutions team — we'll listen first, advise second.",
        icon: "PhoneCall",
      },
      {
        title: "Get a Tailored Quote",
        body: "Receive a detailed, fixed-price or T&M proposal within 1–2 business days. No ambiguity — every cost line is explained clearly.",
        icon: "FileText",
      },
      {
        title: "Confirm & Kickoff",
        body: "AI-matched team assembled in under 24 hours. A smooth, structured kickoff makes sure everyone is aligned from the very first day.",
        icon: "Rocket",
      },
      {
        title: "Deliver & Support",
        body: "We ship on time, on budget — then stay with you. 24/7 post-launch governance ensures your systems run flawlessly,long-term.",
        icon: "ShieldCheck",
      },
    ],
  },
  platformsIntro: {
    pill: "SOLUTIONS BY TECHNOLOGY",
    title: "Multi-Platform Expertise",
    subtitle:
      "Whether you need end-to-end implementation, integration, or specialist talent — we deliver certified expertise across the platforms that power enterprise business.",
  },
  platforms: [
    {
      id: "servicenow",
      name: "ServiceNow",
      headline: "Unlock the full power of\nServiceNow your Enterprise",
      body: "TechBubble offers end-to-end ServiceNow implementation, testing, and support services to help organisations unlock the full potential of the ServiceNow platform — from IT Service Management to HR Service Delivery, Customer Service Management, and custom applications.",
      features: [
        { title: "IT Service Management (ITSM)", sub: "Incident, problem, change, and request management across your enterprise" },
        { title: "SecOps, GRC & ITOM", sub: "Security operations, risk management, and IT operations in one unified platform" },
        { title: "HR Service Delivery (HRSD) & CSM", sub: "Streamline HR workflows and deliver world-class customer service experiences" },
      ],
      ctaLabel: "Explore ServiceNow Solutions",
      cardTitle: "ServiceNow Expertise",
      cardSubtitle: "Certified specialists · All modules",
      stats: [
        { value: "35+", label: "Certified engineers" },
        { value: "20+", label: "Projects delivered" },
        { value: "100%", label: "Client satisfaction" },
      ],
      tags: ["ITSM", "ITOM", "SecOps", "GRC", "HRSD", "CSM", "Portal", "Custom Apps", "CMDB", "ITAM"],
    },
    {
      id: "salesforce",
      name: "Salesforce",
      headline: "Sales, Service & Industry Clouds —\nimplemented the right way",
      body: "TechBubble delivers Salesforce implementations across Sales Cloud, Service Cloud, and Einstein — helping organisations accelerate revenue operations and deliver personalised customer experiences at scale.",
      features: [
        { title: "Sales & Service Cloud", sub: "Lead-to-close, case management, and omnichannel service delivery" },
        { title: "Einstein & Automation", sub: "AI-powered forecasting, scoring, and workflow automation" },
        { title: "Experience Cloud & CPQ", sub: "Partner portals, self-service, and configure-price-quote solutions" },
      ],
      ctaLabel: "Explore Salesforce Solutions",
      cardTitle: "Salesforce Expertise",
      cardSubtitle: "Certified specialists · All clouds",
      stats: [
        { value: "25+", label: "Certified experts" },
        { value: "15+", label: "Projects delivered" },
        { value: "100%", label: "Client satisfaction" },
      ],
      tags: ["Sales Cloud", "Service Cloud", "Experience Cloud", "CPQ", "Einstein", "Automation", "Data Cloud"],
    },
    {
      id: "mulesoft",
      name: "MuleSoft",
      headline: "Integration, APIs & data —\nconnected and governed",
      body: "TechBubble architects and delivers MuleSoft integration solutions that connect your enterprise systems, expose governed APIs, and unlock data across your organisation — from ERP to cloud SaaS.",
      features: [
        { title: "API-led Connectivity", sub: "Experience, process, and system layer API design and build" },
        { title: "Enterprise Integration", sub: "ERP, CRM, cloud, and legacy system integration at scale" },
        { title: "DataWeave & Monitoring", sub: "Advanced transformation, observability, and platform-ops support" },
      ],
      ctaLabel: "Explore MuleSoft Solutions",
      cardTitle: "MuleSoft Expertise",
      cardSubtitle: "Certified architects · All tiers",
      stats: [
        { value: "20+", label: "Certified experts" },
        { value: "12+", label: "Projects delivered" },
        { value: "100%", label: "Client satisfaction" },
      ],
      tags: ["Anypoint Platform", "API Gateway", "DataWeave", "CloudHub", "RTF", "Event-Driven", "EDI"],
    },
    {
      id: "sharepoint",
      name: "SharePoint",
      headline: "Collaboration, intranets &\ncontent management at scale",
      body: "TechBubble builds and modernises SharePoint environments — from intranet portals and document management to governance frameworks and Microsoft 365 integration — delivering user adoption and measurable collaboration outcomes.",
      features: [
        { title: "Intranet & Portals", sub: "Modern communication sites, departmental hubs, and branded intranets" },
        { title: "Document & Records Management", sub: "Retention policies, metadata taxonomy, and compliance workflows" },
        { title: "M365 Integration & Governance", sub: "Teams, OneDrive, Power Automate, and enterprise governance frameworks" },
      ],
      ctaLabel: "Explore SharePoint Solutions",
      cardTitle: "SharePoint Expertise",
      cardSubtitle: "Certified specialists · All versions",
      stats: [
        { value: "18+", label: "Certified experts" },
        { value: "10+", label: "Projects delivered" },
        { value: "100%", label: "Client satisfaction" },
      ],
      tags: ["Modern SharePoint", "SPFx", "Power Automate", "Teams", "OneDrive", "M365", "Governance"],
    },
    {
      id: "other",
      name: "Other Technologies",
      headline: "More platforms, one trusted\ndelivery partner",
      body: "Beyond specialised platforms, TechBubble delivers outcomes across a wide range of enterprise technologies — cloud infrastructure, data & analytics, custom development, and QA automation.",
      features: [
        { title: "Cloud Infrastructure", sub: "AWS, Azure, and GCP — architecture, migration, and managed operations" },
        { title: "Data & Analytics", sub: "Snowflake, Power BI, and modern data warehousing for actionable insight" },
        { title: "Custom Development & QA", sub: "React, Java, Node, Kubernetes, and automated testing frameworks" },
      ],
      ctaLabel: "Explore All Solutions",
      cardTitle: "Full-Stack Expertise",
      cardSubtitle: "Certified specialists · All technologies",
      stats: [
        { value: "100+", label: "Certified experts" },
        { value: "400+", label: "Projects delivered" },
        { value: "100%", label: "Client satisfaction" },
      ],
      tags: ["AWS", "Azure", "Snowflake", "Power BI", "React", "Java", "Kubernetes", "QA", "DevOps"],
    },
  ],
  journey: {
    header: {
      pill: "The TechBubble Advantage",
      titleLine1: "Your journey from request",
      titleLine2: "to results — broken down",
      subtitle:
        "Five steps. One trusted partner. See exactly how TechBubble turns a talent or technology request into measurable outcomes — faster and more transparently than any traditional model.",
    },
    steps: [
      {
        num: "01",
        category: "SPEED & SCALE",
        title: "Submit your request",
        badgeLabel: "Step 01 — Speed & Scale",
        heading: "You submit a request.\nWe start matching in hours.",
        body: "Traditional hiring takes weeks of job posts, screeners, and interviews. Our AI-matching engine identifies the ideal candidate profile within hours of your request — pre-vetted, certified, and timezone-aligned.",
        stats: [
          { value: "<4h", label: "First shortlist delivered" },
          { value: "70%", label: "Faster than traditional hiring" },
          { value: "150+", label: "Specialists ready now" },
        ],
        features: [
          { title: "AI-powered matching", sub: "Automated skills, timezone & culture fit scoring" },
          { title: "Pre-vetted only", sub: "Multi-stage technical vetting before any proposal" },
          { title: "Timezone Aligned", sub: "Resources matched to your exact working hours" },
          { title: "Scale anytime", sub: "No minimum contract — flex up or down freely" },
        ],
        cta: "Submit a request",
        ctaNote: "Response within 4 hours, guaranteed",
      },
      {
        num: "02",
        category: "CANDIDATE SELECTION",
        title: "Choose your specialist",
        badgeLabel: "Step 02 — Candidate Selection",
        heading: "Review shortlist.\nPick who you want.",
        body: "You receive a curated shortlist of pre-vetted specialists who match your exact requirements — skills, experience, timezone, and cultural fit. Review profiles and conduct a quick intro call before you commit.",
        stats: [
          { value: "3–5", label: "Candidates per shortlist" },
          { value: "100%", label: "Pre-vetted profiles" },
          { value: "48h", label: "Shortlist turnaround" },
        ],
        features: [
          { title: "Curated shortlists", sub: "Only the best-matched profiles for your request" },
          { title: "Intro calls included", sub: "Meet candidates before you make a decision" },
          { title: "Skills verified", sub: "Technical assessments completed before proposal" },
          { title: "No commitment", sub: "Review and decide with zero pressure" },
        ],
        cta: "Submit a request",
        ctaNote: "Response within 4 hours, guaranteed",
      },
      {
        num: "03",
        category: "ONBOARDING",
        title: "Productive in 24 hours",
        badgeLabel: "Step 03 — Onboarding",
        heading: "Signed today.\nDelivering tomorrow.",
        body: "Our structured onboarding playbook gets your specialist integrated into your team fast — access provisioned, tools configured, and your first standup completed within 24 hours of contract sign.",
        stats: [
          { value: "24h", label: "From sign to first delivery" },
          { value: "100%", label: "Governance embedded" },
          { value: "0", label: "Disruption to your team" },
        ],
        features: [
          { title: "Lightning Onboarding", sub: "Access provisioned and tools configured in hours" },
          { title: "Governance built in", sub: "Delivery standards enforced from day one" },
          { title: "Team integration", sub: "Standup, docs, and comms channels set up immediately" },
          { title: "Knowledge transfer", sub: "Structured docs ensure continuity at any time" },
        ],
        cta: "Submit a request",
        ctaNote: "Response within 4 hours, guaranteed",
      },
      {
        num: "04",
        category: "DELIVERY & GOVERNANCE",
        title: "On-time. On-budget.",
        badgeLabel: "Step 04 — Delivery & Governance",
        heading: "Predictable delivery.\nFull transparency.",
        body: "Weekly reporting, milestone tracking, and proactive risk management keep your project on track. You get full visibility into progress with no surprises — and a dedicated account manager who genuinely cares.",
        stats: [
          { value: "98%", label: "On-time delivery rate" },
          { value: "Weekly", label: "Progress reports" },
          { value: "24/7", label: "Support availability" },
        ],
        features: [
          { title: "Weekly reporting", sub: "Progress, risks, and milestones at every step" },
          { title: "Milestone billing", sub: "You only pay when deliverables are met" },
          { title: "Dedicated AM", sub: "A single point of accountability throughout" },
          { title: "Risk management", sub: "Issues flagged and resolved before they escalate" },
        ],
        cta: "Submit a request",
        ctaNote: "Response within 4 hours, guaranteed",
      },
      {
        num: "05",
        category: "TECHNOLOGY DEPTH",
        title: "18+ certified platforms",
        badgeLabel: "Step 05 — Technology Depth",
        heading: "Deep expertise across\n18+ enterprise platforms.",
        body: "From ServiceNow to Salesforce, MuleSoft to Azure — our certified specialists bring deep platform knowledge and real-world delivery experience across the full enterprise technology stack.",
        stats: [
          { value: "18+", label: "Certified platforms" },
          { value: "150+", label: "Certified specialists" },
          { value: "10+", label: "Years of delivery" },
        ],
        features: [
          { title: "Certified specialists", sub: "Platform-certified across every major technology" },
          { title: "Real-world delivery", sub: "Hands-on project experience, not just certificates" },
          { title: "Full stack coverage", sub: "Frontend, backend, data, cloud, and integration" },
          { title: "Continuous learning", sub: "Teams stay current with every platform release" },
        ],
        cta: "Submit a request",
        ctaNote: "Response within 4 hours, guaranteed",
      },
    ],
  },
  faqAside: {
    blurb:
      "Can't find what you're looking for? Our team is happy to answer any questions directly.",
    ctaLabel: "Talk to us",
  },
  careersBand: {
    pill: "We're Hiring",
    title: "Join Our Global Team of Tech Innovators",
    subtitle:
      "Work on enterprise-scale projects alongside world-class engineers and AI specialists. Remote-friendly roles across Australia, India, Philippines, USA and beyond.",
    browseCta: "Browse Open Roles",
    viewAllLabel: "View all open positions",
  },
  scheduleDemo: {
    pill: "GET STARTED TODAY",
    title: "Schedule a Free Demo\nwith Our Experts",
    subtitle:
      "Book a no-obligation consultation and discover exactly how TechBubble can accelerate your next initiative — talent, technology, or transformation.",
    primaryCta: "Book a Free Demo",
    secondaryCta: "View Pricing",
    bullets: ["Response within 24 hours", "Free consultation call", "Zero obligation"],
  },
  careersCta: {
    title: "Ready to build your dream team in under 24 hours?",
    subtitle:
      "Join 50+ enterprises who trust TechBubble to power their most critical\ntechnology initiatives.",
    bullets: ["No commitment required", "Response within 2 hours", "Free consultation"],
  },
  faqItems: [
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
} as const;

export type MarketingHomePayload = typeof marketingHomePayload;
