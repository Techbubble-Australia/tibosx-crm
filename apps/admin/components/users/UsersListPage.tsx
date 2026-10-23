"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { adminFetch } from "@/lib/admin-api";
import { formatRolesLabel, roleLabel } from "@/lib/admin-roles";
import { RolePermissionsCard } from "@/components/users/RolePermissionsCard";
import { AdminSearchField } from "@/components/ui/AdminSearchField";
import { TablePagination } from "@/components/ui/TablePagination";
import { useListView } from "@/hooks/useListView";
import { buildSearchHaystack } from "@/lib/search-text";
import { useAdminSession } from "@/contexts/AdminSessionContext";
import { profileKycStatusBadgeClass, profileKycStatusLabel } from "@/lib/profile-kyc";

interface UserRow {
  id: string;
  email: string;
  name: string | null;
  role: string;
  additionalRoles?: string[];
  active: boolean;
  mfaEnabled: boolean;
  requireProfileAfterFirstLogin?: boolean;
  profileKycStatus?: string;
}

type SortKey = "name" | "email" | "role" | "mfaEnabled" | "active";
type SortDir = "asc" | "desc";

function SortHeader({
  label,
  sortKey,
  activeKey,
  dir,
  onSort,
}: {
  label: string;
  sortKey: SortKey;
  activeKey: SortKey;
  dir: SortDir;
  onSort: (key: SortKey) => void;
}) {
  const active = activeKey === sortKey;
  return (
    <button
      type="button"
      onClick={() => onSort(sortKey)}
      className="inline-flex items-center gap-1 font-medium text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100"
    >
      {label}
      {active ? (dir === "asc" ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />) : null}
    </button>
  );
}

function compareUsers(a: UserRow, b: UserRow, key: SortKey): number {
  switch (key) {
    case "name":
      return (a.name ?? "").localeCompare(b.name ?? "", undefined, { sensitivity: "base" });
    case "email":
      return a.email.localeCompare(b.email, undefined, { sensitivity: "base" });
    case "role":
      return formatRolesLabel(a.role, a.additionalRoles).localeCompare(
        formatRolesLabel(b.role, b.additionalRoles),
        undefined,
        { sensitivity: "base" },
      );
    case "mfaEnabled":
      return Number(a.mfaEnabled) - Number(b.mfaEnabled);
    case "active":
      return Number(a.active) - Number(b.active);
    default:
      return 0;
  }
}

