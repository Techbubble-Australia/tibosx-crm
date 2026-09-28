"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { adminFetch } from "@/lib/admin-api";
import { SignaturePad } from "@/components/agreements/SignaturePad";

type AgreementData = {
  memberId: string;
  projectId: string;
  projectTitle: string;
  projectNumber: string;
  templateName: string;
  html: string;
  signed: boolean;
  signedAt: string | null;
};

export default function AgreementPage() {
  const [agreement, setAgreement] = useState<AgreementData | null>(null);
  const [loading, setLoading] = useState(true);
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    void adminFetch("/api/admin/projects/my-agreement")
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          throw new Error((data as { error?: string }).error || "Failed to load agreement");
        }
        setAgreement(data.data as AgreementData);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load agreement");
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleSign() {
    if (!signatureDataUrl) {
      alert("Please draw your signature first.");
      return;
    }
    setSaving(true);
    try {
      const res = await adminFetch("/api/admin/projects/my-agreement/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signatureDataUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error((data as { error?: string }).error || "Failed to sign agreement");
      const refresh = await adminFetch("/api/admin/projects/my-agreement");
      const refreshData = await refresh.json();
      if (refresh.ok) setAgreement(refreshData.data as AgreementData);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to sign agreement");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error || !agreement) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-8 text-center dark:border-gray-700 dark:bg-gray-900">
        <p className="text-gray-600 dark:text-gray-300">{error || "No agreement assigned."}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{agreement.templateName}</h2>
        <p className="text-sm text-gray-500">
          {agreement.projectNumber} · {agreement.projectTitle}
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
        <iframe title="Agreement" className="h-[70vh] w-full bg-white" srcDoc={agreement.html} sandbox="" />
      </div>

      {agreement.signed ? (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800 dark:border-green-800 dark:bg-green-950/40 dark:text-green-300">
          Agreement signed
          {agreement.signedAt
            ? ` on ${new Date(agreement.signedAt).toLocaleString("en-AU", {
                day: "numeric",
                month: "short",
                year: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })}`
            : ""}
          .
        </div>
      ) : (
        <section className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
          <h3 className="mb-3 font-semibold text-gray-900 dark:text-gray-100">Your signature</h3>
          <SignaturePad onChange={setSignatureDataUrl} />
          <button
            type="button"
            onClick={() => void handleSign()}
            disabled={saving || !signatureDataUrl}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-black px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50 dark:bg-white dark:text-black"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Sign agreement
          </button>
        </section>
      )}
    </div>
  );
}
