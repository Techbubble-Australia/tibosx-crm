"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, X } from "lucide-react";
import { adminFetch } from "@/lib/admin-api";
import { useAdminSession } from "@/contexts/AdminSessionContext";
import {
  SALARY_CURRENCIES,
  SALARY_MODES,
  PHONE_PATTERN,
  formatSalaryRateDisplay,
  parseSalaryRateInput,
} from "@/lib/careers-form";
import { getSortedCountryOptions } from "@/lib/country-flags";
import { getCitiesForCountryCode } from "@/lib/country-cities";

const OTHER_CITY_VALUE = "__other__";

const inputClass =
  "w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-black dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:focus:ring-white";
const labelClass = "mb-1 block text-sm font-medium text-gray-900 dark:text-gray-100";
const readOnlyClass =
  "w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-sm text-gray-700 dark:border-gray-600 dark:bg-gray-800/60 dark:text-gray-300";

type Props = {
  jobId: string;
  jobTitle: string;
  jobCountry: string;
  onClose: () => void;
  onCreated: () => void;
};

export function JobAddProfileForm({ jobId, jobTitle, jobCountry, onClose, onCreated }: Props) {
  const { userName, email } = useAdminSession();
  const countryOptions = useMemo(() => getSortedCountryOptions(), []);
  const matchedCountry = useMemo(
    () => countryOptions.find((option) => option.name === jobCountry || option.code === jobCountry),
    [countryOptions, jobCountry],
  );
  const countryCode = matchedCountry?.code ?? "";

  const [city, setCity] = useState("");
  const [cityOther, setCityOther] = useState("");
  const [salaryRateInput, setSalaryRateInput] = useState("");
  const [documentFiles, setDocumentFiles] = useState<File[]>([]);
  const [isCitizen, setIsCitizen] = useState(true);
  const [visaStatus, setVisaStatus] = useState("");
  const [relevantExperienceInput, setRelevantExperienceInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const cityOptions = useMemo(() => {
    if (!countryCode) return [];
    return getCitiesForCountryCode(countryCode);
  }, [countryCode]);

  useEffect(() => {
    setCity("");
    setCityOther("");
  }, [countryCode]);

  function resolveCityValue(): string {
    if (city === OTHER_CITY_VALUE) return cityOther.trim();
    return city.trim();
  }

  function handleDocumentsChange(fileList: FileList | null) {
    if (!fileList?.length) {
      setDocumentFiles([]);
      return;
    }
    setDocumentFiles(Array.from(fileList));
  }

  function removeDocument(index: number) {
    setDocumentFiles((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      if (documentFiles.length === 0) {
        throw new Error("At least one document is required");
      }

      const resolvedCity = resolveCityValue();
      if (!resolvedCity) {
        throw new Error("City is required");
      }

      const formData = new FormData(e.currentTarget);
      const uploadData = new FormData();
      documentFiles.forEach((file) => uploadData.append("documents", file));
      const uploadRes = await adminFetch("/api/admin/profiles/upload-documents", {
        method: "POST",
        body: uploadData,
      });
      const uploadJson = await uploadRes.json();
      if (!uploadRes.ok) {
        throw new Error(typeof uploadJson.error === "string" ? uploadJson.error : "Document upload failed");
      }

      const uploadedFiles = (uploadJson.data as { files?: Array<{ url: string }> } | undefined)?.files;
      const documentUrls = uploadedFiles?.map((f) => f.url).filter(Boolean) ?? [];
      if (documentUrls.length === 0) {
        throw new Error("Document upload failed");
      }

      const salaryRate = parseSalaryRateInput(salaryRateInput);
      if (salaryRate <= 0) {
        throw new Error("Salary rate is required");
      }

      const relevantExperience = Number.parseInt(relevantExperienceInput, 10);
      if (Number.isNaN(relevantExperience) || relevantExperience < 0) {
        throw new Error("Relevant experience is required");
      }

      if (!isCitizen && !visaStatus.trim()) {
        throw new Error("Visa status is required when not a citizen");
      }

      const phone = String(formData.get("phone") ?? "").replace(/\s+/g, "");
      if (!new RegExp(PHONE_PATTERN).test(phone)) {
        throw new Error("Phone must contain digits only (8–20 characters, optional + prefix)");
      }

      const payload = {
        firstName: String(formData.get("firstName") ?? "").trim(),
        lastName: String(formData.get("lastName") ?? "").trim(),
        email: String(formData.get("email") ?? "").trim(),
        phone,
        position: jobTitle,
        country: jobCountry,
        city: resolvedCity,
        jobListingId: jobId,
        isCitizen,
        visaStatus: isCitizen ? "" : visaStatus.trim(),
        salaryCurrency: String(formData.get("salaryCurrency") ?? "").trim(),
        salaryRate,
        salaryMode: String(formData.get("salaryMode") ?? "").trim(),
        relevantExperience,
        documentUrls,
        message: String(formData.get("message") ?? "").trim() || undefined,
      };

      const res = await adminFetch("/api/admin/career-applications/admin/applications/from-job", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(typeof json.error === "string" ? json.error : "Failed to create profile");
      }

      onCreated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  const sourcedByLabel = userName?.trim() || email || "Current user";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-900">
        <div className="sticky top-0 flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4 dark:border-gray-700 dark:bg-gray-900">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Add new profile</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Create a career application and candidate profile for this job.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          {error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-900/20 dark:text-red-300">
              {error}
            </div>
          ) : null}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>First name *</label>
              <input name="firstName" required className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Last name *</label>
              <input name="lastName" required className={inputClass} />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Email *</label>
              <input name="email" type="email" required className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Phone *</label>
              <input name="phone" required pattern={PHONE_PATTERN} className={inputClass} placeholder="+61412345678" />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Position</label>
              <input value={jobTitle} readOnly className={readOnlyClass} />
            </div>
            <div>
              <label className={labelClass}>Country</label>
              <input value={jobCountry} readOnly className={readOnlyClass} />
            </div>
          </div>

          <div>
            <label className={labelClass}>City *</label>
            {cityOptions.length > 0 ? (
              <select value={city} onChange={(e) => setCity(e.target.value)} required className={inputClass}>
                <option value="">Select city</option>
                {cityOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
                <option value={OTHER_CITY_VALUE}>Other</option>
              </select>
            ) : (
              <input value={cityOther} onChange={(e) => setCityOther(e.target.value)} required className={inputClass} />
            )}
            {city === OTHER_CITY_VALUE ? (
              <input
                value={cityOther}
                onChange={(e) => setCityOther(e.target.value)}
                required
                className={`${inputClass} mt-2`}
                placeholder="Enter city"
              />
            ) : null}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className={labelClass}>Salary currency *</label>
              <select name="salaryCurrency" required defaultValue="AUD" className={inputClass}>
                {SALARY_CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Salary rate *</label>
              <input
                value={salaryRateInput}
                onChange={(e) => setSalaryRateInput(formatSalaryRateDisplay(e.target.value))}
                required
                className={inputClass}
                placeholder="e.g. 120,000"
              />
            </div>
            <div>
              <label className={labelClass}>Salary mode *</label>
              <select name="salaryMode" required defaultValue="Yearly" className={inputClass}>
                {SALARY_MODES.map((mode) => (
                  <option key={mode} value={mode}>
                    {mode}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Citizen / permanent resident? *</label>
              <select
                value={isCitizen ? "yes" : "no"}
                onChange={(e) => setIsCitizen(e.target.value === "yes")}
                className={inputClass}
              >
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Relevant experience (years) *</label>
              <input
                value={relevantExperienceInput}
                onChange={(e) => setRelevantExperienceInput(e.target.value.replace(/[^\d]/g, ""))}
                required
                className={inputClass}
                placeholder="e.g. 5"
              />
            </div>
          </div>

          {!isCitizen ? (
            <div>
              <label className={labelClass}>Visa status *</label>
              <input value={visaStatus} onChange={(e) => setVisaStatus(e.target.value)} required className={inputClass} />
            </div>
          ) : null}

          <div>
            <label className={labelClass}>Documents *</label>
            <input
              type="file"
              accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              multiple
              onChange={(e) => handleDocumentsChange(e.target.files)}
              className={inputClass}
            />
            {documentFiles.length > 0 ? (
              <ul className="mt-2 space-y-1 text-sm text-gray-600 dark:text-gray-400">
                {documentFiles.map((file, index) => (
                  <li key={`${file.name}-${index}`} className="flex items-center justify-between gap-2">
                    <span className="truncate">{file.name}</span>
                    <button type="button" onClick={() => removeDocument(index)} className="text-red-600 hover:underline">
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          <div>
            <label className={labelClass}>Message</label>
            <textarea name="message" rows={3} className={inputClass} />
          </div>

          <div>
            <label className={labelClass}>Sourced by</label>
            <input value={sourcedByLabel} readOnly className={readOnlyClass} />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Save profile
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
