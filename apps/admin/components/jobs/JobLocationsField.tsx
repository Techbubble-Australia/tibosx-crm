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

const CITY_ANY = "__any__";
const CITY_OTHER = "__other__";

function emptyRow(): JobLocationEntry {
  return { countryCode: "", country: "", flag: "", label: "", cities: [] };
}

function resolveCitySelection(row: JobLocationEntry, cityOptions: readonly string[]): {
  selectValue: string;
  otherText: string;
  otherActive: boolean;
} {
  const cities = (row.cities ?? []).map((c) => c.trim()).filter(Boolean);
  if (cities.length === 0) {
    return { selectValue: CITY_ANY, otherText: "", otherActive: false };
  }
  const first = cities[0] ?? "";
  if (cityOptions.includes(first) && cities.length === 1) {
    return { selectValue: first, otherText: "", otherActive: false };
  }
  return { selectValue: CITY_OTHER, otherText: first, otherActive: true };
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

  const setCitySelection = (index: number, cityOptions: readonly string[], selectValue: string) => {
    if (selectValue === CITY_ANY) {
      setOtherOpenRows((prev) => {
        const next = new Set(prev);
        next.delete(index);
        return next;
      });
      updateRow(index, { cities: [], label: "" });
      return;
    }
    if (selectValue === CITY_OTHER) {
      setOtherOpenRows((prev) => new Set(prev).add(index));
      updateRow(index, { cities: [], label: "" });
      return;
    }
    setOtherOpenRows((prev) => {
      const next = new Set(prev);
      next.delete(index);
      return next;
    });
    updateRow(index, { cities: [selectValue], label: "" });
  };

  const setOtherCityText = (index: number, text: string) => {
    const trimmed = text.trim();
    updateRow(index, { cities: trimmed ? [trimmed] : [], label: "" });
  };

  return (
    <div className="space-y-3">
      <div>
        <label className={labelClass}>Locations <span className="text-red-500">*</span></label>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Use one row per country. Pick one city (or Any / Other). Use &quot;Add country&quot; only for a different
          country.
        </p>
      </div>

      {rows.map((row, index) => {
        const cityOptions = getCitiesForCountryCode(row.countryCode);
        const { selectValue, otherText, otherActive } = resolveCitySelection(row, cityOptions);
        const showOtherInput = selectValue === CITY_OTHER || otherOpenRows.has(index) || otherActive;

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
                <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">City</label>
                <select
                  value={selectValue}
                  onChange={(e) => setCitySelection(index, cityOptions, e.target.value)}
                  className={inputClass}
                  aria-label={`City for ${row.country}`}
                >
                  <option value={CITY_ANY}>Any</option>
                  {cityOptions.map((city) => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                  <option value={CITY_OTHER}>Other</option>
                </select>
                {showOtherInput ? (
                  <input
                    type="text"
                    required
                    value={otherText}
                    onChange={(e) => setOtherCityText(index, e.target.value)}
                    className={`${inputClass} mt-2`}
                    placeholder="Enter city name *"
                    aria-label={`Other city for ${row.country}`}
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
