import { ClientsListPage } from "@/components/clients/ClientsListPage";

export default function InactiveClientsPage() {
  return (
    <ClientsListPage
      statusFilter="INACTIVE"
      heading="Inactive Clients"
      description="Clients no longer active in the pipeline."
    />
  );
}
