/** SiteContent keys: contact_page, legal_pages, case_studies_page, site_footer */

export const contactPagePayload = {
  hero: {
    title: "Let's Build Something Remarkable Together",
    subtitle:
      "Whether you need a single specialist tomorrow or want to discuss a complex enterprise transformation — our team is ready to help within 4 hours.",
  },
  left: {
    pill: "Contact Information",
    title: "We'd Love to Hear From You",
    body: "Our team responds to every enquiry within 4 business hours. For urgent staffing requests, we can mobilise within 24 hours.",
    channels: [
      { icon: "mail" as const, title: "Email Us", content: "hello@techbubble.com.au", href: "mailto:hello@techbubble.com.au" },
      { icon: "phone" as const, title: "Australia", content: "(+61) 1300 934 031", href: "tel:+611300934031" },
      { icon: "phone" as const, title: "USA", content: "+1 (979) 701-2995", href: "tel:+19797012995" },
      { icon: "linkedin" as const, title: "LinkedIn", content: "linkedin.com/company/techbubbleptyltd", href: "https://linkedin.com/company/techbubbleptyltd" },
    ],
    officesPill: "Our Offices",
    offices: [
      { flagEmoji: "🇦🇺", country: "Australia (HQ)", address: "Level 12/16 126 Banks Ave, Eastgardens, Sydney NSW 2000" },
      { flagEmoji: "🇺🇸", country: "USA", address: "1846/1007 N Orange St, WI, DE 19801, USA" },
      { flagEmoji: "🇮🇳", country: "India", address: "K.P. EPITOME Nr. Siddhi Vinayak Tower, Makarba, Ahmedabad, Gujarat 380051" },
      { flagEmoji: "🌏", country: "Philippines - UK - ME", address: "Regional delivery offices across Asia, Europe & Middle East" },
    ],
    businessHours: {
      title: "Business Hours",
      rows: [
        { label: "Monday – Friday", value: "9:00 AM – 5:00 PM" },
        { label: "Saturday – Sunday", value: "Closed" },
        { divider: true as const },
        { label: "Urgent staffing requests", value: "24/7 via email" },
      ],
    },
  },
  form: {
    title: "Send Us a Message",
    subtitle: "Fill in your details and we'll get back to you within 4 business hours.",
    placeholders: {
      firstName: "First Name",
      lastName: "Last Name",
      email: "Work Email *",
      phone: "Phone Number",
      company: "Company Name",
      lookingFor: "What are you looking for?",
      region: "Country / Region",
      message: "Your Message *",
    },
    submitLabel: "Submit Application",
    footerNote:
      "We respond to every enquiry within 4 business hours. Your information is kept strictly confidential.",
  },
  talentCta: {
    title: "Need talent urgently?",
    body: "Our AI-matching engine can shortlist qualified specialists within hours of your request. No waiting, no lengthy procurement process.",
    emailCtaLabel: "Email Us",
    emailHref: "mailto:hello@techbubble.com.au",
    phoneCtaLabel: "(+61) 1300 934 031",
    phoneHref: "tel:+611300934031",
  },
};

export type LegalDocBlock = { heading: string; paragraphs: string[] };

