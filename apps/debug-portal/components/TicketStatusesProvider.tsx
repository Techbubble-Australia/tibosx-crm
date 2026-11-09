"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { DEFAULT_STATUSES, statusColorClasses, type StatusOption } from "@/lib/tickets";

type TicketStatusesValue = {
  /** Board columns, left to right. */
  statuses: StatusOption[];
  loading: boolean;
  labelOf: (key: string) => string;
  badgeClassOf: (key: string) => string;
  accentClassOf: (key: string) => string;
  swatchClassOf: (key: string) => string;
  reload: () => Promise<void>;
  /** Replace the list after a successful admin change (the API returns the full ordered list). */
  setStatuses: (rows: StatusOption[]) => void;
};

const TicketStatusesContext = createContext<TicketStatusesValue | null>(null);

function humanize(key: string): string {
  const text = key.replaceAll("_", " ").toLowerCase();
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function TicketStatusesProvider({ children }: { children: ReactNode }) {
  const [statuses, setStatusesState] = useState<StatusOption[]>(DEFAULT_STATUSES);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    try {
      const res = await fetch("/api/debug-portal/statuses", { credentials: "include" });
      const json = await res.json().catch(() => ({}));
      if (res.ok && Array.isArray(json?.data) && json.data.length) {
        setStatusesState(json.data as StatusOption[]);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const value = useMemo<TicketStatusesValue>(() => {
    const byKey = new Map(statuses.map((s) => [s.key, s]));
    return {
      statuses,
      loading,
      labelOf: (key) => byKey.get(key)?.label ?? humanize(key),
      badgeClassOf: (key) => statusColorClasses(byKey.get(key)?.color).badge,
      accentClassOf: (key) => statusColorClasses(byKey.get(key)?.color).accent,
      swatchClassOf: (key) => statusColorClasses(byKey.get(key)?.color).swatch,
      reload,
      setStatuses: (rows) => setStatusesState([...rows].sort((a, b) => a.position - b.position)),
    };
  }, [statuses, loading, reload]);

  return <TicketStatusesContext.Provider value={value}>{children}</TicketStatusesContext.Provider>;
}

export function useTicketStatuses(): TicketStatusesValue {
  const ctx = useContext(TicketStatusesContext);
  if (!ctx) throw new Error("useTicketStatuses must be used inside TicketStatusesProvider");
  return ctx;
}
