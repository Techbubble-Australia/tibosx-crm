"use client";

import { useState } from "react";

function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function JsonNode({ name, value, depth }: { name?: string; value: unknown; depth: number }) {
  const [open, setOpen] = useState(depth < 2);
  const label = name !== undefined ? `${name}: ` : "";

  if (value === null) {
    return (
      <div className="pl-4 font-mono text-xs text-gray-600 dark:text-gray-400">
        {label}
        <span className="text-purple-600">null</span>
      </div>
    );
  }
  if (Array.isArray(value)) {
    return (
      <div className="font-mono text-xs">
        <button
          type="button"
          className="text-left text-sky-700 hover:underline dark:text-sky-300"
          onClick={() => setOpen((v) => !v)}
        >
          {label}[{value.length}]
        </button>
        {open ? (
          <div className="border-l border-gray-200 pl-2 dark:border-gray-700">
            {value.map((item, i) => (
              <JsonNode key={i} name={String(i)} value={item} depth={depth + 1} />
            ))}
          </div>
        ) : null}
      </div>
    );
  }
  if (isObject(value)) {
    const keys = Object.keys(value);
    return (
      <div className="font-mono text-xs">
        <button
          type="button"
          className="text-left text-sky-700 hover:underline dark:text-sky-300"
          onClick={() => setOpen((v) => !v)}
        >
          {label}
          {"{"}
          {keys.length}
          {"}"}
        </button>
        {open ? (
          <div className="border-l border-gray-200 pl-2 dark:border-gray-700">
            {keys.map((key) => (
              <JsonNode key={key} name={key} value={value[key]} depth={depth + 1} />
            ))}
          </div>
        ) : null}
      </div>
    );
  }
  return (
    <div className="pl-4 font-mono text-xs text-gray-700 dark:text-gray-300">
      {label}
      <span className="text-emerald-700 dark:text-emerald-400">{JSON.stringify(value)}</span>
    </div>
  );
}

export function JsonTreePreview({ value }: { value: unknown }) {
  return (
    <div className="max-h-48 overflow-auto rounded-lg border border-gray-200 bg-gray-50 p-2 dark:border-gray-700 dark:bg-gray-950/60">
      <JsonNode value={value} depth={0} />
    </div>
  );
}
