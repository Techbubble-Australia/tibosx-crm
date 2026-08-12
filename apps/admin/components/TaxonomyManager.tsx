"use client";

import { useEffect, useState } from "react";
import { adminFetch } from "@/lib/admin-api";
import { AdminSearchField } from "@/components/ui/AdminSearchField";
import { TablePagination } from "@/components/ui/TablePagination";
import { useListView } from "@/hooks/useListView";
import { buildSearchHaystack } from "@/lib/search-text";

export type TaxonomyItem = {
  id: string;
  name: string;
  order: number;
};

type Props = {
  apiPath: string;
  title: string;
  description: string;
};

export function TaxonomyManager({ apiPath, title, description }: Props) {
  const [items, setItems] = useState<TaxonomyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [saving, setSaving] = useState(false);
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
  } = useListView(items, (item) => buildSearchHaystack([item.name, item.order]));

  async function load() {
    try {
      const res = await adminFetch(apiPath);
      const data = await res.json();
      setItems(data.data ?? []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [apiPath]);

  async function addItem() {
    const name = newName.trim();
    if (!name) return;
    setSaving(true);
    try {
      const res = await adminFetch(apiPath, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, order: items.length }),
      });
      if (!res.ok) throw new Error("Failed");
      setNewName("");
      await load();
    } catch {
      alert(`Failed to add ${title.toLowerCase()}`);
    } finally {
      setSaving(false);
    }
  }

  async function saveEdit(id: string) {
    const name = editName.trim();
    if (!name) return;
    setSaving(true);
    try {
      const res = await adminFetch(`${apiPath}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) throw new Error("Failed");
      setEditingId(null);
      await load();
    } catch {
      alert(`Failed to update ${title.toLowerCase()}`);
    } finally {
      setSaving(false);
    }
  }

  async function removeItem(id: string, name: string) {
    if (!confirm(`Delete "${name}"? Existing job listings using this value will keep the text but it won't appear in dropdowns.`)) {
      return;
    }
    try {
      const res = await adminFetch(`${apiPath}/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      await load();
    } catch {
      alert(`Failed to delete ${title.toLowerCase()}`);
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
    "w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-black dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:focus:ring-white";

  const newItemLabel = `New ${title.toLowerCase().replace(/s$/, "")}`;
  const searchId = `${title.toLowerCase().replace(/\s+/g, "-")}-search`;
  const newItemId = `${title.toLowerCase().replace(/\s+/g, "-")}-new-name`;

  return (
    <section className="space-y-6 rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
      <div>
        <h3 className="font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{description}</p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300" htmlFor={newItemId}>
            {newItemLabel}
          </label>
          <input
            id={newItemId}
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder={`New ${title.toLowerCase()}…`}
            className={inputClass}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void addItem();
              }
            }}
          />
        </div>
        <button
          type="button"
          disabled={saving || !newName.trim()}
          onClick={() => void addItem()}
          className="w-full rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-gray-200 sm:w-auto"
        >
          Add
        </button>
      </div>

      <AdminSearchField
        id={searchId}
        value={search}
        onChange={setSearch}
        placeholder={`Search ${title.toLowerCase()}…`}
        filteredCount={totalItems}
        totalCount={totalSourceItems}
      />

      <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
        <ul className="divide-y divide-gray-100 dark:divide-gray-700">
          {items.length === 0 ? (
            <li className="px-4 py-8 text-center text-sm text-gray-400">No items yet.</li>
          ) : totalItems === 0 ? (
            <li className="px-4 py-8 text-center text-sm text-gray-400">No items match your search.</li>
          ) : (
            paginated.map((item) => (
              <li
                key={item.id}
                className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                {editingId === item.id ? (
                  <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
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
                    <span className="min-w-0 pr-2 text-sm font-medium text-gray-900 dark:text-gray-100">
                      {item.name}
                    </span>
                    <div className="flex shrink-0 gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(item.id);
                          setEditName(item.name);
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
        {items.length > 0 ? (
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
