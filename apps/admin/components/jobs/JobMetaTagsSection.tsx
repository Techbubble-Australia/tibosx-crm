"use client";

import { useState } from "react";

const inputClass =
  "w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-black dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100";

type Props = {
  metaTags: string[];
  onChange: (tags: string[]) => void;
};

export function JobMetaTagsSection({ metaTags, onChange }: Props) {
  const [metaTagInput, setMetaTagInput] = useState("");

  function addMetaTag(raw: string) {
    const tag = raw.trim();
    if (!tag) return;
    const exists = metaTags.some((existing) => existing.toLowerCase() === tag.toLowerCase());
    if (exists) return;
    onChange([...metaTags, tag]);
    setMetaTagInput("");
  }

  function removeMetaTag(tag: string) {
    onChange(metaTags.filter((existing) => existing !== tag));
  }

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
      <h3 className="mb-1 font-semibold text-gray-900 dark:text-gray-100">Meta tags</h3>
      <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
        Used for AI Insights profile matching (skills, technologies, keywords).
      </p>
      <div className="flex flex-wrap gap-2">
        {metaTags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-800 dark:bg-gray-800 dark:text-gray-200"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeMetaTag(tag)}
              className="text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
              aria-label={`Remove ${tag}`}
            >
              ×
            </button>
          </span>
        ))}
      </div>
      <div className="mt-2 flex gap-2">
        <input
          type="text"
          value={metaTagInput}
          onChange={(e) => setMetaTagInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addMetaTag(metaTagInput);
            }
          }}
          className={inputClass}
          placeholder="Add tag and press Enter"
          maxLength={80}
        />
        <button
          type="button"
          onClick={() => addMetaTag(metaTagInput)}
          className="shrink-0 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800"
        >
          Add
        </button>
      </div>
    </section>
  );
}
