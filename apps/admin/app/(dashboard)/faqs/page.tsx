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

interface FaqItem {
  id: string;
  question: string;
  category: string;
  order: number;
  published: boolean;
}

export default function FaqsPage() {
  const [faqs, setFaqs] = useState<FaqItem[]>([]);
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
  } = useListView(faqs, (faq) =>
    buildSearchHaystack([faq.question, faq.category, faq.order, faq.published ? "published" : "draft"]),
  );

  useEffect(() => {
    void fetchFaqs();
  }, []);

  async function fetchFaqs() {
    try {
      const res = await adminFetch("/api/admin/faqs/admin/all");
      const data = await res.json();
      setFaqs(data.data || []);
    } catch (error) {
      console.error("Error fetching FAQs:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function deleteFaq(id: string) {
    if (!(await appConfirm("Delete this FAQ?"))) return;
    try {
      const res = await adminFetch(`/api/admin/faqs/${id}`, { method: "DELETE" });
      if (res.ok) {
        const next = faqs.filter((f) => f.id !== id);
        setFaqs(next);
      }
    } catch (error) {
      console.error("Error deleting FAQ:", error);
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
          <h2 className="text-lg font-semibold">FAQs</h2>
          <p className="text-sm text-gray-500">Manage frequently asked questions shown on the Pricing page</p>
        </div>
        <Link
          href="/faqs/new"
          className="inline-flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800"
        >
          <Plus className="h-4 w-4" />
          Add FAQ
        </Link>
      </div>

      <AdminSearchField
        id="faq-search"
        value={search}
        onChange={setSearch}
        placeholder="Search by question or category…"
        filteredCount={totalItems}
        totalCount={totalSourceItems}
      />

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-200 bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Question</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Category</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Order</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
              <th className="px-4 py-3 text-right font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {faqs.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-400">No FAQs yet.</td>
              </tr>
            ) : totalItems === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-400">No FAQs match your search.</td>
              </tr>
            ) : (
              paginated.map((faq) => (
                <tr key={faq.id} className="hover:bg-gray-50">
                  <td className="max-w-[420px] truncate px-4 py-3 font-medium">{faq.question}</td>
                  <td className="px-4 py-3 capitalize text-gray-600">{faq.category}</td>
                  <td className="px-4 py-3 text-gray-600">{faq.order}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        faq.published ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {faq.published ? "Published" : "Draft"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex items-center gap-2">
                      <Link href={`/faqs/${faq.id}`} className="rounded p-1.5 text-gray-500 hover:bg-gray-100 hover:text-black">
                        <Edit className="h-4 w-4" />
                      </Link>
                      <button type="button" onClick={() => void deleteFaq(faq.id)} className="rounded p-1.5 text-gray-500 hover:bg-red-50 hover:text-red-600">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        {faqs.length > 0 ? (
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
