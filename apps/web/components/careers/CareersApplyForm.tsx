"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowRight, Loader2 } from "lucide-react";

/** Must match packages/api/src/lib/validation.ts PHONE_REGEX */
const PHONE_PATTERN = String.raw`^\+?[\d\s().-]{8,20}$`;

type CareersApplyFormProps = {
  positions: string[];
};

function CareersApplyFormInner({ positions }: CareersApplyFormProps) {
  const searchParams = useSearchParams();
  const positionParam = searchParams.get("position") ?? "";
  const uniquePositions = [...new Set(positions.map((p) => p.trim()).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b),
  );
  const [position, setPosition] = useState(positionParam);
  const [resumeName, setResumeName] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (positionParam) setPosition(positionParam);
  }, [positionParam]);

  useEffect(() => {
    if (typeof window !== "undefined" && (window.location.hash === "#apply" || positionParam)) {
      document.getElementById("apply")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [positionParam]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg("");
    const form = e.currentTarget;
    const formData = new FormData(form);

    try {
      const resumeFile = formData.get("resume") as File | null;
      if (!resumeFile || resumeFile.size === 0) {
        throw new Error("Resume is required");
      }

      const uploadData = new FormData();
      uploadData.append("resume", resumeFile);
      const uploadRes = await fetch("/api/careers/upload-resume", {
        method: "POST",
        body: uploadData,
      });
      const uploadJson = await uploadRes.json();
      if (!uploadRes.ok) throw new Error(uploadJson.error || "Resume upload failed");
      const resumeUrl = uploadJson.data?.url as string | undefined;
      if (!resumeUrl) throw new Error("Resume upload failed");

      const salaryRaw = formData.get("salaryExpectation");
      const salaryExpectation = Number(salaryRaw);
      if (!Number.isFinite(salaryExpectation) || salaryExpectation <= 0) {
        throw new Error("Salary expectation is required");
      }

      const payload = {
        firstName: formData.get("firstName"),
        lastName: formData.get("lastName"),
        email: formData.get("email"),
        phone: formData.get("phone"),
        position: formData.get("position"),
        salaryExpectation,
        message: formData.get("message") || undefined,
        resumeUrl,
      };

      const res = await fetch("/api/careers/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Submission failed");

      setStatus("success");
      form.reset();
      setResumeName("");
      if (positionParam) setPosition(positionParam);
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  const positionLocked = Boolean(positionParam);
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

      <select
        name="position"
        required
        value={position}
        onChange={(e) => !positionLocked && setPosition(e.target.value)}
        disabled={positionLocked}
        className={`${fieldClass} appearance-none ${positionLocked ? "cursor-default opacity-90" : ""}`}
      >
        <option value="" disabled className="bg-[#111111] text-white/60">
          Select a position *
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

      <input
        name="salaryExpectation"
        type="number"
        required
        min={1}
        step={1}
        inputMode="numeric"
        placeholder="Salary expectation (AUD) *"
        className={fieldClass}
      />

      <label className="flex min-h-[100px] cursor-pointer flex-col items-center justify-center rounded-[14px] border border-white/15 bg-white/[0.08] px-4 py-4 text-center">
        <input
          name="resume"
          type="file"
          required
          accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          className="sr-only"
          onChange={(e) => setResumeName(e.target.files?.[0]?.name ?? "")}
        />
        <p className="text-[14px] font-normal leading-5 tracking-[0.035px] text-white/35">
          {resumeName ? resumeName : "Upload your resume *"}
        </p>
        <p className="text-[10px] font-medium leading-[14px] tracking-[0.1px] text-white/35">
          PDF, DOC, DOCX (max 5MB)
        </p>
      </label>

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

export function CareersApplyForm({ positions }: CareersApplyFormProps) {
  return (
    <Suspense fallback={<div className="mt-8 h-48 animate-pulse rounded-[14px] bg-white/10" />}>
      <CareersApplyFormInner positions={positions} />
    </Suspense>
  );
}
