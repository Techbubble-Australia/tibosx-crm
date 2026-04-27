-- Baseline: full schema (fresh PostgreSQL). Replaces prior migration that only ALTERed CaseStudy,
-- which fails when the database has no tables yet.
--
-- If migrate deploy failed before with P3018, recover on that database:
--   npx prisma migrate resolve --rolled-back 20260427120000_add_case_study_featured
-- then run: pnpm db:deploy

-- CreateTable
CREATE TABLE "CaseStudy" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "clientName" TEXT NOT NULL,
    "heroStat1Value" TEXT NOT NULL,
    "heroStat1Label" TEXT NOT NULL,
    "heroStat2Value" TEXT NOT NULL,
    "heroStat2Label" TEXT NOT NULL,
    "heroStat3Value" TEXT NOT NULL,
    "heroStat3Label" TEXT NOT NULL,
    "featuredImage" TEXT NOT NULL,
    "backgroundTitle" TEXT NOT NULL,
    "backgroundContent" TEXT NOT NULL,
    "challengeTitle" TEXT NOT NULL,
    "challengeContent" TEXT NOT NULL,
    "challengeStat1Value" TEXT NOT NULL,
    "challengeStat1Label" TEXT NOT NULL,
    "challengeStat2Value" TEXT NOT NULL,
    "challengeStat2Label" TEXT NOT NULL,
    "challengeStat3Value" TEXT NOT NULL,
    "challengeStat3Label" TEXT NOT NULL,
    "problem1Title" TEXT NOT NULL,
    "problem1Content" TEXT NOT NULL,
    "problem2Title" TEXT NOT NULL,
    "problem2Content" TEXT NOT NULL,
    "problem3Title" TEXT NOT NULL,
    "problem3Content" TEXT NOT NULL,
    "problem4Title" TEXT NOT NULL,
    "problem4Content" TEXT NOT NULL,
    "solutionTitle" TEXT NOT NULL,
    "solutionContent" TEXT NOT NULL,
    "phase1Title" TEXT NOT NULL,
    "phase1Duration" TEXT NOT NULL,
    "phase1Content" TEXT NOT NULL,
    "phase1Tags" TEXT[],
    "phase2Title" TEXT NOT NULL,
    "phase2Duration" TEXT NOT NULL,
    "phase2Content" TEXT NOT NULL,
    "phase2Tags" TEXT[],
    "phase3Title" TEXT NOT NULL,
    "phase3Duration" TEXT NOT NULL,
    "phase3Content" TEXT NOT NULL,
    "phase3Tags" TEXT[],
    "phase4Title" TEXT,
    "phase4Duration" TEXT,
    "phase4Content" TEXT,
    "phase4Tags" TEXT[],
    "techStackTitle" TEXT NOT NULL,
    "techStackIntro" TEXT NOT NULL,
    "tech1Name" TEXT NOT NULL,
    "tech1Description" TEXT NOT NULL,
    "tech1Icon" TEXT NOT NULL,
    "tech2Name" TEXT NOT NULL,
    "tech2Description" TEXT NOT NULL,
    "tech2Icon" TEXT NOT NULL,
    "tech3Name" TEXT NOT NULL,
    "tech3Description" TEXT NOT NULL,
    "tech3Icon" TEXT NOT NULL,
    "tech4Name" TEXT NOT NULL,
    "tech4Description" TEXT NOT NULL,
    "tech4Icon" TEXT NOT NULL,
    "tech5Name" TEXT NOT NULL,
    "tech5Description" TEXT NOT NULL,
    "tech5Icon" TEXT NOT NULL,
    "tech6Name" TEXT NOT NULL,
    "tech6Description" TEXT NOT NULL,
    "tech6Icon" TEXT NOT NULL,
    "testimonialQuote" TEXT NOT NULL,
    "testimonialAuthorName" TEXT NOT NULL,
    "testimonialAuthorTitle" TEXT NOT NULL,
    "testimonialAuthorCompany" TEXT NOT NULL,
    "testimonialAuthorInitials" TEXT NOT NULL,
    "resultsTitle" TEXT NOT NULL,
    "resultsContent" TEXT NOT NULL,
    "resultStat1Value" TEXT NOT NULL,
    "resultStat1Label" TEXT NOT NULL,
    "resultStat2Value" TEXT NOT NULL,
    "resultStat2Label" TEXT NOT NULL,
    "resultStat3Value" TEXT NOT NULL,
    "resultStat3Label" TEXT NOT NULL,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CaseStudy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContactSubmission" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "company" TEXT,
    "interest" TEXT,
    "country" TEXT,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContactSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CareerApplication" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "position" TEXT NOT NULL,
    "company" TEXT,
    "resumeUrl" TEXT,
    "message" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CareerApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobListing" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "flag" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "workMode" TEXT NOT NULL,
    "department" TEXT NOT NULL DEFAULT 'Engineering',
    "description" TEXT NOT NULL DEFAULT '',
    "published" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobListing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamMember" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL DEFAULT '',
    "order" INTEGER NOT NULL DEFAULT 0,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeamMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Testimonial" (
    "id" TEXT NOT NULL,
    "quote" TEXT NOT NULL,
    "authorName" TEXT NOT NULL,
    "authorTitle" TEXT NOT NULL,
    "authorCompany" TEXT NOT NULL,
    "authorInitials" TEXT NOT NULL,
    "authorImageUrl" TEXT NOT NULL DEFAULT '',
    "order" INTEGER NOT NULL DEFAULT 0,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Testimonial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FaqItem" (
    "id" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'general',
    "order" INTEGER NOT NULL DEFAULT 0,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FaqItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CaseStudy_slug_key" ON "CaseStudy"("slug");

-- CreateIndex
CREATE INDEX "CaseStudy_category_idx" ON "CaseStudy"("category");

-- CreateIndex
CREATE INDEX "CaseStudy_published_idx" ON "CaseStudy"("published");

-- CreateIndex
CREATE INDEX "CaseStudy_featured_idx" ON "CaseStudy"("featured");

-- CreateIndex
CREATE INDEX "CaseStudy_createdAt_idx" ON "CaseStudy"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "JobListing_slug_key" ON "JobListing"("slug");

-- CreateIndex
CREATE INDEX "JobListing_published_idx" ON "JobListing"("published");

-- CreateIndex
CREATE INDEX "JobListing_order_idx" ON "JobListing"("order");

-- CreateIndex
CREATE INDEX "TeamMember_department_idx" ON "TeamMember"("department");

-- CreateIndex
CREATE INDEX "TeamMember_published_idx" ON "TeamMember"("published");

-- CreateIndex
CREATE INDEX "TeamMember_order_idx" ON "TeamMember"("order");

-- CreateIndex
CREATE INDEX "Testimonial_published_idx" ON "Testimonial"("published");

-- CreateIndex
CREATE INDEX "Testimonial_order_idx" ON "Testimonial"("order");

-- CreateIndex
CREATE INDEX "FaqItem_category_idx" ON "FaqItem"("category");

-- CreateIndex
CREATE INDEX "FaqItem_published_idx" ON "FaqItem"("published");

-- CreateIndex
CREATE INDEX "FaqItem_order_idx" ON "FaqItem"("order");
