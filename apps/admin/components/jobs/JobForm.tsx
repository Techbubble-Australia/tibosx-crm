"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { HtmlEditor } from "@/components/HtmlEditor";
import { JobLocationsField } from "@/components/jobs/JobLocationsField";
import { adminFetch } from "@/lib/admin-api";
import { jobLocationsFromDefaults, type JobLocationEntry } from "@/lib/job-locations";
import { DEFAULT_PROFILE_LEVEL } from "@/lib/profile-levels";
import { useJobLevels } from "@/hooks/useJobLevels";

export type JobFormDefaults = {
  id?: string;
  title?: string;
  location?: string;
  country?: string;
  flag?: string;
  type?: string;
  workMode?: string;
  category?: string;
  technology?: string;
  department?: string;
  clientId?: string;
  opportunityId?: string | null;
  description?: string;
  order?: number;
  published?: boolean;
  referenceNumber?: string;
  locations?: JobLocationEntry[];
  city?: string | null;
  endClient?: string | null;
  level?: string;
  positionsCount?: number;
  publishedDate?: string | null;
  budget?: string;
  metaTags?: string[];
  updatedAt?: string;
};

type TaxonomyItem = { id: string; name: string };
type TechnologyItem = {
  id: string;
  name: string;
  categoryId: string;
  category?: { id: string; name: string };
};
type ClientItem = { id: string; name: string; status: string };

