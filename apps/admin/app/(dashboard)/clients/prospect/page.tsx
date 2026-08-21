import { ClientsListPage } from "@/components/clients/ClientsListPage";

export default function ProspectClientsPage() {
  return (
    <ClientsListPage
      statusFilter="PROSPECT"
      heading="Prospect Clients"
      description="Potential clients in the sales pipeline."
    />
  );
}
