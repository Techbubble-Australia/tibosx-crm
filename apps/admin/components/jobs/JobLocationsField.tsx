"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { getCitiesForCountryCode } from "@/lib/country-cities";
import { getSortedCountryOptions } from "@/lib/country-flags";
import type { JobLocationEntry } from "@/lib/job-locations";

type Props = {
  value: JobLocationEntry[];
  onChange: (next: JobLocationEntry[]) => void;
  inputClass: string;
  labelClass: string;
};

const ANY_LABEL = "Any";
const OTHER_LABEL = "Other";

function emptyRow(): JobLocationEntry {
  return { countryCode: "", country: "", flag: "", label: "", cities: [] };
}

function normalizeCities(row: JobLocationEntry): string[] {
  if (Array.isArray(row.cities) && row.cities.length > 0) {
    return row.cities;
  }
  const legacy = row.label?.trim();
  if (!legacy) return [];
  return legacy.split(/\s*(?:,|&| and )\s*/i).map((s) => s.trim()).filter(Boolean);
}

export function JobLocationsField({ value, onChange, inputClass, labelClass }: Props) {
  const options = getSortedCountryOptions();
  const rows = value.length > 0 ? value : [emptyRow()];
  const [otherOpenRows, setOtherOpenRows] = useState<Set<number>>(new Set());

  const updateRow = (index: number, patch: Partial<JobLocationEntry>) => {
    onChange(rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  };

  const setCountry = (index: number, code: string) => {
    const selected = options.find((o) => o.code === code);
    setOtherOpenRows((prev) => {
      const next = new Set(prev);
      next.delete(index);
      return next;
    });
    updateRow(index, {
      countryCode: code,
      country: selected?.name ?? "",
      flag: selected?.flag ?? "",
      cities: [],
      label: "",
    });
  };

  const toggleCity = (index: number, city: string) => {
    const row = rows[index];
    if (!row) return;
    const current = normalizeCities(row);
    const next = current.includes(city)
      ? current.filter((c) => c !== city)
      : [...current, city];
    updateRow(index, { cities: next, label: "" });
  };

  const toggleAny = (index: number) => {
    setOtherOpenRows((prev) => {
      const next = new Set(prev);
      next.delete(index);
      return next;
    });
    updateRow(index, { cities: [], label: "" });
  };

  const toggleOther = (index: number, cityOptions: readonly string[]) => {
    const row = rows[index];
    if (!row) return;
    const selectedCities = normalizeCities(row);
    const customCities = selectedCities.filter((city) => !cityOptions.includes(city));
    const isOpen = otherOpenRows.has(index) || customCities.length > 0;

    if (isOpen) {
      const preset = selectedCities.filter((city) => cityOptions.includes(city));
      updateRow(index, { cities: preset, label: "" });
      setOtherOpenRows((prev) => {
        const next = new Set(prev);
        next.delete(index);
        return next;
      });
      return;
    }

    setOtherOpenRows((prev) => new Set(prev).add(index));
  };

  const setCustomCity = (index: number, cityOptions: readonly string[], value: string) => {
    const row = rows[index];
    if (!row) return;
    const preset = normalizeCities(row).filter((city) => cityOptions.includes(city));
    const trimmed = value.trim();
    const next = trimmed ? [...preset, trimmed] : preset;
    updateRow(index, { cities: next, label: "" });
  };

  return (
    <div className="space-y-3">
      <div>
        <label className={labelClass}>Locations *</label>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Use one row per country. Select cities here (Any, preset cities, or Other). This drives job cards and the
          admin City column. Use &quot;Add country&quot; only for a different country.
        </p>
      </div>

      {rows.map((row, index) => {
        const cityOptions = getCitiesForCountryCode(row.countryCode);
        const selectedCities = normalizeCities(row);
        const customCities = selectedCities.filter((city) => !cityOptions.includes(city));
        const anySelected = selectedCities.length === 0;
        const otherSelected = otherOpenRows.has(index) || customCities.length > 0;
        const customCityValue = customCities[0] ?? "";

        return (
          <div
            key={index}
            className="space-y-3 rounded-lg border border-gray-200 bg-gray-50/60 p-4 dark:border-gray-600 dark:bg-gray-800/40"
          >
            <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
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
                  {options.map((o) => {
                    const usedElsewhere = rows.some((r, i) => i !== index && r.countryCode === o.code);
                    return (
                      <option key={o.code} value={o.code} disabled={usedElsewhere}>
                        {o.flag} {o.name}
                        {usedElsewhere ? " (already added)" : ""}
                      </option>
                    );
                  })}
                </select>
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

            {row.countryCode ? (
              <div>
                <label className="mb-2 block text-xs font-medium text-gray-600 dark:text-gray-300">
                  Cities (optional, multi-select)
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => toggleAny(index)}
                    className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                      anySelected
                        ? "border-black bg-black text-white dark:border-white dark:bg-white dark:text-black"
                        : "border-gray-300 bg-white text-gray-700 hover:border-gray-400 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-200"
                    }`}
                  >
                    {ANY_LABEL}
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleOther(index, cityOptions)}
                    className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                      otherSelected
                        ? "border-black bg-black text-white dark:border-white dark:bg-white dark:text-black"
                        : "border-gray-300 bg-white text-gray-700 hover:border-gray-400 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-200"
                    }`}
                  >
                    {OTHER_LABEL}
                  </button>
                  {cityOptions.map((city: string) => {
                    const selected = selectedCities.includes(city);
                    return (
                      <button
                        key={city}
                        type="button"
                        onClick={() => toggleCity(index, city)}
                        className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                          selected
                            ? "border-black bg-black text-white dark:border-white dark:bg-white dark:text-black"
                            : "border-gray-300 bg-white text-gray-700 hover:border-gray-400 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-200"
                        }`}
                      >
                        {city}
                      </button>
                    );
                  })}
                </div>
                {otherSelected ? (
                  <input
                    type="text"
                    value={customCityValue}
                    onChange={(e) => setCustomCity(index, cityOptions, e.target.value)}
                    className={`${inputClass} mt-2`}
                    placeholder="Enter city name"
                    aria-label={`Custom city for ${row.country}`}
                  />
                ) : null}
              </div>
            ) : null}
          </div>
        );
      })}

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
