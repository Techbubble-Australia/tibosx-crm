"use client";

import { useEffect, useState } from "react";
import { adminFetch } from "@/lib/admin-api";
import { FALLBACK_PROFILE_LEVELS } from "@/lib/profile-levels";

export function useJobLevels(): string[] {
  const [levels, setLevels] = useState<string[]>([...FALLBACK_PROFILE_LEVELS]);

  useEffect(() => {
    void adminFetch("/api/admin/job-levels")
      .then((res) => res.json())
      .then((data) => {
        const names = (data.data ?? [])
          .map((row: { name?: string }) => row.name?.trim())
          .filter((name: string | undefined): name is string => Boolean(name));
        if (names.length > 0) {
          setLevels(names);
        }
      })
      .catch(console.error);
  }, []);

  return levels;
}
