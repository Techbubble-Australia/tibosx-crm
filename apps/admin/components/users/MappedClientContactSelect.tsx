"use client";

import { useEffect, useState } from "react";
import { adminFetch } from "@/lib/admin-api";

export type ContactMapOption = {
  id: string;
  label: string;
  mappedUserId: string | null;
  mappedUserEmail: string | null;
};

type Props = {
  value: string;
  onChange: (contactId: string) => void;
  currentUserId?: string;
  required?: boolean;
};

export function MappedClientContactSelect({ value, onChange, currentUserId, required }: Props) {
  const [options, setOptions] = useState<ContactMapOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void adminFetch("/api/admin/users/contact-map-options")
      .then((res) => res.json())
      .then((data) => setOptions((data.data as ContactMapOption[]) ?? []))
      .catch(() => setOptions([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-900 dark:text-gray-100">
        Map to contact record {required ? <span className="text-red-500">*</span> : null}
      </label>
      <select
        className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-black dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
        value={value}
        required={required}
        disabled={loading}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">{loading ? "Loading contacts…" : "Select contact…"}</option>
        {options.map((opt) => {
          const takenByOther = opt.mappedUserId && opt.mappedUserId !== currentUserId;
          return (
            <option key={opt.id} value={opt.id} disabled={Boolean(takenByOther)}>
              {opt.label}
              {takenByOther ? ` (mapped to ${opt.mappedUserEmail})` : ""}
            </option>
          );
        })}
      </select>
      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
        Required for users with the Client role. Each contact can map to only one user.
      </p>
    </div>
  );
}
