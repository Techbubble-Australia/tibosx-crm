"use client";

import { ADMIN_ROLES, ROLE_META } from "@/lib/admin-roles";

const inputClass =
  "w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-black dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100";

type RoleSelectProps = {
  name?: string;
  value: string;
  onChange?: (role: string) => void;
  required?: boolean;
};

export function AdminRoleSelect({ name = "role", value, onChange, required = true }: RoleSelectProps) {
  const description = ROLE_META[value as keyof typeof ROLE_META]?.description ?? ROLE_META.editor.description;

  return (
    <div className="space-y-2">
      <select
        name={name}
        required={required}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        className={inputClass}
      >
        {ADMIN_ROLES.map((role) => (
          <option key={role} value={role}>
            {ROLE_META[role].label}
          </option>
        ))}
      </select>
      <p className="text-xs text-gray-500 dark:text-gray-400">{description}</p>
    </div>
  );
}
