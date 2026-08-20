import { CareerApplicationsList } from "@/components/jobs/CareerApplicationsList";

export default function ActiveCareerApplicationsPage() {
  return <CareerApplicationsList jobPublished={true} />;
}
