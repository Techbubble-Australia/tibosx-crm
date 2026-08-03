"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { adminFetch } from "@/lib/admin-api";

type CaseStudyCategoryRow = {
  id: string;
  name: string;
  order: number;
  subcategories: { id: string; name: string; order: number }[];
};

export default function CaseStudyCategoriesPage() {
  const [categories, setCategories] = useState<CaseStudyCategoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCategory, setNewCategory] = useState("");
  const [newSubByCat, setNewSubByCat] = useState<Record<string, string>>({});
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editCatName, setEditCatName] = useState("");
  const [editingSub, setEditingSub] = useState<{ catId: string; subId: string } | null>(null);
  const [editSubName, setEditSubName] = useState("");

  async function load() {
    try {
      const res = await adminFetch("/api/admin/case-study-categories");
      const data = await res.json();
      setCategories(data.data ?? []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function addCategory() {
    const name = newCategory.trim();
    if (!name) return;
    const res = await adminFetch("/api/admin/case-study-categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, order: categories.length }),
    });
    if (!res.ok) {
      alert("Failed to add category");
      return;
    }
    setNewCategory("");
    await load();
  }

  async function saveCategory(id: string) {
    const name = editCatName.trim();
    if (!name) return;
    const res = await adminFetch(`/api/admin/case-study-categories/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (!res.ok) {
      alert("Failed to update category");
      return;
    }
    setEditingCatId(null);
    await load();
  }

  async function deleteCategory(id: string, name: string) {
    if (!confirm(`Delete category "${name}" and all its subcategories?`)) return;
    const res = await adminFetch(`/api/admin/case-study-categories/${id}`, { method: "DELETE" });
    if (!res.ok) {
      alert("Failed to delete category");
      return;
    }
    await load();
  }

  async function addSubcategory(categoryId: string) {
    const name = (newSubByCat[categoryId] ?? "").trim();
    if (!name) return;
    const res = await adminFetch(`/api/admin/case-study-categories/${categoryId}/subcategories`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, order: 0 }),
    });
    if (!res.ok) {
      alert("Failed to add subcategory");
      return;
    }
    setNewSubByCat((prev) => ({ ...prev, [categoryId]: "" }));
    await load();
  }

  async function saveSubcategory(categoryId: string, subId: string) {
    const name = editSubName.trim();
    if (!name) return;
    const res = await adminFetch(
      `/api/admin/case-study-categories/${categoryId}/subcategories/${subId}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      },
    );
    if (!res.ok) {
      alert("Failed to update subcategory");
      return;
    }
    setEditingSub(null);
    await load();
  }

  async function deleteSubcategory(categoryId: string, subId: string, name: string) {
    if (!confirm(`Delete subcategory "${name}"?`)) return;
    const res = await adminFetch(
      `/api/admin/case-study-categories/${categoryId}/subcategories/${subId}`,
      { method: "DELETE" },
    );
    if (!res.ok) {
      alert("Failed to delete subcategory");
      return;
    }
    await load();
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-black border-t-transparent" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <Link href="/case-studies" className="rounded p-1.5 hover:bg-gray-100">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h2 className="text-lg font-semibold">Category &amp; Subcategory Management</h2>
          <p className="text-sm text-gray-500">
            Define categories (e.g. Microsoft) and subcategories (e.g. SharePoint, Dynamics 365) for case studies.
          </p>
        </div>
      </div>

      <div className="mb-6 flex gap-2 rounded-xl border border-gray-200 bg-white p-4">
        <input
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
          placeholder="New category name…"
          className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void addCategory();
            }
          }}
        />
        <button
          type="button"
          onClick={() => void addCategory()}
          className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
        >
          Add Category
        </button>
      </div>

      <div className="space-y-4">
        {categories.length === 0 ? (
          <p className="text-center text-gray-400">No categories yet.</p>
        ) : (
          categories.map((cat) => (
            <section key={cat.id} className="rounded-xl border border-gray-200 bg-white p-5">
              <div className="flex items-center justify-between gap-3">
                {editingCatId === cat.id ? (
                  <div className="flex flex-1 gap-2">
                    <input
                      value={editCatName}
                      onChange={(e) => setEditCatName(e.target.value)}
                      className="flex-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm"
                      autoFocus
                    />
                    <button type="button" onClick={() => void saveCategory(cat.id)} className="text-sm font-medium">
                      Save
                    </button>
                    <button type="button" onClick={() => setEditingCatId(null)} className="text-sm text-gray-500">
                      Cancel
                    </button>
                  </div>
                ) : (
                  <>
                    <h3 className="text-base font-semibold">{cat.name}</h3>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingCatId(cat.id);
                          setEditCatName(cat.name);
                        }}
                        className="text-sm text-gray-600 hover:text-black"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => void deleteCategory(cat.id, cat.name)}
                        className="text-sm text-red-600"
                      >
                        Delete
                      </button>
                    </div>
                  </>
                )}
              </div>

              <ul className="mt-4 space-y-2 border-t border-gray-100 pt-4">
                {cat.subcategories.map((sub) => (
                  <li key={sub.id} className="flex items-center justify-between gap-2 pl-4">
                    {editingSub?.subId === sub.id ? (
                      <div className="flex flex-1 gap-2">
                        <input
                          value={editSubName}
                          onChange={(e) => setEditSubName(e.target.value)}
                          className="flex-1 rounded border border-gray-200 px-2 py-1 text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => void saveSubcategory(cat.id, sub.id)}
                          className="text-sm font-medium"
                        >
                          Save
                        </button>
                        <button type="button" onClick={() => setEditingSub(null)} className="text-sm text-gray-500">
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <>
                        <span className="text-sm text-gray-700">↳ {sub.name}</span>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingSub({ catId: cat.id, subId: sub.id });
                              setEditSubName(sub.name);
                            }}
                            className="text-xs text-gray-600 hover:text-black"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => void deleteSubcategory(cat.id, sub.id, sub.name)}
                            className="text-xs text-red-600"
                          >
                            Delete
                          </button>
                        </div>
                      </>
                    )}
                  </li>
                ))}
              </ul>

              <div className="mt-3 flex gap-2 pl-4">
                <input
                  value={newSubByCat[cat.id] ?? ""}
                  onChange={(e) => setNewSubByCat((prev) => ({ ...prev, [cat.id]: e.target.value }))}
                  placeholder="New subcategory…"
                  className="flex-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      void addSubcategory(cat.id);
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => void addSubcategory(cat.id)}
                  className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm hover:bg-gray-50"
                >
                  Add Subcategory
                </button>
              </div>
            </section>
          ))
        )}
      </div>
    </div>
  );
}
