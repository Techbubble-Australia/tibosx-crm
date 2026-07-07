"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowRight, Loader2 } from "lucide-react";

function CareersApplyFormInner() {
  const searchParams = useSearchParams();
  const positionParam = searchParams.get("position") ?? "";
  const [position, setPosition] = useState(positionParam);
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
      let resumeUrl: string | undefined;
      const resumeFile = formData.get("resume") as File | null;
      if (resumeFile && resumeFile.size > 0) {
        const uploadData = new FormData();
        uploadData.append("resume", resumeFile);
        const uploadRes = await fetch("/api/careers/upload-resume", {
          method: "POST",
          body: uploadData,
        });
        const uploadJson = await uploadRes.json();
        if (!uploadRes.ok) throw new Error(uploadJson.error || "Resume upload failed");
        resumeUrl = uploadJson.data?.url;
      }

      const payload = {
        firstName: formData.get("firstName"),
        lastName: formData.get("lastName"),
        email: formData.get("email"),
        phone: formData.get("phone") || undefined,
        position: formData.get("position"),
        company: formData.get("company") || undefined,
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
      if (positionParam) setPosition(positionParam);
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  const positionLocked = Boolean(positionParam);

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-[14px]">
      <div className="grid grid-cols-2 gap-3">
        <input
          name="firstName"
          type="text"
          required
          placeholder="First Name *"
          className="h-[46px] rounded-[14px] border border-white/15 bg-white/[0.08] px-[17px] text-[14px] text-white placeholder:text-white/35 focus:outline-none"
        />
        <input
          name="lastName"
          type="text"
          required
          placeholder="Last Name *"
          className="h-[46px] rounded-[14px] border border-white/15 bg-white/[0.08] px-[17px] text-[14px] text-white placeholder:text-white/35 focus:outline-none"
        />
      </div>

      <input
        name="email"
        type="email"
        required
        placeholder="Email *"
        className="h-[46px] w-full rounded-[14px] border border-white/15 bg-white/[0.08] px-[17px] text-[14px] text-white placeholder:text-white/35 focus:outline-none"
      />
      <input
        name="phone"
        type="tel"
        placeholder="Phone Number"
        className="h-[46px] w-full rounded-[14px] border border-white/15 bg-white/[0.08] px-[17px] text-[14px] text-white placeholder:text-white/35 focus:outline-none"
      />
      <input
        name="position"
        type="text"
        required
        value={position}
        onChange={(e) => !positionLocked && setPosition(e.target.value)}
        readOnly={positionLocked}
        placeholder="Position interested in *"
        className={`h-[46px] w-full rounded-[14px] border border-white/15 bg-white/[0.08] px-[17px] text-[14px] text-white placeholder:text-white/35 focus:outline-none ${
          positionLocked ? "cursor-default opacity-90" : ""
        }`}
      />
      <input
        name="company"
        type="text"
        placeholder="Company Name"
        className="h-[46px] w-full rounded-[14px] border border-white/15 bg-white/[0.08] px-[17px] text-[14px] text-white placeholder:text-white/35 focus:outline-none"
      />

      <label className="flex h-[100px] cursor-pointer flex-col items-center justify-center rounded-[14px] border border-white/15 bg-white/[0.08] text-center">
        <input name="resume" type="file" accept=".pdf,.doc,.docx,application/pdf" className="sr-only" />
        <p className="text-[14px] font-normal leading-5 tracking-[0.035px] text-white/35">Upload your resume</p>
        <p className="text-[10px] font-medium leading-[14px] tracking-[0.1px] text-white/35">PDF, DOC, DOCX (max 5MB)</p>
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

export function CareersApplyForm() {
  return (
    <Suspense fallback={<div className="mt-8 h-48 animate-pulse rounded-[14px] bg-white/10" />}>
      <CareersApplyFormInner />
    </Suspense>
  );
}
