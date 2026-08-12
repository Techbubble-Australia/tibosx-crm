"use client";

import { useEffect, useMemo, useState } from "react";
import { adminFetch } from "@/lib/admin-api";
import { AdminSearchField } from "@/components/ui/AdminSearchField";
import { TablePagination } from "@/components/ui/TablePagination";
import { useListView } from "@/hooks/useListView";
import { buildSearchHaystack } from "@/lib/search-text";

type CategoryOption = { id: string; name: string };

type TechnologyItem = {
  id: string;
  name: string;
  order: number;
  categoryId: string;
  category?: { id: string; name: string };
};

export function TechnologyTaxonomyManager() {
  const [items, setItems] = useState<TechnologyItem[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [newCategoryId, setNewCategoryId] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editCategoryId, setEditCategoryId] = useState("");
  const [saving, setSaving] = useState(false);

  const filteredItems = useMemo(() => {
    if (!newCategoryId) return items;
    return items.filter((item) => item.categoryId === newCategoryId);
  }, [items, newCategoryId]);

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
  } = useListView(filteredItems, (item) =>
    buildSearchHaystack([item.name, item.category?.name, item.order]),
  );

  const selectedCategoryName = categories.find((cat) => cat.id === newCategoryId)?.name;

  async function load() {
    try {
      const [techRes, catRes] = await Promise.all([
        adminFetch("/api/admin/job-technologies"),
        adminFetch("/api/admin/job-categories"),
      ]);
      const techData = await techRes.json();
      const catData = await catRes.json();
      setItems(techData.data ?? []);
      const cats = (catData.data ?? []) as CategoryOption[];
      setCategories(cats);
      if (!newCategoryId && cats[0]?.id) {
        setNewCategoryId(cats[0].id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [newCategoryId, setPage]);

  async function addItem() {
    const name = newName.trim();
    if (!name || !newCategoryId) return;
    setSaving(true);
    try {
      const res = await adminFetch("/api/admin/job-technologies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, categoryId: newCategoryId, order: items.length }),
      });
      if (!res.ok) throw new Error("Failed");
      setNewName("");
      await load();
    } catch {
      alert("Failed to add technology");
    } finally {
      setSaving(false);
    }
  }

  async function saveEdit(id: string) {
    const name = editName.trim();
    if (!name || !editCategoryId) return;
    setSaving(true);
    try {
      const res = await adminFetch(`/api/admin/job-technologies/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, categoryId: editCategoryId }),
      });
      if (!res.ok) throw new Error("Failed");
      setEditingId(null);
      await load();
    } catch {
      alert("Failed to update technology");
    } finally {
      setSaving(false);
    }
  }

  async function removeItem(id: string, name: string) {
    if (
      !confirm(
        `Delete "${name}"? Existing job listings using this value will keep the text but it won't appear in dropdowns.`,
      )
    ) {
      return;
    }
    try {
      const res = await adminFetch(`/api/admin/job-technologies/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      await load();
    } catch {
      alert("Failed to delete technology");
    }
  }

  if (loading) {
    return (
      <div className="flex h-32 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-black border-t-transparent dark:border-white dark:border-t-transparent" />
      </div>
    );
  }

  const inputClass =
    "rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-black dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:focus:ring-white";

  return (
    <section className="space-y-6 rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
      <div>
        <h3 className="font-semibold text-gray-900 dark:text-gray-100">Technologies</h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Manage technology options for jobs and case studies. Each technology must belong to a category.
        </p>
      </div>

      {categories.length === 0 ? (
        <p className="text-sm text-amber-700 dark:text-amber-300">
          Add at least one category before creating technologies.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,12rem)_minmax(0,1fr)_auto] sm:items-center">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300" htmlFor="technology-category-filter">
              Category
            </label>
            <select
              id="technology-category-filter"
              value={newCategoryId}
              onChange={(e) => setNewCategoryId(e.target.value)}
              className={inputClass}
              aria-label="Filter technologies by category"
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300" htmlFor="technology-new-name">
              New technology
            </label>
            <input
              id="technology-new-name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="New technology…"
              className={inputClass}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void addItem();
                }
              }}
            />
          </div>
          <div className="sm:pt-6">
            <button
              type="button"
              disabled={saving || !newName.trim() || !newCategoryId}
              onClick={() => void addItem()}
              className="w-full rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-gray-200 sm:w-auto"
            >
              Add
            </button>
          </div>
        </div>
      )}

      <AdminSearchField
        id="technology-search"
        value={search}
        onChange={setSearch}
        placeholder={`Search in ${selectedCategoryName ?? "category"}…`}
        filteredCount={totalItems}
        totalCount={totalSourceItems}
      />

      <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
        <ul className="divide-y divide-gray-100 dark:divide-gray-700">
          {items.length === 0 ? (
            <li className="px-4 py-8 text-center text-sm text-gray-400">No technologies yet.</li>
          ) : filteredItems.length === 0 ? (
            <li className="px-4 py-8 text-center text-sm text-gray-400">
              No technologies in {selectedCategoryName ?? "this category"} yet.
            </li>
          ) : totalItems === 0 ? (
            <li className="px-4 py-8 text-center text-sm text-gray-400">No technologies match your search.</li>
          ) : (
            paginated.map((item) => (
              <li
                key={item.id}
                className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                {editingId === item.id ? (
                  <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
                    <select
                      value={editCategoryId}
                      onChange={(e) => setEditCategoryId(e.target.value)}
                      className={`${inputClass} sm:w-44`}
                      aria-label="Edit technology category"
                    >
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                    <input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className={`${inputClass} min-w-0 flex-1`}
                      autoFocus
                    />
                    <div className="flex shrink-0 gap-3">
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() => void saveEdit(item.id)}
                        className="text-sm font-medium text-black dark:text-white"
                      >
                        Save
                      </button>
                      <button type="button" onClick={() => setEditingId(null)} className="text-sm text-gray-500">
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="min-w-0 pr-2">
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{item.name}</span>
                      <span className="mt-1 block text-xs text-gray-500 dark:text-gray-400">
                        Category: {item.category?.name ?? "—"}
                      </span>
                    </div>
                    <div className="flex shrink-0 gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(item.id);
                          setEditName(item.name);
                          setEditCategoryId(item.categoryId);
                        }}
                        className="text-sm text-gray-600 hover:text-black dark:text-gray-400 dark:hover:text-white"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => void removeItem(item.id, item.name)}
                        className="text-sm text-red-600 hover:text-red-700"
                      >
                        Delete
                      </button>
                    </div>
                  </>
                )}
              </li>
            ))
          )}
        </ul>
        {filteredItems.length > 0 ? (
          <TablePagination
            page={page}
            pageSize={pageSize}
            totalItems={totalItems}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        ) : null}
      </div>
    </section>
  );
}
