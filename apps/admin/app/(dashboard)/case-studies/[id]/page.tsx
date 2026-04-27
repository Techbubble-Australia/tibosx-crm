"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { CaseStudyForm } from "@/components/case-study/CaseStudyForm";
import { adminFetch } from "@/lib/admin-api";

export default function EditCaseStudyPage() {
  const params = useParams();
  const id = params.id as string;
  const [data, setData] = useState<Record<string, unknown> | null | undefined>(undefined);

  useEffect(() => {
    async function load() {
      try {
        const res = await adminFetch(`/api/admin/case-studies/${encodeURIComponent(id)}`);
        if (!res.ok) {
          setData(null);
          return;
        }
        const body = await res.json();
        setData(body.data as Record<string, unknown>);
      } catch (e) {
        console.error(e);
        setData(null);
      }
    }
    void load();
  }, [id]);

  if (data === undefined) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-black border-t-transparent" />
      </div>
    );
  }

  if (data === null) {
    return (
      <div className="text-gray-600">
        Case study not found.{" "}
        <Link href="/case-studies" className="font-medium text-black underline">
          Back to list
        </Link>
      </div>
    );
  }

  return <CaseStudyForm initialRecord={data} />;
}
