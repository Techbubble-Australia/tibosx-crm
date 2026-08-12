import { JobsListPage } from "@/components/jobs/JobsListPage";

export default function ActiveJobsPage() {
  return (
    <JobsListPage
      publishedFilter
      heading="Active job listings"
      description="Published roles visible on the careers site."
    />
  );
}
