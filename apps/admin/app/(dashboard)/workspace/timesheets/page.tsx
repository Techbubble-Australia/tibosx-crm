"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function WorkspaceTimesheetsIndexPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/workspace/timesheets/submitted");
  }, [router]);

  return (
    <div className="flex justify-center py-16">
      <Loader2 className="h-8 w-8 animate-spin text-sky-600" aria-label="Loading timesheets" />
    </div>
  );
}
