"use client";

import { useEffect, useMemo, useState } from "react";
import { adminFetch } from "@/lib/admin-api";

export type CaseStudyCategoryRow = {
  id: string;
  name: string;
  order: number;
  subcategories: { id: string; name: string; order: number }[];
};

type Props = {
  defaultCategory?: string;
  defaultSubcategory?: string;
  selectClassName?: string;
  labelClassName?: string;
};

export function CaseStudyCategorySelect({
  defaultCategory = "",
  defaultSubcategory = "",
  selectClassName = "w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-black",
  labelClassName = "mb-2 block text-sm font-medium",
}: Props) {
  const [categories, setCategories] = useState<CaseStudyCategoryRow[]>([]);
  const [category, setCategory] = useState(defaultCategory);
  const [subcategory, setSubcategory] = useState(defaultSubcategory);

  useEffect(() => {
    async function load() {
      try {
        const res = await adminFetch("/api/admin/case-study-categories");
        const data = await res.json();
        setCategories(data.data ?? []);
      } catch (e) {
        console.error(e);
      }
    }
    void load();
  }, []);

  useEffect(() => {
    setCategory(defaultCategory);
    setSubcategory(defaultSubcategory);
  }, [defaultCategory, defaultSubcategory]);

  const subcategories = useMemo(() => {
    const cat = categories.find((c) => c.name === category);
    return cat?.subcategories ?? [];
  }, [categories, category]);

  return (
    <>
      <div>
        <label className={labelClassName}>Category</label>
        <select
          name="category"
          required
          value={category}
          onChange={(e) => {
            setCategory(e.target.value);
            setSubcategory("");
          }}
          className={selectClassName}
        >
          <option value="">Select category…</option>
          {categories.map((c) => (
            <option key={c.id} value={c.name}>
              {c.name}
            </option>
          ))}
          {category && !categories.some((c) => c.name === category) ? (
            <option value={category}>{category} (current)</option>
          ) : null}
        </select>
      </div>
      <div>
        <label className={labelClassName}>Subcategory</label>
        <select
          name="subcategory"
          value={subcategory}
          onChange={(e) => setSubcategory(e.target.value)}
          className={selectClassName}
          disabled={!category}
        >
          <option value="">None</option>
          {subcategories.map((s) => (
            <option key={s.id} value={s.name}>
              {s.name}
            </option>
          ))}
          {subcategory && !subcategories.some((s) => s.name === subcategory) ? (
            <option value={subcategory}>{subcategory} (current)</option>
          ) : null}
        </select>
        <p className="mt-1 text-xs text-gray-500">Optional — e.g. SharePoint under Microsoft.</p>
      </div>
    </>
  );
}
