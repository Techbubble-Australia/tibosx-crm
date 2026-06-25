-- Multi-country job locations (JSON array); legacy location/country/flag kept for compatibility.
ALTER TABLE "JobListing" ADD COLUMN "locations" JSONB;