export const legalPagesPayload = {
  privacy: {
    shellTitle: "Privacy Policy",
    lastUpdated: "12 May 2026",
    intro:
      'TechBubble Pty Ltd and affiliated entities ("TechBubble", "we", "us") respect your privacy. This policy describes how we handle personal information when you use our websites, contact forms, and services. It is a summary for transparency; engage qualified counsel before relying on it for compliance decisions.',
    sections: [
      {
        heading: "Information we collect",
        paragraphs: [
          "We may collect identifiers and contact details you provide (name, email, phone, company), enquiry and application content, technical data such as IP address and browser type, and usage data from our sites. Job applications may include resume or portfolio links you submit.",
        ],
      },
      {
        heading: "How we use information",
        paragraphs: [
          "We use this information to respond to enquiries, deliver and improve our services, operate our business, communicate with you, meet legal obligations, and protect our rights. We do not sell your personal information.",
        ],
      },
      {
        heading: "Disclosure",
        paragraphs: [
          "We may share data with service providers who assist our operations (hosting, email, analytics), professional advisers, or authorities where required by law. Cross-border transfers may apply given our global offices.",
        ],
      },
      {
        heading: "Retention & security",
        paragraphs: [
          "We retain information only as long as needed for the purposes above or as required by law. We apply reasonable technical and organisational measures; no method of transmission over the internet is completely secure.",
        ],
      },
      {
        heading: "Your choices",
        paragraphs: [
          "Depending on your location, you may have rights to access, correct, delete, or restrict processing of your personal data, or to object to certain processing. Contact us at hello@techbubble.com.au for requests.",
        ],
      },
      {
        heading: "Changes",
        paragraphs: ['We may update this policy from time to time. The "Last updated" date above reflects the latest revision.'],
      },
    ] satisfies LegalDocBlock[],
  },
  terms: {
    shellTitle: "Terms of Use",
    lastUpdated: "12 May 2026",
    intro:
      "These terms govern your access to TechBubble's public websites and informational content (not a substitute for a signed services agreement). By using our sites, you agree to these terms. If you do not agree, do not use the sites.",
    sections: [
      {
        heading: "Services & information",
        paragraphs: [
          "Site content is for general information. Proposals, statements of work, or master agreements supersede any conflicting description on the website. Availability of talent or timelines on marketing pages are illustrative, not guarantees.",
        ],
      },
      {
        heading: "Acceptable use",
        paragraphs: [
          "You must not misuse our sites (including attempting unauthorised access, introducing malware, scraping in breach of robots.txt or rate limits, or using our brand in a misleading way). We may suspend access where necessary to protect our systems or users.",
        ],
      },
      {
        heading: "Intellectual property",
        paragraphs: [
          "TechBubble and its licensors own trademarks, logos, and site content unless otherwise noted. You may not copy, modify, or distribute our materials without prior written permission, except for fair personal use or as permitted by law.",
        ],
      },
      {
        heading: "Disclaimer",
        paragraphs: [
          'Sites and content are provided "as is" without warranties to the extent permitted by law. We are not liable for indirect or consequential loss arising from use of the sites.',
        ],
      },
      {
        heading: "Governing law",
        paragraphs: [
          "These terms are governed by the laws applicable in New South Wales, Australia, subject to mandatory consumer protections in your jurisdiction.",
        ],
      },
      {
        heading: "Contact",
        paragraphs: ["Questions about these terms: hello@techbubble.com.au."],
      },
    ] satisfies LegalDocBlock[],
  },
  cookies: {
    shellTitle: "Cookie Notice",
    lastUpdated: "12 May 2026",
    intro:
      "This notice explains how TechBubble uses cookies and similar technologies on our websites. It should be read together with our ",
    privacyPolicyLink: { label: "Privacy Policy", href: "/privacy" },
    introAfterLink: " document.",
    sections: [
      {
        heading: "What are cookies?",
        paragraphs: [
          "Cookies are small text files stored on your device when you visit a site. They help the site function, remember preferences, measure performance, or support security.",
        ],
      },
      {
        heading: "How we use them",
        paragraphs: [
          "We may use strictly necessary cookies (e.g. security, load balancing), functional cookies (e.g. language or session choices), and analytics cookies to understand aggregate traffic and improve our marketing sites. Specific names and lifetimes depend on the tools we deploy and may change as we update our stack.",
        ],
      },
      {
        heading: "Your choices",
        paragraphs: [
          "You can control cookies through your browser settings (block, delete, or alert). Blocking some cookies may affect site behaviour. For analytics, industry opt-out tools may be available depending on the provider we use.",
        ],
      },
      {
        heading: "Updates",
        paragraphs: ["We may revise this notice when our practices or regulations change. Check the last updated date on this page."],
      },
      {
        heading: "Contact",
        paragraphs: ["Privacy-related questions: hello@techbubble.com.au."],
      },
    ] satisfies LegalDocBlock[],
  },
};

