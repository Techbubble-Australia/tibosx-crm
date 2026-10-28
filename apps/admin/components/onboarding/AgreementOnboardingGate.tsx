"use client";
import { appAlert, appConfirm } from "@/lib/app-alert";

import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { adminFetch } from "@/lib/admin-api";
import { useAdminSession } from "@/contexts/AdminSessionContext";
import {
  AgreementSigningDocument,
  type AgreementSigningDocumentHandle,
} from "@/components/agreements/AgreementSigningDocument";

type AgreementData = {
  templateName: string;
  projectTitle: string;
  projectNumber: string;
  html: string;
  signed: boolean;
  signatureCaptureIds?: string[];
};

function extractAgreementBody(html: string): string {
  const match = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  return match?.[1]?.trim() ? match[1].trim() : html;
}

export function AgreementOnboardingGate() {
  const { sessionLoaded, memberOnboarding, refreshSession, impersonation } = useAdminSession();
  const [agreement, setAgreement] = useState<AgreementData | null>(null);
  const [loading, setLoading] = useState(true);
  const [signatures, setSignatures] = useState<Record<string, string>>({});
  const [signedCaptureIds, setSignedCaptureIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const signDocRef = useRef<AgreementSigningDocumentHandle>(null);

  const needsAgreementSigning = Boolean(
    memberOnboarding?.hasAgreementAssignment && !memberOnboarding.agreementSigned,
  );

  const captureIds = useMemo(() => agreement?.signatureCaptureIds ?? [], [agreement?.signatureCaptureIds]);
  const bodyHtml = useMemo(() => (agreement ? extractAgreementBody(agreement.html) : ""), [agreement]);
  const allSigned = captureIds.length > 0 && signedCaptureIds.length === captureIds.length;
  const showModal =
    sessionLoaded && needsAgreementSigning && agreement && !agreement.signed;

  useEffect(() => {
    if (!sessionLoaded) return;
    if (!needsAgreementSigning) {
      setAgreement(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    void adminFetch("/api/admin/projects/my-agreement")
      .then(async (res) => {
        if (res.status === 404) return null;
        const data = await res.json();
        if (!res.ok) return null;
        return data.data as AgreementData;
      })
      .then((row) => setAgreement(row))
      .finally(() => setLoading(false));
  }, [sessionLoaded, needsAgreementSigning]);

  async function handleSubmit() {
    if (!allSigned) {
      appAlert("Please sign every signature field in the agreement.");
      return;
    }
    setSaving(true);
    try {
      const res = await adminFetch("/api/admin/projects/my-agreement/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signatures }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error((data as { error?: string }).error || "Failed to sign agreement");
      await refreshSession();
      window.location.reload();
    } catch (err) {
      appAlert(err instanceof Error ? err.message : "Failed to sign agreement");
    } finally {
      setSaving(false);
    }
  }

  if (loading || !showModal) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-900">
        <div className="border-b border-gray-100 px-6 py-4 dark:border-gray-800">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{agreement.templateName}</h2>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Sign your agreement before using TIBOSX.AI. Click each highlighted signature field.
              </p>
              {impersonation ? (
                <p className="mt-2 text-sm font-medium text-amber-800 dark:text-amber-200">
                  You are impersonating this user — signing will count as their agreement.
                </p>
              ) : null}
            </div>
            {captureIds.some((id) => !signedCaptureIds.includes(id)) ? (
              <button
                type="button"
                onClick={() => signDocRef.current?.signNext()}
                className="shrink-0 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium hover:bg-gray-50 dark:border-gray-600"
              >
                Sign next →
              </button>
            ) : null}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <AgreementSigningDocument
            ref={signDocRef}
            html={bodyHtml}
            captureIds={captureIds}
            signedCaptureIds={signedCaptureIds}
            onSignedCaptureIdsChange={setSignedCaptureIds}
            signatures={signatures}
            onSignaturesChange={setSignatures}
          />
        </div>
        <div className="border-t border-gray-100 px-6 py-4 dark:border-gray-800">
          {allSigned ? (
            <button
              type="button"
              onClick={() => void handleSubmit()}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg bg-black px-5 py-2.5 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Submit signed agreement
            </button>
          ) : (
            <p className="text-sm text-gray-500">
              {captureIds.length
                ? `${signedCaptureIds.length} of ${captureIds.length} signature fields completed.`
                : "No signature fields found — contact your administrator."}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
