"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  DEFAULT_STATUSES,
  DEFAULT_STRATEGY_STATUSES,
  statusColorClasses,
  statusesForFamily,
  type BoardFamily,
  type StatusOption,
} from "@/lib/tickets";

type TicketStatusesValue = {
  /** All statuses across WORK + STRATEGY (for badges on mixed lists). */
  allStatuses: StatusOption[];
  /** Work-family columns (default board / create). */
  statuses: StatusOption[];
  loading: boolean;
  labelOf: (key: string) => string;
  badgeClassOf: (key: string) => string;
  accentClassOf: (key: string) => string;
  swatchClassOf: (key: string) => string;
  statusesOf: (family: BoardFamily) => StatusOption[];
  reload: () => Promise<void>;
  /** Replace one family's list after a successful admin change. */
  setStatusesForFamily: (family: BoardFamily, rows: StatusOption[]) => void;
  /** @deprecated Prefer setStatusesForFamily("WORK", rows). */
  setStatuses: (rows: StatusOption[]) => void;
};

const TicketStatusesContext = createContext<TicketStatusesValue | null>(null);

function humanize(key: string): string {
  const text = key.replaceAll("_", " ").toLowerCase();
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function sortStatuses(rows: StatusOption[]): StatusOption[] {
  return [...rows].sort((a, b) => a.position - b.position);
}

export function TicketStatusesProvider({ children }: { children: ReactNode }) {
  const [allStatuses, setAllStatuses] = useState<StatusOption[]>([
    ...DEFAULT_STATUSES,
    ...DEFAULT_STRATEGY_STATUSES,
  ]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    try {
      const res = await fetch("/api/debug-portal/statuses?all=1", { credentials: "include" });
      const json = await res.json().catch(() => ({}));
      if (res.ok && Array.isArray(json?.data) && json.data.length) {
        setAllStatuses(sortStatuses(json.data as StatusOption[]));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const value = useMemo<TicketStatusesValue>(() => {
    const byKey = new Map(allStatuses.map((s) => [s.key, s]));
    const statusesOf = (family: BoardFamily) => statusesForFamily(allStatuses, family);
    return {
      allStatuses,
      statuses: statusesOf("WORK"),
      loading,
      labelOf: (key) => byKey.get(key)?.label ?? humanize(key),
      badgeClassOf: (key) => statusColorClasses(byKey.get(key)?.color).badge,
      accentClassOf: (key) => statusColorClasses(byKey.get(key)?.color).accent,
      swatchClassOf: (key) => statusColorClasses(byKey.get(key)?.color).swatch,
      statusesOf,
      reload,
      setStatusesForFamily: (family, rows) => {
        setAllStatuses((prev) => {
          const others = prev.filter((s) => (s.boardFamily ?? "WORK") !== family);
          return sortStatuses([
            ...others,
            ...rows.map((r) => ({ ...r, boardFamily: r.boardFamily ?? family })),
          ]);
        });
      },
      setStatuses: (rows) => {
        setAllStatuses((prev) => {
          const others = prev.filter((s) => (s.boardFamily ?? "WORK") !== "WORK");
          return sortStatuses([
            ...others,
            ...rows.map((r) => ({ ...r, boardFamily: r.boardFamily ?? ("WORK" as const) })),
          ]);
        });
      },
    };
  }, [allStatuses, loading, reload]);

  return <TicketStatusesContext.Provider value={value}>{children}</TicketStatusesContext.Provider>;
}

export function useTicketStatuses(): TicketStatusesValue {
  const ctx = useContext(TicketStatusesContext);
  if (!ctx) throw new Error("useTicketStatuses must be used inside TicketStatusesProvider");
  return ctx;
}
