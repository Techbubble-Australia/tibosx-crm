import { ClientsListPage } from "@/components/clients/ClientsListPage";

export default function ActiveClientsPage() {
  return (
    <ClientsListPage
      statusFilter="ACTIVE"
      heading="Active Clients"
      description="Clients currently engaged or ready for job listings."
    />
  );
}
