"use client";

import { useEffect, useMemo, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowRight, Loader2, X } from "lucide-react";
import type { JobApiRow } from "@/lib/api/public";
import { normalizeJobLocations } from "@/lib/job-locations";
import {
  SALARY_CURRENCIES,
  SALARY_MODES,
  countriesForJobTitle,
  formatSalaryRateDisplay,
  parseSalaryRateInput,
  type JobApplyOption,
} from "@/lib/careers-form";

/** Must match packages/api/src/lib/validation.ts PHONE_REGEX */
const PHONE_PATTERN = String.raw`^\+?[\d\s().-]{8,20}$`;

type CareersApplyFormProps = {
  jobs: JobApiRow[];
};

function readFormString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function readOptionalMessage(formData: FormData): string | undefined {
  const value = readFormString(formData, "message");
  return value.length > 0 ? value : undefined;
}

function buildJobApplyOptions(jobs: JobApiRow[]): JobApplyOption[] {
  return jobs.map((job) => {
    const entries = normalizeJobLocations(job);
    const countries = [...new Set(entries.map((e) => e.country.trim()).filter(Boolean))];
    return { title: job.title, countries };
  });
}

function CareersApplyFormInner({ jobs }: CareersApplyFormProps) {
  const searchParams = useSearchParams();
  const positionParam = searchParams.get("position") ?? "";
  const jobOptions = useMemo(() => buildJobApplyOptions(jobs), [jobs]);
  const uniquePositions = [...new Set(jobs.map((j) => j.title.trim()).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b),
  );

  const [position, setPosition] = useState(positionParam);
  const [country, setCountry] = useState("");
  const [salaryRateInput, setSalaryRateInput] = useState("");
  const [documentFiles, setDocumentFiles] = useState<File[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (positionParam) {
      setPosition(positionParam);
      setCountry(countriesForJobTitle(positionParam, jobOptions));
    }
  }, [positionParam, jobOptions]);

  useEffect(() => {
    if (typeof window !== "undefined" && (window.location.hash === "#apply" || positionParam)) {
      document.getElementById("apply")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [positionParam]);

  function handlePositionChange(next: string) {
    setPosition(next);
    setCountry(countriesForJobTitle(next, jobOptions));
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
    setStatus("loading");
    setErrorMsg("");

    const form = e.currentTarget;
    const formData = new FormData(form);

    try {
      if (documentFiles.length === 0) {
        throw new Error("At least one document is required");
      }

      if (!country.trim()) {
        throw new Error("Country is required — select a position first");
      }

      const uploadData = new FormData();
      documentFiles.forEach((file) => uploadData.append("documents", file));
      const uploadRes = await fetch("/api/careers/upload-documents", {
        method: "POST",
        body: uploadData,
      });
      const uploadJson = await uploadRes.json();
      if (!uploadRes.ok) {
        throw new Error(uploadJson.error || "Document upload failed");
      }

      const uploadedFiles = uploadJson.data?.files as Array<{ url: string }> | undefined;
      const documentUrls = uploadedFiles?.map((f) => f.url).filter(Boolean) ?? [];
      if (documentUrls.length === 0) {
        throw new Error("Document upload failed");
      }

      const salaryRate = parseSalaryRateInput(salaryRateInput);
      if (salaryRate <= 0) {
        throw new Error("Salary rate is required");
      }

      const payload = {
        firstName: readFormString(formData, "firstName"),
        lastName: readFormString(formData, "lastName"),
        email: readFormString(formData, "email"),
        phone: readFormString(formData, "phone"),
        position: position.trim(),
        country: country.trim(),
        visaStatus: readFormString(formData, "visaStatus"),
        salaryCurrency: readFormString(formData, "salaryCurrency"),
        salaryRate,
        salaryMode: readFormString(formData, "salaryMode"),
        documentUrls,
        message: readOptionalMessage(formData),
      };

      if (!payload.position) {
        throw new Error("Position is required");
      }

      const res = await fetch("/api/careers/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) {
        const detailText =
          Array.isArray(json.details)
            ? json.details.map((d: { message?: string }) => d.message).filter(Boolean).join(". ")
            : "";
        throw new Error(detailText || json.error || "Submission failed");
      }

      setStatus("success");
      form.reset();
      setSalaryRateInput("");
      setDocumentFiles([]);
      if (positionParam) {
        setPosition(positionParam);
        setCountry(countriesForJobTitle(positionParam, jobOptions));
      } else {
        setPosition("");
        setCountry("");
      }
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  const fieldClass =
    "h-[46px] w-full rounded-[14px] border border-white/15 bg-white/[0.08] px-[17px] text-[14px] text-white placeholder:text-white/35 focus:outline-none";

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-[14px]">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <input
          name="firstName"
          type="text"
          required
          autoComplete="given-name"
          placeholder="First Name *"
          className={fieldClass}
        />
        <input
          name="lastName"
          type="text"
          required
          autoComplete="family-name"
          placeholder="Last Name *"
          className={fieldClass}
        />
      </div>

      <input
        name="email"
        type="email"
        required
        autoComplete="email"
        placeholder="Email *"
        className={fieldClass}
      />
      <input
        name="phone"
        type="tel"
        required
        autoComplete="tel"
        pattern={PHONE_PATTERN}
        title="Enter a valid phone number (8–20 digits, may include +, spaces, or dashes)"
        placeholder="Phone Number *"
        className={fieldClass}
      />

      <input type="hidden" name="position" value={position} />
      <select
        required
        value={position}
        onChange={(e) => handlePositionChange(e.target.value)}
        className={`${fieldClass} appearance-none`}
        aria-label="Position interested in"
      >
        <option value="" disabled className="bg-[#111111] text-white/60">
          Position interested in *
        </option>
        {positionParam && !uniquePositions.includes(positionParam) ? (
          <option value={positionParam} className="bg-[#111111] text-white">
            {positionParam}
          </option>
        ) : null}
        {uniquePositions.map((title) => (
          <option key={title} value={title} className="bg-[#111111] text-white">
            {title}
          </option>
        ))}
      </select>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <select
          name="salaryCurrency"
          required
          defaultValue="AUD"
          className={`${fieldClass} appearance-none`}
        >
          <option value="" disabled className="bg-[#111111] text-white/60">
            Currency *
          </option>
          {SALARY_CURRENCIES.map((c) => (
            <option key={c.code} value={c.code} className="bg-[#111111] text-white">
              {c.label}
            </option>
          ))}
        </select>
        <input
          name="salaryRate"
          type="text"
          required
          inputMode="numeric"
          value={salaryRateInput}
          onChange={(e) => setSalaryRateInput(formatSalaryRateDisplay(e.target.value))}
          placeholder="Rate *"
          className={fieldClass}
        />
        <select name="salaryMode" required className={`${fieldClass} appearance-none`}>
          <option value="" disabled className="bg-[#111111] text-white/60">
            Mode *
          </option>
          {SALARY_MODES.map((mode) => (
            <option key={mode} value={mode} className="bg-[#111111] text-white">
              {mode}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <input type="hidden" name="country" value={country} />
        <input
          type="text"
          readOnly
          value={country}
          placeholder="Country"
          className={`${fieldClass} cursor-default opacity-90`}
          aria-readonly="true"
          tabIndex={-1}
        />
        <input
          name="visaStatus"
          type="text"
          required
          placeholder="Visa status *"
          className={fieldClass}
        />
      </div>

      <label className="flex min-h-[100px] cursor-pointer flex-col items-center justify-center rounded-[14px] border border-white/15 bg-white/[0.08] px-4 py-4 text-center">
        <input
          name="documents"
          type="file"
          required={documentFiles.length === 0}
          multiple
          accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          className="sr-only"
          onChange={(e) => handleDocumentsChange(e.target.files)}
        />
        <p className="text-[14px] font-normal leading-5 tracking-[0.035px] text-white/35">
          Add Documents (resume, visa copies etc.) *
        </p>
        <p className="text-[10px] font-medium leading-[14px] tracking-[0.1px] text-white/35">
          PDF, DOC, DOCX (max 5MB each, up to 10 files)
        </p>
      </label>

      {documentFiles.length > 0 ? (
        <ul className="space-y-1 rounded-[14px] border border-white/10 bg-white/[0.04] px-3 py-2">
          {documentFiles.map((file, index) => (
            <li key={`${file.name}-${index}`} className="flex items-center justify-between gap-2 text-[13px] text-white/80">
              <span className="truncate">{file.name}</span>
              <button
                type="button"
                onClick={() => removeDocument(index)}
                className="shrink-0 rounded p-1 text-white/50 hover:text-white"
                aria-label={`Remove ${file.name}`}
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <input
        name="message"
        type="text"
        placeholder="Tell us about yourself..."
        className="h-12 w-full rounded-[14px] border border-white/15 bg-white/[0.08] px-[21px] text-[14px] text-white placeholder:text-white/60 focus:outline-none"
      />

      {status === "error" ? (
        <p className="text-sm text-red-300" role="alert">
          {errorMsg}
        </p>
      ) : null}
      {status === "success" ? (
        <p className="text-sm text-green-300" role="status">
          Thank you! Our team will review your application within 48 hours.
        </p>
      ) : null}

      <button
        type="submit"
        disabled={status === "loading"}
        className="mt-[18px] inline-flex h-12 w-full items-center justify-center gap-2 rounded-[18px] bg-white text-[16px] font-semibold leading-6 text-[#111111] disabled:opacity-70"
      >
        {status === "loading" ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
        Submit Application
        <ArrowRight className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden />
      </button>
    </form>
  );
}

export function CareersApplyForm({ jobs }: CareersApplyFormProps) {
  return (
    <Suspense fallback={<div className="mt-8 h-48 animate-pulse rounded-[14px] bg-white/10" />}>
      <CareersApplyFormInner jobs={jobs} />
    </Suspense>
  );
}
