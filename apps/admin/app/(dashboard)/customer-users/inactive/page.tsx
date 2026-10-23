import { CustomerUsersListPage } from "@/components/users/CustomerUsersListPage";

export default function InactiveCustomerUsersPage() {
  return <CustomerUsersListPage activeOnly={false} />;
}
