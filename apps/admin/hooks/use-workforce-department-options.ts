"use client";

import { useEffect, useState } from "react";
import { fetchWorkforceDepartmentOptions } from "@/lib/workforce-department-options";

export function useWorkforceDepartmentOptions(currentDepartment?: string) {
  const [options, setOptions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const opts = await fetchWorkforceDepartmentOptions(currentDepartment);
        if (!cancelled) setOptions(opts);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [currentDepartment]);

  return { options, loading };
}
