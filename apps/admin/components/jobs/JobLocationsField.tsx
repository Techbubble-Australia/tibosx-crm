"use client";

import { Plus, Trash2 } from "lucide-react";
import { getSortedCountryOptions } from "@/lib/country-flags";
import type { JobLocationEntry } from "@/lib/job-locations";

type Props = {
  value: JobLocationEntry[];
  onChange: (next: JobLocationEntry[]) => void;
  inputClass: string;
  labelClass: string;
};

function emptyRow(): JobLocationEntry {
  return { countryCode: "", country: "", flag: "", label: "" };
}

export function JobLocationsField({ value, onChange, inputClass, labelClass }: Props) {
  const options = getSortedCountryOptions();
  const rows = value.length > 0 ? value : [emptyRow()];

  const updateRow = (index: number, patch: Partial<JobLocationEntry>) => {
    onChange(rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  };

  const setCountry = (index: number, code: string) => {
    const selected = options.find((o) => o.code === code);
    updateRow(index, {
      countryCode: code,
      country: selected?.name ?? "",
      flag: selected?.flag ?? "",
    });
  };

  return (
    <div className="space-y-3">
      <div>
        <label className={labelClass}>Locations *</label>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Add one row per country. Use the city/region field for Sydney, Mumbai, etc. Multi-country roles show all flags on the careers page.
        </p>
      </div>

      {rows.map((row, index) => (
        <div
          key={index}
          className="grid gap-3 rounded-lg border border-gray-200 bg-gray-50/60 p-4 dark:border-gray-600 dark:bg-gray-800/40 sm:grid-cols-[1fr_1fr_auto]"
        >
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">Country</label>
            <select
              required
              value={row.countryCode}
              onChange={(e) => setCountry(index, e.target.value)}
              className={inputClass}
              aria-label={`Country ${index + 1}`}
            >
              <option value="">Select country…</option>
              {options.map((o) => (
                <option key={o.code} value={o.code}>
                  {o.flag} {o.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">City / region (optional)</label>
            <input
              className={inputClass}
              value={row.label ?? ""}
              onChange={(e) => updateRow(index, { label: e.target.value })}
              placeholder="e.g. Sydney, Mumbai"
              aria-label={`City or region ${index + 1}`}
            />
          </div>
          <div className="flex items-end">
            <button
              type="button"
              onClick={() => onChange(rows.filter((_, i) => i !== index))}
              disabled={rows.length <= 1}
              className="inline-flex h-[42px] items-center gap-1 rounded-lg border border-red-200 px-3 text-sm font-medium text-red-700 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950/40"
            >
              <Trash2 className="h-4 w-4" aria-hidden />
              Remove
            </button>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={() => onChange([...rows, emptyRow()])}
        className="inline-flex items-center gap-2 rounded-lg border border-dashed border-gray-300 px-4 py-2 text-sm font-medium text-gray-800 transition-colors hover:border-gray-400 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-100 dark:hover:bg-gray-800"
      >
        <Plus className="h-4 w-4" aria-hidden />
        Add country
      </button>
    </div>
  );
}
