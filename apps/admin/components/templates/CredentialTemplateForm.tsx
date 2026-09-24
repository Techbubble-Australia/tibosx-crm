"use client";

import { useState } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { adminFetch } from "@/lib/admin-api";

export type CredentialVariable = {
  key: string;
  label: string;
  type: "text" | "select";
  options: string[];
  required: boolean;
};

export type CredentialTemplateValues = {
  id?: string;
  name: string;
  html: string;
  variables: CredentialVariable[];
};

const inputClass =
  "w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-black dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:focus:ring-white";

type Props = {
  defaults: CredentialTemplateValues;
  onSubmit: (payload: CredentialTemplateValues) => Promise<void>;
  isSaving: boolean;
};

export function CredentialTemplateForm({ defaults, onSubmit, isSaving }: Props) {
  const [name, setName] = useState(defaults.name);
  const [html, setHtml] = useState(defaults.html);
  const [variables, setVariables] = useState<CredentialVariable[]>(defaults.variables);
  const [parsing, setParsing] = useState(false);

  async function parseVariables() {
    setParsing(true);
    try {
      const res = await adminFetch("/api/admin/credential-templates/parse-variables", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ html }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error((data as { error?: string }).error || "Failed to parse variables");
      const parsed = (data.data as CredentialVariable[]) ?? [];
      const byKey = new Map(variables.map((row) => [row.key, row]));
      setVariables(
        parsed.map((row) => {
          const prev = byKey.get(row.key);
          return prev ? { ...row, ...prev, key: row.key } : row;
        }),
      );
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to parse variables");
    } finally {
      setParsing(false);
    }
  }

  function updateVariable(index: number, patch: Partial<CredentialVariable>) {
    setVariables((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  function addOption(index: number) {
    setVariables((prev) =>
      prev.map((row, i) => (i === index ? { ...row, options: [...row.options, ""] } : row)),
    );
  }

  function updateOption(varIndex: number, optIndex: number, value: string) {
    setVariables((prev) =>
      prev.map((row, i) => {
        if (i !== varIndex) return row;
        const options = [...row.options];
        options[optIndex] = value;
        return { ...row, options };
      }),
    );
  }

  function removeOption(varIndex: number, optIndex: number) {
    setVariables((prev) =>
      prev.map((row, i) => {
        if (i !== varIndex) return row;
        return { ...row, options: row.options.filter((_, j) => j !== optIndex) };
      }),
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      alert("Name is required.");
      return;
    }
    if (!html.trim()) {
      alert("HTML content is required.");
      return;
    }
    await onSubmit({
      id: defaults.id,
      name: name.trim(),
      html,
      variables: variables.map((row) => ({
        ...row,
        label: row.label.trim() || row.key,
        options: row.type === "select" ? row.options.map((o) => o.trim()).filter(Boolean) : [],
      })),
    });
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-8">
      <section className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
        <h3 className="mb-4 font-semibold text-gray-900 dark:text-gray-100">Template details</h3>
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
            <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div>
            <div className="mb-1 flex items-center justify-between">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">HTML</label>
              <button
                type="button"
                onClick={() => void parseVariables()}
                disabled={parsing}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                {parsing ? <Loader2 className="inline h-3.5 w-3.5 animate-spin" /> : "Parse variables"}
              </button>
            </div>
            <textarea
              className={`${inputClass} min-h-[240px] font-mono`}
              value={html}
              onChange={(e) => setHtml(e.target.value)}
              onBlur={() => void parseVariables()}
              placeholder="<p>Agreement for {Name} ({Email})</p>"
              required
            />
            <p className="mt-1 text-xs text-gray-500">
              Use placeholders like {"{Name}"}, {"{Email}"} in the HTML. Click Parse variables to configure each field.
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
        <h3 className="mb-4 font-semibold text-gray-900 dark:text-gray-100">Variables</h3>
        {variables.length === 0 ? (
          <p className="text-sm text-gray-400">No variables found. Add placeholders to the HTML and parse.</p>
        ) : (
          <div className="space-y-4">
            {variables.map((variable, index) => (
              <div
                key={variable.key}
                className="rounded-lg border border-gray-100 p-4 dark:border-gray-800"
              >
                <div className="mb-3 flex items-center justify-between">
                  <span className="font-mono text-sm text-gray-500">{`{${variable.key}}`}</span>
                  <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <input
                      type="checkbox"
                      checked={variable.required}
                      onChange={(e) => updateVariable(index, { required: e.target.checked })}
                    />
                    Mandatory
                  </label>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-500">Label</label>
                    <input
                      className={inputClass}
                      value={variable.label}
                      onChange={(e) => updateVariable(index, { label: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-500">Type</label>
                    <select
                      className={inputClass}
                      value={variable.type}
                      onChange={(e) =>
                        updateVariable(index, {
                          type: e.target.value as CredentialVariable["type"],
                          options: e.target.value === "select" ? variable.options : [],
                        })
                      }
                    >
                      <option value="text">Text</option>
                      <option value="select">Select box</option>
                    </select>
                  </div>
                </div>
                {variable.type === "select" ? (
                  <div className="mt-3">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-xs font-medium text-gray-500">Options</span>
                      <button
                        type="button"
                        onClick={() => addOption(index)}
                        className="inline-flex items-center gap-1 text-xs text-gray-600 hover:text-gray-900 dark:text-gray-400"
                      >
                        <Plus className="h-3.5 w-3.5" /> Add option
                      </button>
                    </div>
                    <div className="space-y-2">
                      {variable.options.map((option, optIndex) => (
                        <div key={optIndex} className="flex gap-2">
                          <input
                            className={inputClass}
                            value={option}
                            onChange={(e) => updateOption(index, optIndex, e.target.value)}
                            placeholder="Option value"
                          />
                          <button
                            type="button"
                            onClick={() => removeOption(index, optIndex)}
                            className="rounded-lg border border-gray-200 p-2 text-gray-500 hover:bg-gray-50 dark:border-gray-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSaving}
          className="inline-flex items-center gap-2 rounded-lg bg-black px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50 dark:bg-white dark:text-black"
        >
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Save template
        </button>
      </div>
    </form>
  );
}
