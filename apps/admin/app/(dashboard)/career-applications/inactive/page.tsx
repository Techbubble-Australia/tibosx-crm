import { CareerApplicationsList } from "@/components/jobs/CareerApplicationsList";

export default function InactiveCareerApplicationsPage() {
  return <CareerApplicationsList jobPublished={false} />;
}
