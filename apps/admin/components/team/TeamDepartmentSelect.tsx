"use client";

import Link from "next/link";
import { useWorkforceDepartmentOptions } from "@/hooks/use-workforce-department-options";

const selectClass =
  "w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-sm bg-white dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100";

type Props = {
  name?: string;
  required?: boolean;
  defaultValue?: string;
  /** When editing, pass the member’s department so it stays in the list if absent from CMS tabs. */
  currentDepartment?: string;
};

export function TeamDepartmentSelect({
  name = "department",
  required = true,
  defaultValue,
  currentDepartment,
}: Props) {
  const { options, loading } = useWorkforceDepartmentOptions(currentDepartment);

  if (loading) {
    return (
      <select disabled className={selectClass} aria-busy="true">
        <option>Loading departments…</option>
      </select>
    );
  }

  if (options.length === 0) {
    return (
      <div className="space-y-2">
        <p className="text-sm text-amber-800 dark:text-amber-200">
          No department tabs found. Add rows under{" "}
          <Link href="/pages/about_page" className="font-medium underline">
            Site content → About page → Workforce
          </Link>
          , then refresh this page. You can type a department below until tabs exist.
        </p>
        <input
          name={name}
          required={required}
          defaultValue={defaultValue ?? ""}
          placeholder="Department name"
          className={selectClass}
        />
      </div>
    );
  }

  return (
    <select name={name} required={required} defaultValue={defaultValue ?? ""} className={selectClass}>
      <option value="" disabled>
        Select department
      </option>
      {options.map((d) => (
        <option key={d} value={d}>
          {d}
        </option>
      ))}
    </select>
  );
}
