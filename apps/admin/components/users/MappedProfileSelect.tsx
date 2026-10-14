"use client";

import { useEffect, useState } from "react";
import { adminFetch } from "@/lib/admin-api";

export type ProfileMapOption = {
  id: string;
  label: string;
  mappedUserId: string | null;
  mappedUserEmail: string | null;
};

type Props = {
  value: string;
  onChange: (profileId: string) => void;
  currentUserId?: string;
  initialOption?: ProfileMapOption | null;
};

export function MappedProfileSelect({ value, onChange, currentUserId, initialOption }: Props) {
  const [query, setQuery] = useState("");
  const [options, setOptions] = useState<ProfileMapOption[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialOption && initialOption.id === value) {
      setOptions([initialOption]);
    }
  }, [initialOption, value]);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2 && !value) {
      if (!(initialOption && initialOption.id === value)) {
        setOptions([]);
      }
      return;
    }
    setLoading(true);
    const params = new URLSearchParams();
    if (q.length >= 2) params.set("q", q);
    void adminFetch(`/api/admin/users/profile-map-options?${params}`)
      .then((res) => res.json())
      .then((data) => setOptions((data.data as ProfileMapOption[]) ?? []))
      .catch(() => setOptions([]))
      .finally(() => setLoading(false));
  }, [query, value]);

  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-900 dark:text-gray-100">
        Map to Profile record
      </label>
      <input
        type="search"
        className="mb-2 w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-black dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
        placeholder="Search profiles by name or email…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <select
        className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-black dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
        value={value}
        disabled={loading && options.length === 0}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">
          {loading ? "Searching…" : query.trim().length < 2 ? "Type at least 2 characters to search" : "Select profile…"}
        </option>
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
        Links this user to a recruitment profile. Project members for that profile will show this user record. Each profile
        can map to only one user.
      </p>
    </div>
  );
}