type Props = {
  mode: "create" | "edit";
  defaults?: JobFormDefaults;
  onSubmit: (payload: Record<string, unknown>) => Promise<void>;
  isLoading: boolean;
  cancelHref: string;
  submitLabel: string;
  metaTags?: string[];
  onMetaTagsChange?: (tags: string[]) => void;
  hideMetaTags?: boolean;
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
  metaTags: metaTagsProp,
  onMetaTagsChange,
  hideMetaTags = false,
}: Props) {
  const jobLevels = useJobLevels();
  const [title, setTitle] = useState(defaults.title ?? "");
  const [categories, setCategories] = useState<TaxonomyItem[]>([]);
  const [technologies, setTechnologies] = useState<TechnologyItem[]>([]);
  const [departments, setDepartments] = useState<TaxonomyItem[]>([]);
  const [clients, setClients] = useState<ClientItem[]>([]);
  const [taxonomyReady, setTaxonomyReady] = useState(false);
  const [description, setDescription] = useState(defaults.description ?? "");
  const [locations, setLocations] = useState<JobLocationEntry[]>(() => jobLocationsFromDefaults(defaults));
  const [category, setCategory] = useState(defaults.category ?? "");
  const [technology, setTechnology] = useState(defaults.technology ?? "");
  const [department, setDepartment] = useState(defaults.department?.trim() ?? "");
  const [clientId, setClientId] = useState(defaults.clientId ?? "");
  const [endClient, setEndClient] = useState(defaults.endClient ?? "");
  const [level, setLevel] = useState(defaults.level ?? DEFAULT_PROFILE_LEVEL);
  const [positionsCount, setPositionsCount] = useState(String(defaults.positionsCount ?? 1));
  const [budget, setBudget] = useState(defaults.budget ?? "");
  const [internalMetaTags, setInternalMetaTags] = useState<string[]>(defaults.metaTags ?? []);
  const [metaTagInput, setMetaTagInput] = useState("");
  const metaTags = onMetaTagsChange ? (metaTagsProp ?? []) : internalMetaTags;
  const [publishedDate, setPublishedDate] = useState(() => {
    if (!defaults.publishedDate) return "";
    const d = new Date(defaults.publishedDate);
    if (Number.isNaN(d.getTime())) return "";
    return d.toISOString().slice(0, 10);
  });
  const [nextOrder, setNextOrder] = useState<number | null>(null);

  const filteredTechnologies = useMemo(() => {
    if (!category) return [];
    return technologies.filter(
      (tech) => tech.category?.name === category || tech.name === technology,
    );
  }, [technologies, category, technology]);

  function handleCategoryChange(next: string) {
    setCategory(next);
    const stillValid = technologies.some(
      (tech) => tech.name === technology && tech.category?.name === next,
    );
    if (!stillValid) {
      setTechnology("");
    }
  }

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
        setClients((clientData.data ?? []).filter((c: ClientItem) => c.status === "ACTIVE"));
      } catch (e) {
        console.error(e);
      } finally {
        setTaxonomyReady(true);
      }
    }
    void loadTaxonomy();
  }, []);

  useEffect(() => {
    if (defaults.level) setLevel(defaults.level);
    if (defaults.budget !== undefined) setBudget(defaults.budget ?? "");
    if (defaults.publishedDate) {
      const d = new Date(defaults.publishedDate);
      if (!Number.isNaN(d.getTime())) {
        setPublishedDate(d.toISOString().slice(0, 10));
      }
    }
    if (defaults.metaTags && !onMetaTagsChange) setInternalMetaTags(defaults.metaTags);
  }, [defaults.level, defaults.budget, defaults.publishedDate, defaults.metaTags, onMetaTagsChange]);

  function addMetaTag(raw: string) {
    const tag = raw.trim();
    if (!tag) return;
    const exists = metaTags.some((existing) => existing.toLowerCase() === tag.toLowerCase());
    if (exists) return;
    if (onMetaTagsChange) {
      onMetaTagsChange([...metaTags, tag]);
    } else {
      setInternalMetaTags((prev) => [...prev, tag]);
    }
    setMetaTagInput("");
  }

  function removeMetaTag(tag: string) {
    if (onMetaTagsChange) {
      onMetaTagsChange(metaTags.filter((existing) => existing !== tag));
    } else {
      setInternalMetaTags((prev) => prev.filter((existing) => existing !== tag));
    }
  }

  useEffect(() => {
    if (mode !== "create") return;
    void adminFetch("/api/admin/jobs/admin/next-order")
      .then((res) => res.json())
      .then((data) => {
        const order = data.data?.order;
        if (typeof order === "number") setNextOrder(order);
      })
      .catch(console.error);
  }, [mode]);

  useEffect(() => {
    if (defaults.category) setCategory(defaults.category);
    if (defaults.technology) setTechnology(defaults.technology);
    if (defaults.clientId) setClientId(defaults.clientId);
    if (defaults.department) setDepartment(defaults.department.trim());
  }, [defaults.category, defaults.technology, defaults.department, defaults.clientId]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const validLocations = locations.filter((row) => row.countryCode.trim() && row.country.trim());
    if (validLocations.length === 0) {
      alert("Add at least one country for this role.");
      return;
    }
    const countryCodes = validLocations.map((row) => row.countryCode.trim().toLowerCase());
    const duplicateCountry = countryCodes.find((code, index) => countryCodes.indexOf(code) !== index);
    if (duplicateCountry) {
      alert(
        "Each country should appear only once. Remove the duplicate country row.",
      );
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
      alert("Department is required (e.g. Technology, Engineering).");
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
      workMode: formData.get("workMode"),
      category,
      technology,
      department,
      clientId,
      endClient: endClient.trim() || null,
      level,
      positionsCount: Number.parseInt(positionsCount, 10) || 1,
      budget: budget.trim(),
      metaTags,
      description,
      order: mode === "create" ? (nextOrder ?? 0) : parseInt(formData.get("order") as string, 10) || 0,
      published: formData.get("published") === "on",
    };
    if (publishedDate.trim()) {
      payload.publishedDate = publishedDate.trim();
    }
    if (mode === "create") {
      payload.slug = slugify(formData.get("title") as string);
      if (defaults.opportunityId) {
        payload.opportunityId = defaults.opportunityId;
      }
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

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
          <div>
            <label className={labelClass}>Level *</label>
            <select
              required
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              className={inputClass}
            >
              {jobLevels.map((lvl) => (
                <option key={lvl} value={lvl}>{lvl}</option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              <Link href="/settings/levels" className="underline hover:text-gray-700 dark:hover:text-gray-300">
                Manage levels
              </Link>
            </p>
          </div>
          <div>
            <label className={labelClass}>Budget</label>
            <input
              type="text"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              className={inputClass}
              placeholder="Optional budget notes"
              maxLength={500}
            />
          </div>
          {!hideMetaTags ? (
            <div className="sm:col-span-2">
              <label className={labelClass}>Meta tags</label>
              <div className="flex flex-wrap gap-2">
                {metaTags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-800 dark:bg-gray-800 dark:text-gray-200"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeMetaTag(tag)}
                      className="text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
                      aria-label={`Remove ${tag}`}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <div className="mt-2 flex gap-2">
                <input
                  type="text"
                  value={metaTagInput}
                  onChange={(e) => setMetaTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addMetaTag(metaTagInput);
                    }
                  }}
                  className={inputClass}
                  placeholder="Add tag and press Enter"
                  maxLength={80}
                />
                <button
                  type="button"
                  onClick={() => addMetaTag(metaTagInput)}
                  className="shrink-0 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800"
                >
                  Add
                </button>
              </div>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Used for AI Insights profile matching (skills, technologies, keywords).
              </p>
            </div>
          ) : null}
          {mode === "edit" ? (
            <div>
              <label className={labelClass}>Published date</label>
              <input
                type="date"
                value={publishedDate}
                onChange={(e) => setPublishedDate(e.target.value)}
                className={inputClass}
              />
            </div>
          ) : (
            <div>
              <label className={labelClass}>Published date</label>
              <p className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-sm text-gray-600 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300">
                Set automatically when the job is created
              </p>
            </div>
          )}
          <div>
            <label className={labelClass}>No. of positions *</label>
            <input
              type="number"
              required
              min={1}
              value={positionsCount}
              onChange={(e) => setPositionsCount(e.target.value)}
              className={inputClass}
            />
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
                  onChange={(e) => handleCategoryChange(e.target.value)}
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
                  disabled={!category}
                  className={`${inputClass} disabled:cursor-not-allowed disabled:opacity-60`}
                >
                  <option value="">{category ? "Select technology…" : "Select category first…"}</option>
                  {filteredTechnologies.map((t) => (
                    <option key={t.id} value={t.name}>
                      {t.name}
                    </option>
                  ))}
                  {technology && !filteredTechnologies.some((t) => t.name === technology) ? (
                    <option value={technology}>{technology} (current)</option>
                  ) : null}
                </select>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {category
                    ? `${filteredTechnologies.length} technolog${filteredTechnologies.length === 1 ? "y" : "ies"} in ${category}. `
                    : null}
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
                  {departments.map((d) => (
                    <option key={d.id} value={d.name}>
                      {d.name}
                    </option>
                  ))}
                  {department && !departments.some((d) => d.name === department) ? (
                    <option value={department}>{department} (current)</option>
                  ) : null}
                </select>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Team or function (e.g. Technology).{" "}
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
                  Hiring organisation (admin only).{" "}
                  <Link href="/clients/active" className="underline hover:text-gray-700 dark:hover:text-gray-300">
                    Manage clients
                  </Link>
                </p>
              </div>

              <div>
                <label className={labelClass}>End client</label>
                <input
                  type="text"
                  value={endClient}
                  onChange={(e) => setEndClient(e.target.value)}
                  className={inputClass}
                  placeholder="Optional end client name"
                  maxLength={200}
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Optional. The end customer for this role, if different from the client above.
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
          {mode === "edit" ? (
            <div>
              <label className={labelClass}>Display Order</label>
              <input
                name="order"
                type="number"
                defaultValue={defaults.order ?? 0}
                className={inputClass}
              />
            </div>
          ) : (
            <div>
              <label className={labelClass}>Display order</label>
              <p className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100">
                {nextOrder !== null ? nextOrder : "Assigned automatically on create"}
              </p>
            </div>
          )}
          <div className={`flex items-center gap-3 ${mode === "edit" ? "pt-6" : ""}`}>
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
