"use client";

import { ADMIN_ROLES, ROLE_META, type AdminRole, isAdminRole } from "@/lib/admin-roles";

type Props = {
  value: AdminRole[];
  onChange: (roles: AdminRole[]) => void;
};

export function AdminRolesMultiSelect({ value, onChange }: Props) {
  function toggle(role: AdminRole) {
    if (role === "client") {
      if (value.includes("client")) {
        const next = value.filter((r) => r !== "client");
        onChange(next.length ? next : ["website"]);
      } else {
        onChange(["client"]);
      }
      return;
    }

    const withoutClient = value.filter((r) => r !== "client");
    if (withoutClient.includes(role)) {
      const next = withoutClient.filter((r) => r !== role);
      onChange(next.length ? next : [role]);
      return;
    }
    onChange([...withoutClient, role]);
  }

  return (
    <div className="space-y-2">
      <div className="grid gap-2 sm:grid-cols-2">
        {ADMIN_ROLES.filter((role) => role !== "client").map((role) => (
          <label
            key={role}
            className="flex cursor-pointer items-start gap-2 rounded-lg border border-gray-200 px-3 py-2 dark:border-gray-600"
          >
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 rounded"
              checked={value.includes(role)}
              onChange={() => toggle(role)}
            />
            <span>
              <span className="block text-sm font-medium text-gray-900 dark:text-gray-100">{ROLE_META[role].label}</span>
              <span className="block text-xs text-gray-500 dark:text-gray-400">{ROLE_META[role].description}</span>
            </span>
          </label>
        ))}
      </div>
      {value[0] ? (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Primary role for sign-in: <strong>{ROLE_META[value[0]].label}</strong> (first selected).
        </p>
      ) : null}
    </div>
  );
}

export function rolesFromApi(primary: string, additional: string[] | null | undefined): AdminRole[] {
  const list: AdminRole[] = [];
  const add = (r: string) => {
    if (isAdminRole(r) && !list.includes(r)) list.push(r);
  };
  add(primary);
  for (const r of additional ?? []) add(r);
  return list.length ? list : isAdminRole(primary) ? [primary] : ["website"];
}

export function rolesToApi(selected: AdminRole[]): { role: AdminRole; additionalRoles: AdminRole[] } {
  const unique = selected.filter((r, i) => selected.indexOf(r) === i);
  const role = unique[0] ?? "website";
  return { role, additionalRoles: unique.slice(1) };
}
