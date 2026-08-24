import { useEffect, useMemo, useState } from "react";
import { matchesSearch } from "@/lib/search-text";

type UseListViewOptions = {
  initialPageSize?: number;
  pageSizeStorageKey?: string;
  pageSizeOptions?: number[];
};

function readStoredPageSize(key: string, fallback: number, allowed: number[]): number {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = Number(raw);
    if (allowed.includes(parsed)) return parsed;
  } catch {
    // ignore
  }
  return fallback;
}

export function useListView<T>(items: T[], getHaystack: (item: T) => string, options?: UseListViewOptions) {
  const pageSizeOptions = options?.pageSizeOptions ?? [10, 25, 50, 100, 200];
  const defaultPageSize = options?.initialPageSize ?? 10;
  const initialPageSize = options?.pageSizeStorageKey
    ? readStoredPageSize(options.pageSizeStorageKey, defaultPageSize, pageSizeOptions)
    : defaultPageSize;
  const [search, setSearchState] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSizeState] = useState(initialPageSize);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => matchesSearch(getHaystack(item), q));
  }, [items, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);

  const paginated = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, safePage, pageSize]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  function setSearch(value: string) {
    setSearchState(value);
    setPage(1);
  }

  function setPageSize(size: number) {
    setPageSizeState(size);
    if (options?.pageSizeStorageKey) {
      try {
        localStorage.setItem(options.pageSizeStorageKey, String(size));
      } catch {
        // ignore
      }
    }
    setPage(1);
  }

  function adjustPageAfterDelete(nextTotal: number) {
    const nextTotalPages = Math.max(1, Math.ceil(nextTotal / pageSize));
    if (page > nextTotalPages) {
      setPage(nextTotalPages);
    }
  }

  return {
    search,
    setSearch,
    page: safePage,
    setPage,
    pageSize,
    setPageSize,
    filtered,
    paginated,
    totalItems: filtered.length,
    totalSourceItems: items.length,
    adjustPageAfterDelete,
    pageSizeOptions,
  };
}
