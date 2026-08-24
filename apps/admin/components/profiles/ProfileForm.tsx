"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Loader2, X } from "lucide-react";
import { adminFetch } from "@/lib/admin-api";
import {
  SALARY_CURRENCIES,
  SALARY_MODES,
  PHONE_PATTERN,
  formatSalaryRateDisplay,
  parseSalaryRateInput,
} from "@/lib/careers-form";
import { getSortedCountryOptions } from "@/lib/country-flags";
import { getCitiesForCountryCode } from "@/lib/country-cities";
import { resolveDocumentFileName, resolveDocumentHref } from "@/lib/media-url";
import { useAdminSession } from "@/contexts/AdminSessionContext";

const OTHER_CITY_VALUE = "__other__";

export type ProfileFormValues = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  country: string;
  city?: string | null;
  category: string;
  technology: string;
  expectedRate: number;
  currency: string;
  mode: string;
  documentUrls: string[];
  previousSalary?: number | null;
  comments?: string | null;
  careerApplicationId?: string | null;
  sourcedById?: string | null;
  sourcedByName?: string | null;
  jobListingId?: string | null;
  isCitizen?: boolean;
  visaStatus?: string | null;
  isDuplicate?: boolean;
  duplicateCount?: number;
  duplicateMatchReason?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

type TaxonomyItem = { id: string; name: string };
type TechnologyItem = { id: string; name: string; categoryId: string; category?: { name: string } };
type SourcerOption = { id: string; label: string };
type JobOption = { id: string; label: string; published: boolean };

type Props = {
  mode: "create" | "edit";
  defaults?: Partial<ProfileFormValues>;
  onSubmit: (payload: ProfileFormValues) => Promise<void>;
  isLoading: boolean;
  cancelHref: string;
  submitLabel: string;
};

const inputClass =
  "w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-black dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:focus:ring-white";
const labelClass = "mb-1 block text-sm font-medium text-gray-900 dark:text-gray-100";

