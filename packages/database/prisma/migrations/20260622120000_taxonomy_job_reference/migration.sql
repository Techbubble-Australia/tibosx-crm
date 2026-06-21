-- Case study subcategory
ALTER TABLE "CaseStudy" ADD COLUMN "subcategory" TEXT NOT NULL DEFAULT '';

-- Case study taxonomy tables
CREATE TABLE "CaseStudyCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CaseStudyCategory_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CaseStudySubcategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CaseStudySubcategory_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CaseStudyCategory_name_key" ON "CaseStudyCategory"("name");
CREATE INDEX "CaseStudyCategory_order_idx" ON "CaseStudyCategory"("order");
CREATE UNIQUE INDEX "CaseStudySubcategory_categoryId_name_key" ON "CaseStudySubcategory"("categoryId", "name");
CREATE INDEX "CaseStudySubcategory_categoryId_idx" ON "CaseStudySubcategory"("categoryId");
CREATE INDEX "CaseStudySubcategory_order_idx" ON "CaseStudySubcategory"("order");

ALTER TABLE "CaseStudySubcategory" ADD CONSTRAINT "CaseStudySubcategory_categoryId_fkey"
    FOREIGN KEY ("categoryId") REFERENCES "CaseStudyCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Job taxonomy tables
CREATE TABLE "JobCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "JobCategory_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "JobDepartment" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "JobDepartment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "JobCategory_name_key" ON "JobCategory"("name");
CREATE INDEX "JobCategory_order_idx" ON "JobCategory"("order");
CREATE UNIQUE INDEX "JobDepartment_name_key" ON "JobDepartment"("name");
CREATE INDEX "JobDepartment_order_idx" ON "JobDepartment"("order");

-- Job listing: category, reference number
ALTER TABLE "JobListing" ADD COLUMN "category" TEXT NOT NULL DEFAULT '';
ALTER TABLE "JobListing" ADD COLUMN "referenceNumber" TEXT;

-- Backfill reference numbers for existing jobs (ordered by createdAt)
WITH numbered AS (
    SELECT id, ROW_NUMBER() OVER (ORDER BY "createdAt" ASC) AS rn
    FROM "JobListing"
)
UPDATE "JobListing" j
SET "referenceNumber" = 'JRN' || LPAD(n.rn::text, 3, '0')
FROM numbered n
WHERE j.id = n.id;

ALTER TABLE "JobListing" ALTER COLUMN "referenceNumber" SET NOT NULL;
CREATE UNIQUE INDEX "JobListing_referenceNumber_key" ON "JobListing"("referenceNumber");
CREATE INDEX "JobListing_category_idx" ON "JobListing"("category");
CREATE INDEX "JobListing_department_idx" ON "JobListing"("department");
