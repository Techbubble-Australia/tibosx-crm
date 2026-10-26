"use client";
import { appAlert, appConfirm } from "@/lib/app-alert";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Edit, Trash2 } from "lucide-react";
import { adminFetch } from "@/lib/admin-api";
import { AdminSearchField } from "@/components/ui/AdminSearchField";
import { TablePagination } from "@/components/ui/TablePagination";
import { useListView } from "@/hooks/useListView";
import { buildSearchHaystack } from "@/lib/search-text";

interface Testimonial {
  id: string;
  authorName: string;
  authorTitle: string;
  authorCompany: string;
  quote: string;
  order: number;
  published: boolean;
}

export default function TestimonialsPage() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
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
  } = useListView(testimonials, (t) =>
    buildSearchHaystack([
      t.quote,
      t.authorName,
      t.authorTitle,
      t.authorCompany,
      t.published ? "published" : "draft",
    ]),
  );

  useEffect(() => {
    void fetchTestimonials();
  }, []);

  async function fetchTestimonials() {
    try {
      const res = await adminFetch("/api/admin/testimonials/all");
      const data = await res.json();
      setTestimonials(data.data || []);
    } catch (error) {
      console.error("Error fetching testimonials:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function deleteTestimonial(id: string) {
    if (!(await appConfirm("Delete this testimonial?"))) return;
    try {
      const res = await adminFetch(`/api/admin/testimonials/${id}`, { method: "DELETE" });
      if (res.ok) setTestimonials(testimonials.filter((t) => t.id !== id));
    } catch (error) {
      console.error("Error deleting testimonial:", error);
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
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Testimonials</h2>
          <p className="text-sm text-gray-500">Manage client stories shown across the website</p>
        </div>
        <Link
          href="/testimonials/new"
          className="inline-flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800"
        >
          <Plus className="h-4 w-4" />
          Add Testimonial
        </Link>
      </div>

      <AdminSearchField
        id="testimonial-search"
        value={search}
        onChange={setSearch}
        placeholder="Search by quote, author, or company…"
        filteredCount={totalItems}
        totalCount={totalSourceItems}
      />

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="space-y-3 p-4">
          {testimonials.length === 0 ? (
            <div className="px-2 py-12 text-center text-gray-400">No testimonials yet.</div>
          ) : totalItems === 0 ? (
            <div className="px-2 py-12 text-center text-gray-400">No testimonials match your search.</div>
          ) : (
            paginated.map((t) => (
              <div key={t.id} className="flex items-start gap-4 rounded-xl border border-gray-200 p-4">
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-sm italic text-gray-600">&ldquo;{t.quote}&rdquo;</p>
                  <p className="mt-2 text-sm font-semibold text-gray-900">{t.authorName}</p>
                  <p className="text-xs text-gray-500">{t.authorTitle} · {t.authorCompany}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      t.published ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {t.published ? "Published" : "Draft"}
                  </span>
                  <Link href={`/testimonials/${t.id}`} className="rounded p-1.5 text-gray-500 hover:bg-gray-100 hover:text-black">
                    <Edit className="h-4 w-4" />
                  </Link>
                  <button type="button" onClick={() => void deleteTestimonial(t.id)} className="rounded p-1.5 text-gray-500 hover:bg-red-50 hover:text-red-600">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
        {testimonials.length > 0 ? (
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