export function ProfileForm({
  mode,
  defaults = {},
  onSubmit,
  isLoading,
  cancelHref,
  submitLabel,
}: Props) {
  const { canManageProfileOwnership } = useAdminSession();
  const [categories, setCategories] = useState<TaxonomyItem[]>([]);
  const [technologies, setTechnologies] = useState<TechnologyItem[]>([]);
  const [taxonomyReady, setTaxonomyReady] = useState(false);

  const [firstName, setFirstName] = useState(defaults.firstName ?? "");
  const [lastName, setLastName] = useState(defaults.lastName ?? "");
  const [email, setEmail] = useState(defaults.email ?? "");
  const [phone, setPhone] = useState(defaults.phone ?? "");
  const [countryCode, setCountryCode] = useState("");
  const [country, setCountry] = useState(defaults.country ?? "");
  const [city, setCity] = useState(defaults.city ?? "");
  const [cityOther, setCityOther] = useState("");
  const [category, setCategory] = useState(defaults.category ?? "");
  const [technology, setTechnology] = useState(defaults.technology ?? "");
  const [currency, setCurrency] = useState(defaults.currency ?? "AUD");
  const [modeValue, setModeValue] = useState(defaults.mode ?? "");
  const [expectedRateInput, setExpectedRateInput] = useState(
    defaults.expectedRate ? formatSalaryRateDisplay(String(defaults.expectedRate)) : "",
  );
  const [previousSalaryInput, setPreviousSalaryInput] = useState(
    defaults.previousSalary ? formatSalaryRateDisplay(String(defaults.previousSalary)) : "",
  );
  const [comments, setComments] = useState(defaults.comments ?? "");
  const [isCitizen, setIsCitizen] = useState(defaults.isCitizen !== false);
  const [visaStatus, setVisaStatus] = useState(defaults.visaStatus ?? "");
  const [sourcedById, setSourcedById] = useState(defaults.sourcedById ?? "");
  const [jobListingId, setJobListingId] = useState(defaults.jobListingId ?? "");
  const [sourcers, setSourcers] = useState<SourcerOption[]>([]);
  const [jobOptions, setJobOptions] = useState<JobOption[]>([]);
  const [documentUrls, setDocumentUrls] = useState<string[]>(defaults.documentUrls ?? []);
  const [documentFiles, setDocumentFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadTaxonomy() {
      try {
        const [catRes, techRes] = await Promise.all([
          fetch("/api/job-categories"),
          fetch("/api/job-technologies"),
        ]);
        const catData = await catRes.json();
        const techData = await techRes.json();
        setCategories(catData.data ?? []);
        setTechnologies(techData.data ?? []);
      } catch (e) {
        console.error(e);
      } finally {
        setTaxonomyReady(true);
      }
    }
    void loadTaxonomy();
    void adminFetch("/api/admin/profiles/meta/sourcers")
      .then((res) => res.json())
      .then((data) => setSourcers(data.data ?? []))
      .catch(console.error);
    void adminFetch("/api/admin/jobs/admin/all")
      .then((res) => res.json())
      .then((data) => {
        const rows = (data.data ?? []) as Array<{
          id: string;
          title: string;
          referenceNumber: string;
          clientName?: string;
          published: boolean;
        }>;
        setJobOptions(
          rows.map((job) => ({
            id: job.id,
            published: job.published,
            label: `${job.referenceNumber} · ${job.title}${job.clientName ? ` (${job.clientName})` : ""}${job.published ? "" : " [Inactive]"}`,
          })),
        );
      })
      .catch(console.error);
  }, []);

  const filteredTechnologies = useMemo(() => {
    if (!category) return technologies;
    return technologies.filter((tech) => tech.category?.name === category || tech.name === technology);
  }, [technologies, category, technology]);

  const countryOptions = useMemo(() => getSortedCountryOptions(), []);
  const cityOptions = useMemo(() => {
    if (!countryCode) return [];
    return [...getCitiesForCountryCode(countryCode)];
  }, [countryCode]);

  useEffect(() => {
    if (!defaults.country) return;
    const match = countryOptions.find((option) => option.name === defaults.country);
    if (match) {
      setCountryCode(match.code);
    }
    if (defaults.city && cityOptions.length > 0 && !cityOptions.includes(defaults.city)) {
      setCity(OTHER_CITY_VALUE);
      setCityOther(defaults.city);
    }
  }, [defaults.country, defaults.city, countryOptions, cityOptions]);

  function handleCategoryChange(next: string) {
    setCategory(next);
    const stillValid = technologies.some(
      (tech) => tech.name === technology && (tech.category?.name === next || !next),
    );
    if (!stillValid) {
      setTechnology("");
    }
  }

  function handleDocumentsChange(fileList: FileList | null) {
    if (!fileList?.length) {
      setDocumentFiles([]);
      return;
    }
    setDocumentFiles(Array.from(fileList));
  }

  function removeDocumentUrl(index: number) {
    setDocumentUrls((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    const expectedRate = parseSalaryRateInput(expectedRateInput);
    if (expectedRate <= 0) {
      setError("Expected rate is required");
      return;
    }

    const normalizedPhone = phone.replace(/\s+/g, "");
    if (!/^\+?\d{8,20}$/.test(normalizedPhone)) {
      setError("Phone must contain digits only with no spaces (8–20 characters)");
      return;
    }

    let nextDocumentUrls = [...documentUrls];

    if (documentFiles.length > 0) {
      setUploading(true);
      try {
        const uploadData = new FormData();
        documentFiles.forEach((file) => uploadData.append("documents", file));
        const uploadRes = await adminFetch("/api/admin/profiles/upload-documents", {
          method: "POST",
          body: uploadData,
        });
        const uploadJson = await uploadRes.json();
        if (!uploadRes.ok) {
          throw new Error(uploadJson.error || "Document upload failed");
        }
        const uploadedFiles = uploadJson.data?.files as Array<{ url: string }> | undefined;
        const urls = uploadedFiles?.map((f) => f.url).filter(Boolean) ?? [];
        if (urls.length === 0) {
          throw new Error("Document upload failed");
        }
        nextDocumentUrls = [...nextDocumentUrls, ...urls];
      } catch (err) {
        setError(err instanceof Error ? err.message : "Document upload failed");
        setUploading(false);
        return;
      }
      setUploading(false);
      setDocumentFiles([]);
    }

    if (nextDocumentUrls.length === 0) {
      setError("At least one document is required");
      return;
    }

    const previousSalaryRaw = parseSalaryRateInput(previousSalaryInput);
    const previousSalary = previousSalaryRaw > 0 ? previousSalaryRaw : null;

    if (!isCitizen && !visaStatus.trim()) {
      setError("Visa status is required when Citizen is No");
      return;
    }

    try {
      const resolvedCity =
        city === OTHER_CITY_VALUE ? cityOther.trim() || null : city.trim() || null;

      await onSubmit({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        phone: normalizedPhone,
        country: country.trim(),
        city: resolvedCity,
        category: category.trim(),
        technology: technology.trim(),
        expectedRate,
        currency,
        mode: modeValue,
        documentUrls: nextDocumentUrls,
        previousSalary,
        comments: comments.trim() || null,
        isCitizen,
        visaStatus: isCitizen ? null : visaStatus.trim(),
        careerApplicationId: defaults.careerApplicationId ?? null,
        sourcedById: sourcedById || null,
        jobListingId: jobListingId || null,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save profile");
    }
  }

  const busy = isLoading || uploading;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {defaults.isDuplicate ? (
        <div
          className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200"
          role="status"
        >
          Duplicate profile — {defaults.duplicateCount ?? 0} other record
          {(defaults.duplicateCount ?? 0) === 1 ? "" : "s"} match by{" "}
          {defaults.duplicateMatchReason ?? "email or phone"}. Review ownership before contacting the candidate.
        </div>
      ) : null}
      <section className="space-y-4 rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100">Candidate details</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>First name *</label>
            <input required value={firstName} onChange={(e) => setFirstName(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Last name *</label>
            <input required value={lastName} onChange={(e) => setLastName(e.target.value)} className={inputClass} />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Email *</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Phone *</label>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\s+/g, ""))}
              pattern={PHONE_PATTERN}
              title="Digits only, no spaces (8–20 characters)"
              className={inputClass}
            />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Citizen *</label>
            <select
              value={isCitizen ? "yes" : "no"}
              onChange={(e) => {
                const yes = e.target.value === "yes";
                setIsCitizen(yes);
                if (yes) setVisaStatus("");
              }}
              className={inputClass}
            >
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Visa status {isCitizen ? "" : "*"}</label>
            <input
              type="text"
              value={isCitizen ? "Citizen / permanent resident" : visaStatus}
              onChange={(e) => setVisaStatus(e.target.value)}
              readOnly={isCitizen}
              required={!isCitizen}
              placeholder={isCitizen ? "" : "e.g. Student visa, PR in progress"}
              className={`${inputClass}${isCitizen ? " bg-gray-50 dark:bg-gray-800/80" : ""}`}
            />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Country *</label>
            <select
              required
              value={countryCode}
              onChange={(e) => {
                const code = e.target.value;
                setCountryCode(code);
                const match = countryOptions.find((option) => option.code === code);
                setCountry(match?.name ?? "");
                setCity("");
                setCityOther("");
              }}
              className={inputClass}
            >
              <option value="">Select country…</option>
              {countryOptions.map((option) => (
                <option key={option.code} value={option.code}>
                  {option.flag} {option.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>City</label>
            <select
              value={city}
              onChange={(e) => {
                setCity(e.target.value);
                if (e.target.value !== OTHER_CITY_VALUE) {
                  setCityOther("");
                }
              }}
              disabled={!countryCode}
              className={inputClass}
            >
              <option value="">Select city…</option>
              {cityOptions.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
              <option value={OTHER_CITY_VALUE}>Other</option>
            </select>
            {city === OTHER_CITY_VALUE ? (
              <input
                value={cityOther}
                onChange={(e) => setCityOther(e.target.value)}
                className={`${inputClass} mt-2`}
                placeholder="Enter city"
              />
            ) : null}
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Category *</label>
            <select
              required
              value={category}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className={inputClass}
              disabled={!taxonomyReady}
            >
              <option value="">Select category…</option>
              {categories.map((item) => (
                <option key={item.id} value={item.name}>{item.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Technology *</label>
            <select
              required
              value={technology}
              onChange={(e) => setTechnology(e.target.value)}
              className={inputClass}
              disabled={!taxonomyReady || !category}
            >
              <option value="">Select technology…</option>
              {filteredTechnologies.map((item) => (
                <option key={item.id} value={item.name}>{item.name}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Sourced by</label>
            {canManageProfileOwnership ? (
              <select value={sourcedById} onChange={(e) => setSourcedById(e.target.value)} className={inputClass}>
                <option value="">Optional</option>
                {sourcers.map((option) => (
                  <option key={option.id} value={option.id}>{option.label}</option>
                ))}
              </select>
            ) : (
              <p className={`${inputClass} bg-gray-50 dark:bg-gray-800/80`}>
                {defaults.sourcedByName?.trim() ||
                  sourcers.find((option) => option.id === sourcedById)?.label ||
                  "You (on create)"}
              </p>
            )}
            {!canManageProfileOwnership ? (
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Only an administrator can change profile ownership.
              </p>
            ) : null}
          </div>
          <div>
            <label className={labelClass}>Add to job</label>
            <select
              value={jobListingId}
              onChange={(e) => setJobListingId(e.target.value)}
              className={inputClass}
              disabled={Boolean(defaults.careerApplicationId)}
            >
              <option value="">Optional</option>
              {jobOptions.map((job) => (
                <option key={job.id} value={job.id}>{job.label}</option>
              ))}
            </select>
            {defaults.careerApplicationId ? (
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Already linked to a career application.</p>
            ) : (
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                On save, creates a career application for the selected job.
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="space-y-4 rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100">Rate & compensation</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className={labelClass}>Currency *</label>
            <select required value={currency} onChange={(e) => setCurrency(e.target.value)} className={inputClass}>
              <option value="" disabled>Select currency…</option>
              {SALARY_CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>{c.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Expected rate *</label>
            <input
              required
              inputMode="numeric"
              value={expectedRateInput}
              onChange={(e) => setExpectedRateInput(formatSalaryRateDisplay(e.target.value))}
              className={inputClass}
              placeholder="e.g. 120000"
            />
          </div>
          <div>
            <label className={labelClass}>Mode *</label>
            <select required value={modeValue} onChange={(e) => setModeValue(e.target.value)} className={inputClass}>
              <option value="" disabled>Select mode…</option>
              {SALARY_MODES.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className={labelClass}>Previous salary</label>
          <input
            inputMode="numeric"
            value={previousSalaryInput}
            onChange={(e) => setPreviousSalaryInput(formatSalaryRateDisplay(e.target.value))}
            className={inputClass}
            placeholder="Optional"
          />
        </div>
      </section>

      <section className="space-y-4 rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100">Documents *</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Upload resume, visa copies, and other supporting documents (PDF, DOC, DOCX — max 5MB each, up to 10 files).
        </p>
        <label className="flex min-h-[100px] cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-4 text-center dark:border-gray-600 dark:bg-gray-800/50">
          <input
            type="file"
            multiple
            accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            className="sr-only"
            onChange={(e) => handleDocumentsChange(e.target.files)}
          />
          <span className="text-sm text-gray-600 dark:text-gray-300">Click to add documents</span>
        </label>
        {documentFiles.length > 0 ? (
          <ul className="space-y-1 rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-gray-700">
            {documentFiles.map((file, index) => (
              <li key={`${file.name}-${index}`} className="truncate text-gray-700 dark:text-gray-300">{file.name}</li>
            ))}
          </ul>
        ) : null}
        {documentUrls.length > 0 ? (
          <ul className="space-y-2">
            {documentUrls.map((url, index) => (
              <li key={`${url}-${index}`} className="flex items-center justify-between gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-gray-700">
                <a href={resolveDocumentHref(url)} target="_blank" rel="noopener noreferrer" className="truncate text-blue-600 hover:underline dark:text-blue-400">
                  {resolveDocumentFileName(url, index + 1)}
                </a>
                <button
                  type="button"
                  onClick={() => removeDocumentUrl(index)}
                  className="rounded p-1 text-gray-500 hover:text-red-600"
                  aria-label="Remove document"
                >
                  <X className="h-4 w-4" aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      <section className="space-y-4 rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100">Comments</h3>
        <textarea
          rows={4}
          value={comments}
          onChange={(e) => setComments(e.target.value)}
          className={inputClass}
          placeholder="Optional notes about the candidate"
        />
      </section>

      {mode === "edit" && defaults.createdAt ? (
        <section className="grid grid-cols-1 gap-4 rounded-xl border border-gray-200 bg-gray-50/80 p-6 sm:grid-cols-2 dark:border-gray-700 dark:bg-gray-800/40">
          <div>
            <label className={labelClass}>Created on</label>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {new Date(defaults.createdAt).toLocaleString("en-AU", {
                day: "numeric",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
          <div>
            <label className={labelClass}>Updated on</label>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {defaults.updatedAt
                ? new Date(defaults.updatedAt).toLocaleString("en-AU", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "—"}
            </p>
          </div>
        </section>
      ) : null}

      {error ? (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">{error}</p>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-lg bg-black px-6 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
          {submitLabel}
        </button>
        <Link href={cancelHref} className="text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100">
          Cancel
        </Link>
      </div>
      {mode === "edit" && defaults.careerApplicationId ? (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Linked to career application {defaults.careerApplicationId}
        </p>
      ) : null}
    </form>
  );
}
