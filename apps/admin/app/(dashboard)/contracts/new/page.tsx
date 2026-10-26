"use client";
import { appAlert, appConfirm } from "@/lib/app-alert";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { adminFetch } from "@/lib/admin-api";
import { ContractForm, type ContractFormValues } from "@/components/contracts/ContractForm";
import { useAdminSession } from "@/contexts/AdminSessionContext";

function todayDateInput() {
  return new Date().toISOString().slice(0, 10);
}

function NewContractPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const careerApplicationId = searchParams.get("careerApplicationId");
  const { userId } = useAdminSession();
  const [isSaving, setIsSaving] = useState(false);
  const [loadingPrefill, setLoadingPrefill] = useState(Boolean(careerApplicationId));
  const [formDefaults, setFormDefaults] = useState<Partial<ContractFormValues>>({});

  useEffect(() => {
    if (!careerApplicationId) return;
    async function loadApplication() {
      try {
        const res = await adminFetch(`/api/admin/careers/admin/applications/${careerApplicationId}`);
        const data = await res.json();
        if (!res.ok) {
          throw new Error((data as { error?: string }).error || "Failed to load application");
        }
        const app = data.data as {
          jobTitle?: string | null;
          position?: string;
          clientId?: string | null;
          firstName?: string;
          lastName?: string;
          status?: string;
        };
        setFormDefaults({
          type: "T_AND_M",
          startDate: todayDateInput(),
          clientId: app.clientId ?? "",
          title: app.jobTitle?.trim() || app.position?.trim() || "Contract",
          careerApplication: {
            id: careerApplicationId as string,
            firstName: app.firstName ?? "",
            lastName: app.lastName ?? "",
            position: app.position ?? "",
            status: app.status ?? "SELECTED",
            jobTitle: app.jobTitle ?? null,
          },
        });
      } catch (error) {
        appAlert(error instanceof Error ? error.message : "Failed to load application");
      } finally {
        setLoadingPrefill(false);
      }
    }
    void loadApplication();
  }, [careerApplicationId]);

  async function handleSubmit(payload: Record<string, unknown>) {
    setIsSaving(true);
    try {
      if (careerApplicationId) {
        payload.careerApplicationId = careerApplicationId;
      }
      const res = await adminFetch("/api/admin/contracts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error((data as { error?: string }).error || "Failed to create contract");
      router.push(`/contracts/${(data.data as { id: string }).id}`);
    } catch (error) {
      appAlert(error instanceof Error ? error.message : "Failed to create contract");
    } finally {
      setIsSaving(false);
    }
  }

  if (loadingPrefill) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-black border-t-transparent dark:border-white" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/contracts/active" className="rounded p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">New Contract</h2>
      </div>
      <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
        <ContractForm
          key={careerApplicationId ?? "new"}
          defaults={formDefaults}
          defaultOwnerId={userId}
          onSubmit={handleSubmit}
          isSaving={isSaving}
        />
      </div>
    </div>
  );
}

export default function NewContractPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-black border-t-transparent dark:border-white" />
        </div>
      }
    >
      <NewContractPageInner />
    </Suspense>
  );
}
