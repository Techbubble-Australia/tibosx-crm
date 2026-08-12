import { JobsListPage } from "@/components/jobs/JobsListPage";

export default function InactiveJobsPage() {
  return (
    <JobsListPage
      publishedFilter={false}
      heading="Inactive job listings"
      description="Unpublished roles moved here automatically when unpublished."
    />
  );
}
