"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { adminFetch } from "@/lib/admin-api";
import { useAdminSession } from "@/contexts/AdminSessionContext";

type SearchData = {
  leads: Array<{ id: string; name: string; company: string | null; email: string; status: string }>;
  clients: Array<{ id: string; name: string; website: string; country: string; status: string }>;
  opportunities: Array<{
    id: string;
    name: string;
    clientName: string;
    stage: string | null;
    amount: number;
    currency: string;
    active: boolean;
  }>;
};

/**
 * Wireframe header search: wide rounded field, placeholder only (no leading icon).
 */
export function GlobalCrmSearch() {
  const router = useRouter();
  const { canAccessSales, sessionLoaded } = useAdminSession();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<SearchData | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  useEffect(() => {
    if (!sessionLoaded || !canAccessSales) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const q = query.trim();
    if (q.length < 2) {
      setData(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    debounceRef.current = setTimeout(() => {
      void adminFetch(`/api/admin/crm/search?q=${encodeURIComponent(q)}`)
        .then((res) => res.json())
        .then((body) => {
          setData((body.data ?? null) as SearchData | null);
          setOpen(true);
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }, 220);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, sessionLoaded, canAccessSales]);

  if (!sessionLoaded || !canAccessSales) {
    // Keep layout space matching the wireframe search width even before sales session resolves.
    return (
      <div className="min-w-0 flex-1">
        <div className="h-9 w-full max-w-[36rem] rounded-lg border border-transparent bg-transparent" />
      </div>
    );
  }

  const hasResults =
    !!data &&
    (data.leads.length > 0 || data.clients.length > 0 || data.opportunities.length > 0);

  function go(href: string) {
    setOpen(false);
    setQuery("");
    router.push(href);
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    go(`/leads?q=${encodeURIComponent(q)}`);
  }

  return (
    <div className="relative min-w-0 flex-1" ref={rootRef}>
      <form onSubmit={onSubmit} className="w-full max-w-[36rem]">
        <input
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => {
            if (query.trim().length >= 2) setOpen(true);
          }}
          placeholder="Search leads, clients, opportunities"
          className="h-9 w-full rounded-lg border border-gray-200 bg-white px-3.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-300 focus:outline-none focus:ring-0 dark:border-gray-600 dark:bg-gray-950 dark:text-gray-100 dark:placeholder:text-gray-500"
          aria-label="Search leads, clients, opportunities"
        />
      </form>
      {open && query.trim().length >= 2 ? (
        <div className="absolute left-0 z-50 mt-1.5 w-full max-w-[36rem] overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-900">
          {loading && !data ? (
            <p className="px-3 py-3 text-sm text-gray-400">Searching…</p>
          ) : !hasResults ? (
            <p className="px-3 py-3 text-sm text-gray-400">No matches for “{query.trim()}”.</p>
          ) : (
            <div className="max-h-80 overflow-y-auto py-1">
              {data!.leads.length > 0 ? (
                <section>
                  <p className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                    Leads
                  </p>
                  {data!.leads.map((l) => (
                    <button
                      key={l.id}
                      type="button"
                      className="flex w-full flex-col px-3 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-800"
                      onClick={() =>
                        go(
                          `/leads?highlight=${encodeURIComponent(l.id)}&q=${encodeURIComponent(query.trim())}`,
                        )
                      }
                    >
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {l.company || l.name}
                      </span>
                      <span className="text-xs text-gray-500">
                        {l.company ? l.name : l.email} · {l.status}
                      </span>
                    </button>
                  ))}
                </section>
              ) : null}
              {data!.clients.length > 0 ? (
                <section>
                  <p className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                    Clients
                  </p>
                  {data!.clients.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      className="flex w-full flex-col px-3 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-800"
                      onClick={() => go(`/clients/${c.id}`)}
                    >
                      <span className="font-medium text-gray-900 dark:text-gray-100">{c.name}</span>
                      <span className="text-xs text-gray-500">
                        {c.country}
                        {c.website ? ` · ${c.website}` : ""}
                      </span>
                    </button>
                  ))}
                </section>
              ) : null}
              {data!.opportunities.length > 0 ? (
                <section>
                  <p className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                    Opportunities
                  </p>
                  {data!.opportunities.map((o) => (
                    <button
                      key={o.id}
                      type="button"
                      className="flex w-full flex-col px-3 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-800"
                      onClick={() => go(`/opportunities/${o.id}`)}
                    >
                      <span className="font-medium text-gray-900 dark:text-gray-100">{o.name}</span>
                      <span className="text-xs text-gray-500">
                        {o.clientName}
                        {o.stage ? ` · ${o.stage}` : ""}
                      </span>
                    </button>
                  ))}
                </section>
              ) : null}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