export const caseStudiesPagePayload = {
  hero: {
    title: "Real Results for Real Enterprises",
    subtitle:
      "From government-scale ServiceNow transformations to Salesforce CRM overhauls — see how TechBubble delivers measurable outcomes across industries and platforms.",
  },
  statsStrip: {
    blurb:
      "Deep-dives into how TechBubble has helped enterprises across Asia Pacific and North America transform their technology operations — with measurable outcomes.",
    stats: [
      { value: "200+", label: "Clients served" },
      { value: "500+", label: "Projects delivered" },
      { value: "98%", label: "Satisfaction rate" },
    ],
  },
  practiceSection: {
    pill: "Our Work",
    titleLine1: "Case Studies by Practice",
    titleLine2: "",
    subtitle: "Explore how we've helped leading enterprises transform operations, reduce costs, and accelerate growth.",
    categories: ["All", "ServiceNow", "Salesforce", "MuleSoft", "SharePoint", "Staffing"],
  },
  emptyState: {
    title: "No published case studies yet",
    body: "Content comes from the API (GET /api/case-studies). Publish case studies in the admin app and ensure API_URL is set for this site.",
    ctaLabel: "Talk to us",
    ctaHref: "/contact",
  },
  expertiseSection: {
    pill: "Our Practice Areas",
    titleLine1: "Deep Expertise Across 5 Platform",
    titleLine2: "Practices",
    subtitle:
      "We've built a culture where talented people do the best work of their careers — and have fun doing it.",
    tiles: [
      {
        iconKey: "Zap" as const,
        title: "ServiceNow",
        description:
          "Cross-functional teams working across geographies, sharing knowledge and lifting each other up.",
        exploreLabel: "Explore Practice",
      },
      {
        iconKey: "Workflow" as const,
        title: "Salesforce",
        description:
          "Comprehensive implementation across Sales, Service, Marketing, Commerce, Health & Education Cloud — plus Omnistudio and Vlocity.",
        exploreLabel: "Explore Practice",
      },
      {
        iconKey: "Share2" as const,
        title: "MuleSoft",
        description:
          "Expert API-led integration services covering Anypoint Platform, API management, cloud-based solutions, and B2B integrations.",
        exploreLabel: "Explore Practice",
      },
      {
        iconKey: "FileStack" as const,
        title: "SharePoint",
        description:
          "SharePoint Online, Server & Power Platform integrations — collaboration, document management, and workflow automation.",
        exploreLabel: "Explore Practice",
      },
      {
        iconKey: "Braces" as const,
        title: "Custom & AI Apps",
        description:
          "Java, D365, React, Mobile (iOS/Android), AI/ML, Python — custom solutions built to your exact requirements.",
        exploreLabel: "Explore Practice",
      },
    ],
    ctaTile: {
      title: "Ready to be our next success story?",
      body: "Let's discuss your requirements and how we can deliver measurable results for your enterprise.",
      buttonLabel: "Talk to Us",
      buttonHref: "/contact",
    },
  },
  bottomCta: {
    title: "Ready to write your own success story?",
    description: "Tell us about your challenge and we'll show you how TechBubble can deliver measurable results.",
    primaryLabel: "Start a Conversation",
    primaryHref: "/contact",
    secondaryLabel: "Explore Services",
    secondaryHref: "/services",
  },
};

/** ISO-style codes matching `apps/web/public/flags/{code}.svg` */
export const SITE_FOOTER_FLAG_CODES = ["au", "us", "in", "ph", "gb", "ae"] as const;
export type SiteFooterFlagCode = (typeof SITE_FOOTER_FLAG_CODES)[number];

export const siteFooterPayload = {
  tagline: "AI-driven digital transformation across Asia Pacific and North America. Top 1% tech talent, deployed fast.",
  social: [
    { href: "#", label: "LinkedIn" as const },
    { href: "#", label: "Facebook" as const },
    { href: "#", label: "Instagram" as const },
  ],
  companyLinks: [
    { href: "/", label: "Home" },
    { href: "/about", label: "About Us" },
    { href: "/services", label: "Services" },
    { href: "/pricing", label: "Pricing" },
    { href: "/careers", label: "Careers" },
    { href: "/case-studies", label: "Case Studies" },
    { href: "/contact", label: "Contact" },
  ],
  serviceLinks: [
    { href: "/services", label: "Staff Augmentation" },
    { href: "/services", label: "Project Delivery" },
    { href: "/services", label: "Product Engineering" },
    { href: "/services", label: "ServiceNow" },
    { href: "/services", label: "Salesforce" },
    { href: "/services", label: "MuleSoft" },
  ],
  officesHeading: "Our Offices",
  offices: [
    {
      flagCode: "au" as const,
      region: "Australia (HQ)",
      entity: "Techbubble Pty Ltd",
      address: "16/126 Banks Ave, Eastgardens, Sydney NSW 2000",
    },
    {
      flagCode: "us" as const,
      region: "USA",
      entity: "Techbubble USA Inc.",
      address: "1846/1007 N Orange St, WL, De 19801, USA",
    },
    {
      flagCode: "in" as const,
      region: "India",
      entity: "Techbubble India Pvt LtD",
      address:
        "Office 713, K.P. EPITOME Nr. Siddhi Vinayak Tower, Nr. DAV School, MaKarba, Ahmedabad, Gujarat India 380051",
    },
  ],
  contactInfoHeading: "Contact Info",
  contactLines: [
    { kind: "mailto" as const, display: "hello@techbubble.com.au", href: "mailto:hello@techbubble.com.au" },
    { kind: "tel" as const, display: "USA: +1 (979)-701-2995", href: "tel:+19797012995" },
    { kind: "tel" as const, display: "Australia: (+61) 1300 934 031", href: "tel:+611300934031" },
  ],
  hoursLine: "Mon–Fri: 9AM – 5PM AEST",
  copyright: "© 2026 TechBubble Pty Ltd · All Rights Reserved",
};
