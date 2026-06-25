"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { HtmlEditor } from "@/components/HtmlEditor";
import { JobLocationsField } from "@/components/jobs/JobLocationsField";
import { adminFetch } from "@/lib/admin-api";
import { jobLocationsFromDefaults, type JobLocationEntry } from "@/lib/job-locations";

export type JobFormDefaults = {
  id?: string;
  title?: string;
  location?: string;
  country?: string;
  flag?: string;
  type?: string;
  workMode?: string;
  category?: string;
  department?: string;
  description?: string;
  order?: number;
  published?: boolean;
  referenceNumber?: string;
  locations?: JobLocationEntry[];
};

type TaxonomyItem = { id: string; name: string };

type Props = {
  mode: "create" | "edit";
  defaults?: JobFormDefaults;
  onSubmit: (payload: Record<string, unknown>) => Promise<void>;
  isLoading: boolean;
  cancelHref: string;
  submitLabel: string;
};

function slugify(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

const inputClass =
  "w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-black dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100";
const labelClass = "mb-1 block text-sm font-medium text-gray-900 dark:text-gray-100";

export function JobForm({
  mode,
  defaults = {},
  onSubmit,
  isLoading,
  cancelHref,
  submitLabel,
}: Props) {
  const [title, setTitle] = useState(defaults.title ?? "");
  const [categories, setCategories] = useState<TaxonomyItem[]>([]);
  const [departments, setDepartments] = useState<TaxonomyItem[]>([]);
  const [description, setDescription] = useState(defaults.description ?? "");
  const [locations, setLocations] = useState<JobLocationEntry[]>(() => jobLocationsFromDefaults(defaults));

  useEffect(() => {
    async function loadTaxonomy() {
      try {
        const [catRes, deptRes] = await Promise.all([
          adminFetch("/api/admin/job-categories"),
          adminFetch("/api/admin/job-departments"),
        ]);
        const catData = await catRes.json();
        const deptData = await deptRes.json();
        setCategories(catData.data ?? []);
        setDepartments(deptData.data ?? []);
      } catch (e) {
        console.error(e);
      }
    }
    void loadTaxonomy();
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const validLocations = locations.filter((row) => row.countryCode.trim() && row.country.trim());
    if (validLocations.length === 0) {
      alert("Add at least one country for this role.");
      return;
    }
    const formData = new FormData(e.currentTarget);
    const payload: Record<string, unknown> = {
      title: formData.get("title"),
      locations: validLocations,
      type: formData.get("type"),
      workMode: formData.get("workMode"),
      category: formData.get("category"),
      department: formData.get("department"),
      description: formData.get("description"),
      order: parseInt(formData.get("order") as string, 10) || 0,
      published: formData.get("published") === "on",
    };
    if (mode === "create") {
      payload.slug = slugify(formData.get("title") as string);
    }
    await onSubmit(payload);
  }

  const defaultCategory = defaults.category ?? "";
  const defaultDepartment = defaults.department ?? "";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {defaults.referenceNumber ? (
        <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-600 dark:bg-gray-800">
          <span className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Reference Number
          </span>
          <p className="mt-0.5 font-mono text-sm font-semibold text-gray-900 dark:text-gray-100">
            {defaults.referenceNumber}
          </p>
        </div>
      ) : null}

      <section className="space-y-4 rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100">Job Details</h3>

        <div>
          <label className={labelClass}>Job Title *</label>
          <input
            name="title"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={inputClass}
            placeholder="e.g. Senior ServiceNow Developer"
          />
        </div>

        <JobLocationsField
          value={locations}
          onChange={setLocations}
          inputClass={inputClass}
          labelClass={labelClass}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Employment Type *</label>
            <select name="type" required defaultValue={defaults.type ?? "Full-time"} className={inputClass}>
              <option value="Full-time">Full-time</option>
              <option value="Contract">Contract</option>
              <option value="Part-time">Part-time</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Work Mode *</label>
            <select name="workMode" required defaultValue={defaults.workMode ?? "Remote"} className={inputClass}>
              <option value="Remote">Remote</option>
              <option value="Hybrid">Hybrid</option>
              <option value="Onsite">Onsite</option>
            </select>
          </div>
        </div>

        <div>
          <label className={labelClass}>Job Category</label>
          <select name="category" defaultValue={defaultCategory} className={inputClass}>
            <option value="">Select category…</option>
            {categories.map((c) => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
            {defaultCategory && !categories.some((c) => c.name === defaultCategory) ? (
              <option value={defaultCategory}>{defaultCategory} (current)</option>
            ) : null}
          </select>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            <Link href="/jobs/settings" className="underline hover:text-gray-700">
              Manage job categories
            </Link>
          </p>
        </div>

        <div>
          <label className={labelClass}>Department *</label>
          <select name="department" required defaultValue={defaultDepartment} className={inputClass}>
            <option value="">Select department…</option>
            {departments.map((d) => (
              <option key={d.id} value={d.name}>
                {d.name}
              </option>
            ))}
            {defaultDepartment && !departments.some((d) => d.name === defaultDepartment) ? (
              <option value={defaultDepartment}>{defaultDepartment} (current)</option>
            ) : null}
          </select>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            <Link href="/jobs/settings" className="underline hover:text-gray-700">
              Manage departments
            </Link>
          </p>
        </div>

        <div>
          <label className={labelClass}>Description</label>
          <HtmlEditor
            name="description"
            defaultValue={defaults.description ?? ""}
            value={description}
            onChange={setDescription}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Display Order</label>
            <input
              name="order"
              type="number"
              defaultValue={defaults.order ?? 0}
              className={inputClass}
            />
          </div>
          <div className="flex items-center gap-3 pt-6">
            <input
              name="published"
              type="checkbox"
              id="published"
              defaultChecked={defaults.published !== false}
              className="h-4 w-4 rounded"
            />
            <label htmlFor="published" className="text-sm font-medium text-gray-900 dark:text-gray-100">
              Published
            </label>
          </div>
        </div>
      </section>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex items-center gap-2 rounded-lg bg-black px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-gray-200"
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {submitLabel}
        </button>
        <Link
          href={cancelHref}
          className="inline-flex items-center rounded-lg border border-gray-200 px-6 py-2 text-sm font-medium hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
