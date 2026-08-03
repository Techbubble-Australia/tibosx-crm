"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { adminFetch } from "@/lib/admin-api";

type TaxonomyItem = { id: string; name: string };

type Props = {
  defaultCategory?: string;
  defaultTechnology?: string;
  selectClassName?: string;
  labelClassName?: string;
};

export function CaseStudyCategorySelect({
  defaultCategory = "",
  defaultTechnology = "",
  selectClassName = "w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-black",
  labelClassName = "mb-2 block text-sm font-medium",
}: Props) {
  const [categories, setCategories] = useState<TaxonomyItem[]>([]);
  const [technologies, setTechnologies] = useState<TaxonomyItem[]>([]);
  const [category, setCategory] = useState(defaultCategory);
  const [technology, setTechnology] = useState(defaultTechnology);

  useEffect(() => {
    async function load() {
      try {
        const [catRes, techRes] = await Promise.all([
          adminFetch("/api/admin/job-categories"),
          adminFetch("/api/admin/job-technologies"),
        ]);
        const catData = await catRes.json();
        const techData = await techRes.json();
        setCategories(catData.data ?? []);
        setTechnologies(techData.data ?? []);
      } catch (e) {
        console.error(e);
      }
    }
    void load();
  }, []);

  useEffect(() => {
    setCategory(defaultCategory);
    setTechnology(defaultTechnology);
  }, [defaultCategory, defaultTechnology]);

  return (
    <>
      <div>
        <label className={labelClassName}>Category</label>
        <select
          name="category"
          required
          value={category}
          onChange={(e) => setCategory(e.target.value)}
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
        <p className="mt-1 text-xs text-gray-500">
          <Link href="/settings/categories" className="underline hover:text-gray-700">
            Manage categories
          </Link>
        </p>
      </div>
      <div>
        <label className={labelClassName}>Technology</label>
        <select
          name="subcategory"
          value={technology}
          onChange={(e) => setTechnology(e.target.value)}
          className={selectClassName}
        >
          <option value="">None</option>
          {technologies.map((t) => (
            <option key={t.id} value={t.name}>
              {t.name}
            </option>
          ))}
          {technology && !technologies.some((t) => t.name === technology) ? (
            <option value={technology}>{technology} (current)</option>
          ) : null}
        </select>
        <p className="mt-1 text-xs text-gray-500">
          <Link href="/settings/technologies" className="underline hover:text-gray-700">
            Manage technologies
          </Link>
        </p>
      </div>
    </>
  );
}
