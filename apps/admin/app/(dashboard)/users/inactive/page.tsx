import { UsersListPage } from "@/components/users/UsersListPage";

export default function InactiveUsersPage() {
  return <UsersListPage activeOnly={false} />;
}
