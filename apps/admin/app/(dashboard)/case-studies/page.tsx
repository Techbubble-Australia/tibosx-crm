"use client";
import { appAlert, appConfirm } from "@/lib/app-alert";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Edit, Trash2, Eye, CopyPlus } from "lucide-react";
import { adminFetch } from "@/lib/admin-api";
import { TablePagination } from "@/components/ui/TablePagination";
import { AdminSearchField } from "@/components/ui/AdminSearchField";
import { useListView } from "@/hooks/useListView";
import { buildSearchHaystack } from "@/lib/search-text";

interface CaseStudy {
  id: string;
  title: string;
  slug: string;
  category: string;
  subcategory?: string;
  clientName: string;
  published: boolean;
  showInAllTab: boolean;
  publishedDate: string | null;
  createdAt: string;
}

const marketingSiteBase =
  typeof process.env.NEXT_PUBLIC_WEB_URL === "string" && process.env.NEXT_PUBLIC_WEB_URL.length > 0
    ? process.env.NEXT_PUBLIC_WEB_URL.replace(/\/$/, "")
    : "http://localhost:3000";

export default function CaseStudiesPage() {
  const router = useRouter();
  const [caseStudies, setCaseStudies] = useState<CaseStudy[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);
  const {
    search,
    setSearch,
    page,
    setPage,
    pageSize,
    setPageSize,
    paginated: paginatedCaseStudies,
    totalItems,
    totalSourceItems,
  } = useListView(caseStudies, (cs) =>
    buildSearchHaystack([
      cs.title,
      cs.slug,
      cs.category,
      cs.subcategory,
      cs.clientName,
      cs.published ? "published" : "draft",
    ]),
  );

  useEffect(() => {
    fetchCaseStudies();
  }, []);

  async function fetchCaseStudies() {
    try {
      const res = await adminFetch("/api/admin/case-studies/admin/all");
      const data = await res.json();
      setCaseStudies(data.data || []);
    } catch (error) {
      console.error("Error fetching case studies:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function openCaseStudyOnSite(cs: CaseStudy) {
    if (cs.published) {
      window.open(
        `${marketingSiteBase}/case-studies/${encodeURIComponent(cs.slug)}`,
        "_blank",
        "noopener,noreferrer",
      );
      return;
    }
    try {
      const res = await adminFetch("/api/admin/case-studies/preview-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: cs.slug }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        appAlert(
          (payload as { error?: string }).error ||
            "Could not open preview. Ensure the API has CASE_STUDY_PREVIEW_SECRET or JWT_SECRET (non-production).",
        );
        return;
      }
      const previewToken = (payload as { data?: { token?: string } }).data?.token;
      if (!previewToken) {
        appAlert("Preview token missing from API response.");
        return;
      }
      window.open(
        `${marketingSiteBase}/case-studies/${encodeURIComponent(cs.slug)}?preview=${encodeURIComponent(previewToken)}`,
        "_blank",
        "noopener,noreferrer",
      );
    } catch (e) {
      console.error(e);
      appAlert("Failed to open preview.");
    }
  }

  async function duplicateCaseStudy(cs: CaseStudy) {
    setDuplicatingId(cs.id);
    try {
      const res = await adminFetch(`/api/admin/case-studies/${encodeURIComponent(cs.id)}/duplicate`, {
        method: "POST",
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        appAlert((payload as { error?: string }).error || "Duplicate failed");
        return;
      }
      const newId = (payload as { data?: { id?: string } }).data?.id;
      if (!newId) {
        appAlert("Duplicate succeeded but no id returned.");
        return;
      }
      await fetchCaseStudies();
      router.push(`/case-studies/${newId}`);
    } catch (error) {
      console.error("Error duplicating case study:", error);
      appAlert("Duplicate failed");
    } finally {
      setDuplicatingId(null);
    }
  }

  async function deleteCaseStudy(id: string) {
    if (!(await appConfirm("Are you sure you want to delete this case study?"))) return;

    try {
      const res = await adminFetch(`/api/admin/case-studies/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        const next = caseStudies.filter((cs) => cs.id !== id);
        setCaseStudies(next);
      }
    } catch (error) {
      console.error("Error deleting case study:", error);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-black border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold">All Case Studies</h2>
          <p className="text-gray-500 text-sm">Manage your case studies</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/case-studies/categories"
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium hover:bg-gray-50"
          >
            Categories &amp; Subcategories
          </Link>
          <Link
            href="/case-studies/new"
            className="inline-flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add New
          </Link>
        </div>
      </div>

      <AdminSearchField
        id="case-study-search"
        value={search}
        onChange={setSearch}
        placeholder="Search by title, slug, category, client…"
        filteredCount={totalItems}
        totalCount={totalSourceItems}
      />

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden dark:border-gray-700 dark:bg-gray-900">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Title</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Category</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Client</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Status</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">All tab</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Date</th>
              <th className="text-right px-6 py-4 text-sm font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {caseStudies.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-gray-500">
                  No case studies found. Create your first one!
                </td>
              </tr>
            ) : totalItems === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-gray-500">
                  No case studies match your search.
                </td>
              </tr>
            ) : (
              paginatedCaseStudies.map((cs) => (
                <tr key={cs.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="font-medium">{cs.title}</div>
                    <div className="text-sm text-gray-500">/{cs.slug}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {cs.category}
                    </span>
                    {cs.subcategory ? (
                      <span className="mt-1 block text-xs text-gray-500">{cs.subcategory}</span>
                    ) : null}
                  </td>
                  <td className="px-6 py-4 text-sm">{cs.clientName}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        cs.published
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {cs.published ? "Published" : "Draft"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {cs.showInAllTab !== false ? "Yes" : "No"}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(cs.publishedDate ?? cs.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => void duplicateCaseStudy(cs)}
                        disabled={duplicatingId === cs.id}
                        className="p-2 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-40"
                        title="Duplicate as draft"
                      >
                        <CopyPlus className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => void openCaseStudyOnSite(cs)}
                        className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                        title={
                          cs.published
                            ? "View on marketing site"
                            : "Preview draft on marketing site (signed link)"
                        }
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <Link
                        href={`/case-studies/${cs.id}`}
                        className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => deleteCaseStudy(cs.id)}
                        className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        {caseStudies.length > 0 ? (
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
