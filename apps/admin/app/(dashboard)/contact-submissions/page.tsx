"use client";

import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { adminFetch } from "@/lib/admin-api";
import { AdminSearchField } from "@/components/ui/AdminSearchField";
import { TablePagination } from "@/components/ui/TablePagination";
import { useListView } from "@/hooks/useListView";
import { buildSearchHaystack } from "@/lib/search-text";

interface ContactSubmission {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  company?: string;
  interest?: string;
  country?: string;
  message: string;
  createdAt: string;
}

export default function ContactSubmissionsPage() {
  const [submissions, setSubmissions] = useState<ContactSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const {
    search,
    setSearch,
    page,
    setPage,
    pageSize,
    setPageSize,
    paginated,
    totalItems,
    totalSourceItems,
  } = useListView(submissions, (sub) =>
    buildSearchHaystack([
      sub.firstName,
      sub.lastName,
      sub.email,
      sub.phone,
      sub.company,
      sub.interest,
      sub.country,
      sub.message,
    ]),
  );

  useEffect(() => {
    void fetchSubmissions();
  }, []);

  async function fetchSubmissions() {
    try {
      const res = await adminFetch("/api/admin/contact-submissions/admin/submissions");
      const data = await res.json();
      setSubmissions(data.data || []);
    } catch (error) {
      console.error("Error fetching submissions:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function deleteSubmission(id: string) {
    if (!confirm("Permanently delete this submission?")) return;
    try {
      const res = await adminFetch(`/api/admin/contact-submissions/admin/submissions/${id}`, {
        method: "DELETE",
      });
      if (res.ok) setSubmissions((s) => s.filter((x) => x.id !== id));
    } catch (error) {
      console.error("Error deleting submission:", error);
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-black border-t-transparent" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-lg font-semibold">Contact Submissions</h2>
        <p className="text-sm text-gray-500">
          {totalSourceItems} submission{totalSourceItems !== 1 ? "s" : ""} received
        </p>
      </div>

      <AdminSearchField
        id="contact-search"
        value={search}
        onChange={setSearch}
        placeholder="Search by name, email, company, message…"
        filteredCount={totalItems}
        totalCount={totalSourceItems}
      />

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="space-y-3 p-4">
          {submissions.length === 0 ? (
            <div className="px-2 py-12 text-center text-gray-400">No contact submissions yet.</div>
          ) : totalItems === 0 ? (
            <div className="px-2 py-12 text-center text-gray-400">No submissions match your search.</div>
          ) : (
            paginated.map((sub) => (
              <div key={sub.id} className="rounded-xl border border-gray-200 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-gray-900">{sub.firstName} {sub.lastName}</p>
                    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
                      <a href={`mailto:${sub.email}`} className="hover:text-black hover:underline">{sub.email}</a>
                      {sub.phone ? <span>{sub.phone}</span> : null}
                      {sub.company ? <span>{sub.company}</span> : null}
                      {sub.country ? <span>{sub.country}</span> : null}
                      {sub.interest ? (
                        <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                          {sub.interest}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-3 border-t border-gray-100 pt-3 text-sm text-gray-700">{sub.message}</p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <span className="text-xs text-gray-400">
                      {new Date(sub.createdAt).toLocaleDateString("en-AU", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                    <button
                      type="button"
                      onClick={() => void deleteSubmission(sub.id)}
                      className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                      aria-label="Delete submission"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        {submissions.length > 0 ? (
          <TablePagination
            page={page}
            pageSize={pageSize}
            totalItems={totalItems}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        ) : null}
      </div>
    </div>
  );
}
