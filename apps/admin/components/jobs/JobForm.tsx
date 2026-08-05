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
  listingType?: string;
  workMode?: string;
  category?: string;
  technology?: string;
  department?: string;
  clientId?: string;
  description?: string;
  order?: number;
  published?: boolean;
  referenceNumber?: string;
  locations?: JobLocationEntry[];
};

type TaxonomyItem = { id: string; name: string };
type ClientItem = { id: string; name: string; active: boolean };

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

/** Public job-card placement — must not be used as department or client. */
const JOB_LISTING_TYPE_OPTIONS = ["Internal", "External for Client"] as const;

function isListingTypeValue(value: string): value is (typeof JOB_LISTING_TYPE_OPTIONS)[number] {
  return (JOB_LISTING_TYPE_OPTIONS as readonly string[]).includes(value);
}

function resolveListingFields(defaults: JobFormDefaults): { listingType: string; department: string } {
  let listingType = defaults.listingType?.trim() || "Internal";
  let department = defaults.department?.trim() ?? "";

  if (department && isListingTypeValue(department)) {
    if (!defaults.listingType || defaults.listingType === "Internal") {
      listingType = department;
    }
    department = "";
  }

  return { listingType, department };
}

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
  const [technologies, setTechnologies] = useState<TaxonomyItem[]>([]);
  const [departments, setDepartments] = useState<TaxonomyItem[]>([]);
  const [clients, setClients] = useState<ClientItem[]>([]);
  const [taxonomyReady, setTaxonomyReady] = useState(false);
  const [description, setDescription] = useState(defaults.description ?? "");
  const [locations, setLocations] = useState<JobLocationEntry[]>(() => jobLocationsFromDefaults(defaults));
  const initialListing = resolveListingFields(defaults);
  const [category, setCategory] = useState(defaults.category ?? "");
  const [technology, setTechnology] = useState(defaults.technology ?? "");
  const [department, setDepartment] = useState(initialListing.department);
  const [listingType, setListingType] = useState(initialListing.listingType);
  const [clientId, setClientId] = useState(defaults.clientId ?? "");

  const departmentOptions = departments.filter((d) => !isListingTypeValue(d.name));

  useEffect(() => {
    async function loadTaxonomy() {
      try {
        const [catRes, techRes, deptRes, clientRes] = await Promise.all([
          adminFetch("/api/admin/job-categories"),
          adminFetch("/api/admin/job-technologies"),
          adminFetch("/api/admin/job-departments"),
          adminFetch("/api/admin/clients"),
        ]);
        const catData = await catRes.json();
        const techData = await techRes.json();
        const deptData = await deptRes.json();
        const clientData = await clientRes.json();
        setCategories(catData.data ?? []);
        setTechnologies(techData.data ?? []);
        setDepartments(deptData.data ?? []);
        setClients((clientData.data ?? []).filter((c: ClientItem) => c.active));
      } catch (e) {
        console.error(e);
      } finally {
        setTaxonomyReady(true);
      }
    }
    void loadTaxonomy();
  }, []);

  useEffect(() => {
    if (defaults.category) setCategory(defaults.category);
    if (defaults.technology) setTechnology(defaults.technology);
    if (defaults.clientId) setClientId(defaults.clientId);
    const resolved = resolveListingFields(defaults);
    setListingType(resolved.listingType);
    setDepartment(resolved.department);
  }, [defaults.category, defaults.technology, defaults.department, defaults.clientId, defaults.listingType]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const validLocations = locations.filter((row) => row.countryCode.trim() && row.country.trim());
    if (validLocations.length === 0) {
      alert("Add at least one country for this role.");
      return;
    }
    if (!category.trim()) {
      alert("Category is required.");
      return;
    }
    if (!technology.trim()) {
      alert("Technology is required.");
      return;
    }
    if (!department.trim()) {
      alert("Department is required (e.g. Technology, Engineering). Use Listing type for Internal / External for Client.");
      return;
    }
    if (isListingTypeValue(department)) {
      alert('Use the "Listing type" field for Internal or External for Client — not Department.');
      return;
    }
    if (!clientId.trim()) {
      alert("Client is required.");
      return;
    }

    const formData = new FormData(e.currentTarget);
    const payload: Record<string, unknown> = {
      title: formData.get("title"),
      locations: validLocations.map((row) => ({
        ...row,
        cities: row.cities ?? [],
        label: "",
      })),
      type: formData.get("type"),
      listingType,
      workMode: formData.get("workMode"),
      category,
      technology,
      department,
      clientId,
      description,
      order: parseInt(formData.get("order") as string, 10) || 0,
      published: formData.get("published") === "on",
    };
    if (mode === "create") {
      payload.slug = slugify(formData.get("title") as string);
    }
    await onSubmit(payload);
  }

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

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label className={labelClass}>Employment Type *</label>
            <select name="type" required defaultValue={defaults.type ?? "Full-time"} className={inputClass}>
              <option value="Full-time">Full-time</option>
              <option value="Contract">Contract</option>
              <option value="Part-time">Part-time</option>
            </select>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Contract, full-time, etc.</p>
          </div>
          <div>
            <label className={labelClass}>Work Mode *</label>
            <select name="workMode" required defaultValue={defaults.workMode ?? "Remote"} className={inputClass}>
              <option value="Remote">Remote</option>
              <option value="Hybrid">Hybrid</option>
              <option value="Onsite">Onsite</option>
            </select>
          </div>
          <div className="sm:col-span-2 lg:col-span-1">
            <label className={labelClass}>Listing type *</label>
            <select
              name="listingType"
              required
              value={listingType}
              onChange={(e) => setListingType(e.target.value)}
              className={inputClass}
            >
              {JOB_LISTING_TYPE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Shown on public job cards. Not the same as Department or Client.
            </p>
          </div>
        </div>

        {taxonomyReady ? (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClass}>Category *</label>
                <select
                  name="category"
                  required
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className={inputClass}
                >
                  <option value="">Select category…</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                  {category && !categories.some((c) => c.name === category) ? (
                    <option value={category}>{category} (current)</option>
                  ) : null}
                </select>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  <Link href="/settings/categories" className="underline hover:text-gray-700 dark:hover:text-gray-300">
                    Manage categories
                  </Link>
                </p>
              </div>

              <div>
                <label className={labelClass}>Technology *</label>
                <select
                  name="technology"
                  required
                  value={technology}
                  onChange={(e) => setTechnology(e.target.value)}
                  className={inputClass}
                >
                  <option value="">Select technology…</option>
                  {technologies.map((t) => (
                    <option key={t.id} value={t.name}>
                      {t.name}
                    </option>
                  ))}
                  {technology && !technologies.some((t) => t.name === technology) ? (
                    <option value={technology}>{technology} (current)</option>
                  ) : null}
                </select>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  <Link href="/settings/technologies" className="underline hover:text-gray-700 dark:hover:text-gray-300">
                    Manage technologies
                  </Link>
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClass}>Department *</label>
                <select
                  name="department"
                  required
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className={inputClass}
                >
                  <option value="">Select department…</option>
                  {departmentOptions.map((d) => (
                    <option key={d.id} value={d.name}>
                      {d.name}
                    </option>
                  ))}
                  {department && !departmentOptions.some((d) => d.name === department) ? (
                    <option value={department}>{department} (current)</option>
                  ) : null}
                </select>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Team or function (e.g. Technology). For Internal / External for Client, use Listing type above.{" "}
                  <Link href="/settings/departments" className="underline hover:text-gray-700 dark:hover:text-gray-300">
                    Manage departments
                  </Link>
                </p>
              </div>

              <div>
                <label className={labelClass}>Client *</label>
                <select
                  name="clientId"
                  required
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  className={inputClass}
                >
                  <option value="">Select client…</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                  {clientId && !clients.some((c) => c.id === clientId) ? (
                    <option value={clientId}>Current client</option>
                  ) : null}
                </select>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Hiring organisation (admin only). Not the same as Listing type.{" "}
                  <Link href="/clients" className="underline hover:text-gray-700 dark:hover:text-gray-300">
                    Manage clients
                  </Link>
                </p>
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading form options…
          </div>
        )}

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
          disabled={isLoading || !taxonomyReady}
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