export function UsersListPage({ activeOnly }: { activeOnly: boolean }) {
  const { userId: currentUserId } = useAdminSession();
  const [rows, setRows] = useState<UserRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const scopedRows = useMemo(
    () =>
      rows.filter((row) => {
        if (row.role === "client" || row.additionalRoles?.includes("client")) return false;
        return activeOnly ? row.active : !row.active;
      }),
    [rows, activeOnly],
  );

  const {
    search,
    setSearch,
    page,
    setPage,
    pageSize,
    setPageSize,
    filtered,
    totalItems,
    totalSourceItems,
  } = useListView(scopedRows, (row) =>
    buildSearchHaystack([row.email, row.name, row.role, roleLabel(row.role), row.mfaEnabled ? "mfa" : ""]),
    { initialPageSize: 100, pageSizeStorageKey: "admin-users-page-size" },
  );

  const sorted = useMemo(() => {
    const list = [...filtered];
    list.sort((a, b) => {
      const cmp = compareUsers(a, b, sortKey);
      return sortDir === "asc" ? cmp : -cmp;
    });
    return list;
  }, [filtered, sortKey, sortDir]);

  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sorted.slice(start, start + pageSize);
  }, [sorted, page, pageSize]);

  useEffect(() => {
    void fetchRows();
  }, []);

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  async function fetchRows() {
    try {
      const res = await adminFetch("/api/admin/users");
      const data = await res.json();
      setRows(data.data || []);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function deactivateRow(id: string) {
    if (id === currentUserId) {
      alert("You cannot deactivate your own account.");
      return;
    }
    if (!confirm("Deactivate this user? They will not be able to sign in.")) return;
    const res = await adminFetch(`/api/admin/users/${id}/deactivate`, { method: "POST" });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      alert((err as { error?: string }).error || "Deactivate failed");
      return;
    }
    await fetchRows();
  }

  async function deleteRow(id: string) {
    if (
      !confirm(
        "All user data including any mappings, signed documents will be deleted. Do you want to continue?",
      )
    ) {
      return;
    }
    try {
      const res = await adminFetch(`/api/admin/users/${id}`, { method: "DELETE" });
      if (res.ok) setRows((r) => r.filter((x) => x.id !== id));
      else {
        const err = await res.json().catch(() => ({}));
        alert((err as { error?: string }).error || "Delete failed");
      }
    } catch (error) {
      console.error("Error deleting user:", error);
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-black border-t-transparent dark:border-white" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {activeOnly ? "Active internal users" : "Inactive internal users"}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Add and manage internal TBOS accounts. Assign roles to control what each user can access.
          </p>
        </div>
        <Link
          href="/users/new"
          className="inline-flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200"
        >
          <Plus className="h-4 w-4" />
          Add user
        </Link>
      </div>

      <AdminSearchField
        id={`user-search-${activeOnly ? "active" : "inactive"}`}
        value={search}
        onChange={setSearch}
        placeholder="Search by email, name, or role…"
        filteredCount={totalItems}
        totalCount={totalSourceItems}
      />

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
            <tr>
              <th className="px-4 py-3 text-left">
                <SortHeader label="Name" sortKey="name" activeKey={sortKey} dir={sortDir} onSort={handleSort} />
              </th>
              <th className="px-4 py-3 text-left">
                <SortHeader label="Email" sortKey="email" activeKey={sortKey} dir={sortDir} onSort={handleSort} />
              </th>
              <th className="px-4 py-3 text-left">
                <SortHeader label="Role" sortKey="role" activeKey={sortKey} dir={sortDir} onSort={handleSort} />
              </th>
              <th className="px-4 py-3 text-left">Profile KYC</th>
              <th className="px-4 py-3 text-left">
                <SortHeader label="MFA" sortKey="mfaEnabled" activeKey={sortKey} dir={sortDir} onSort={handleSort} />
              </th>
              <th className="px-4 py-3 text-right font-medium text-gray-600 dark:text-gray-300">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {scopedRows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                  No {activeOnly ? "active" : "inactive"} users.
                </td>
              </tr>
            ) : totalItems === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-400">No users match your search.</td>
              </tr>
            ) : (
              paginated.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="px-4 py-3 font-medium">
                    <Link href={`/users/${row.id}`} className="text-gray-900 hover:underline dark:text-gray-100">
                      {row.name || "—"}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{row.email}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                    {formatRolesLabel(row.role, row.additionalRoles)}
                  </td>
                  <td className="px-4 py-3">
                    {row.requireProfileAfterFirstLogin === false ? (
                      <span className="text-xs text-gray-400">Not required</span>
                    ) : (
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${profileKycStatusBadgeClass(row.profileKycStatus)}`}
                      >
                        {profileKycStatusLabel(row.profileKycStatus)}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                        row.mfaEnabled
                          ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                          : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                      }`}
                    >
                      {row.mfaEnabled ? "Enabled" : "Off"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex items-center gap-2">
                      {activeOnly && row.id !== currentUserId ? (
                        <button
                          type="button"
                          onClick={() => void deactivateRow(row.id)}
                          className="rounded-lg border border-gray-200 px-2 py-1 text-xs font-medium hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800"
                        >
                          Deactivate
                        </button>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => void deleteRow(row.id)}
                        className="rounded p-1.5 text-gray-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
                        aria-label="Delete user"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        {scopedRows.length > 0 ? (
          <TablePagination
            page={page}
            pageSize={pageSize}
            totalItems={totalItems}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        ) : null}
      </div>

      {activeOnly ? <RolePermissionsCard /> : null}
    </div>
  );
}
