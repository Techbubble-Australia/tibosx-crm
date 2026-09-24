"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { adminFetch } from "@/lib/admin-api";
import type { CredentialVariable } from "@/components/templates/CredentialTemplateForm";

const inputClass =
  "w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-black dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:focus:ring-white";

type TemplateOption = {
  id: string;
  name: string;
  variables: CredentialVariable[];
};

type MemberInfo = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
};

type Props = {
  projectId: string;
  member: MemberInfo;
  onClose: () => void;
  onSuccess: () => void;
};

export function GenerateCredentialsModal({ projectId, member, onClose, onSuccess }: Props) {
  const [templates, setTemplates] = useState<TemplateOption[]>([]);
  const [templateId, setTemplateId] = useState("");
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [createdEmail, setCreatedEmail] = useState<string | null>(null);

  const selectedTemplate = templates.find((row) => row.id === templateId);

  useEffect(() => {
    async function load() {
      try {
        const [templatesRes, defaultsRes] = await Promise.all([
          adminFetch("/api/admin/credential-templates"),
          adminFetch(`/api/admin/projects/${projectId}/members/${member.id}/credential-defaults`),
        ]);
        const templatesData = await templatesRes.json();
        const defaultsData = await defaultsRes.json();
        const list = (templatesData.data as TemplateOption[]) ?? [];
        setTemplates(list);
        const defaults = (defaultsData.data as Record<string, string>) ?? {};
        setValues(defaults);
        if (list.length === 1 && list[0]) setTemplateId(list[0].id);
      } catch (error) {
        console.error(error);
        alert("Failed to load templates");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [projectId, member.id]);

  function setValue(key: string, value: string) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!templateId) {
      alert("Please select a template.");
      return;
    }
    const variables = selectedTemplate?.variables ?? [];
    for (const variable of variables) {
      if (variable.required && !values[variable.key]?.trim()) {
        alert(`${variable.label} is required.`);
        return;
      }
    }
    setSaving(true);
    try {
      const res = await adminFetch(
        `/api/admin/projects/${projectId}/members/${member.id}/generate-credentials`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ templateId, values }),
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error((data as { error?: string }).error || "Failed to generate credentials");
      const result = data.data as { temporaryPassword?: string; email?: string };
      setTempPassword(result.temporaryPassword ?? null);
      setCreatedEmail(result.email ?? null);
      onSuccess();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to generate credentials");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-xl border border-gray-200 bg-white p-6 shadow-xl dark:border-gray-700 dark:bg-gray-900">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Generate credentials</h3>
        <p className="mt-1 text-sm text-gray-500">
          {member.firstName} {member.lastName} ({member.email})
        </p>

        {tempPassword ? (
          <div className="mt-4 space-y-3">
            <p className="text-sm text-green-700 dark:text-green-400">
              User account created. Share the temporary password securely — it will only be shown once.
            </p>
            <div className="rounded-lg bg-gray-50 p-4 text-sm dark:bg-gray-800">
              <p><span className="text-gray-500">Email:</span> {createdEmail}</p>
              <p className="mt-2 font-mono"><span className="font-sans text-gray-500">Password:</span> {tempPassword}</p>
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-black"
              >
                Done
              </button>
            </div>
          </div>
        ) : loading ? (
          <div className="flex h-32 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : (
          <form onSubmit={(e) => void handleSubmit(e)} className="mt-4 space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Template <span className="text-red-500">*</span>
              </label>
              <select
                className={inputClass}
                value={templateId}
                onChange={(e) => setTemplateId(e.target.value)}
                required
              >
                <option value="">Select template…</option>
                {templates.map((row) => (
                  <option key={row.id} value={row.id}>{row.name}</option>
                ))}
              </select>
            </div>

            {(selectedTemplate?.variables ?? []).map((variable) => (
              <div key={variable.key}>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {variable.label}
                  {variable.required ? <span className="text-red-500"> *</span> : null}
                </label>
                {variable.type === "select" ? (
                  <select
                    className={inputClass}
                    value={values[variable.key] ?? ""}
                    onChange={(e) => setValue(variable.key, e.target.value)}
                    required={variable.required}
                  >
                    <option value="">Select…</option>
                    {variable.options.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    className={inputClass}
                    value={values[variable.key] ?? ""}
                    onChange={(e) => setValue(variable.key, e.target.value)}
                    required={variable.required}
                  />
                )}
              </div>
            ))}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-700 dark:border-gray-600 dark:text-gray-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Generate
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
