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
  addStartDate: boolean;
  requireStartDate: boolean;
  addEndDate: boolean;
  requireEndDate: boolean;
};

type Props = {
  /** Project member assign flow */
  projectId?: string;
  memberId?: string;
  /** Direct user assign (non–project-member roles) */
  userId?: string;
  memberName: string;
  userEmail: string;
  onClose: () => void;
  onAssigned: () => void;
};

export function AssignTemplateModal({
  projectId,
  memberId,
  userId,
  memberName,
  userEmail,
  onClose,
  onAssigned,
}: Props) {
  const assignToUser = Boolean(userId && !projectId && !memberId);
  const [templates, setTemplates] = useState<TemplateOption[]>([]);
  const [templateId, setTemplateId] = useState("");
  const [values, setValues] = useState<Record<string, string>>({});
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  const selectedTemplate = templates.find((row) => row.id === templateId);

  useEffect(() => {
    async function load() {
      try {
        const defaultsUrl = assignToUser
          ? `/api/admin/users/${userId}/credential-defaults`
          : `/api/admin/projects/${projectId}/members/${memberId}/credential-defaults`;
        const [templatesRes, defaultsRes] = await Promise.all([
          adminFetch("/api/admin/credential-templates"),
          adminFetch(defaultsUrl),
        ]);
        const templatesData = await templatesRes.json();
        const defaultsData = await defaultsRes.json();
        const list = (templatesData.data as TemplateOption[]) ?? [];
        setTemplates(list);
        setValues((defaultsData.data as Record<string, string>) ?? {});
        if (list.length === 1 && list[0]) setTemplateId(list[0].id);
      } catch (error) {
        console.error(error);
        alert("Failed to load templates");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [assignToUser, projectId, memberId, userId]);

  function setValue(key: string, value: string) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!templateId) {
      alert("Please select a template.");
      return;
    }
    const template = selectedTemplate;
    if (template?.addStartDate && template.requireStartDate && !startDate) {
      alert("Start date is required.");
      return;
    }
    if (template?.addEndDate && template.requireEndDate && !endDate) {
      alert("End date is required.");
      return;
    }
    if (startDate && endDate && endDate < startDate) {
      alert("End date must be on or after start date.");
      return;
    }
    for (const variable of template?.variables ?? []) {
      if (variable.required && !values[variable.key]?.trim()) {
        alert(`${variable.label} is required.`);
        return;
      }
    }

    setSaving(true);
    try {
      const body: Record<string, unknown> = { templateId, values };
      if (startDate) body.startDate = startDate;
      if (endDate) body.endDate = endDate;
      const url = assignToUser
        ? `/api/admin/users/${userId}/assign-template`
        : `/api/admin/projects/${projectId}/members/${memberId}/assign-template`;
      const res = await adminFetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error((data as { error?: string }).error || "Failed to assign template");
      }
      setDone(true);
      onAssigned();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to assign template");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 sm:p-6">
      <div className="flex max-h-[min(85vh,720px)] w-full max-w-lg flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-900">
        <div className="shrink-0 border-b border-gray-100 px-5 py-4 dark:border-gray-800">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Assign template</h3>
          <p className="mt-1 text-sm text-gray-500">{memberName}</p>
          {!done && !loading ? (
            <div className="mt-4 space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                User account: <strong>{userEmail}</strong>
              </p>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Agreement template <span className="text-red-500">*</span>
                </label>
                <select
                  className={inputClass}
                  value={templateId}
                  onChange={(e) => setTemplateId(e.target.value)}
                  required
                  form="assign-template-form"
                >
                  <option value="">Select template…</option>
                  {templates.map((row) => (
                    <option key={row.id} value={row.id}>{row.name}</option>
                  ))}
                </select>
              </div>
            </div>
          ) : null}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4">
          {done ? (
            <p className="text-sm text-green-700 dark:text-green-400">
              Agreement template assigned. The user will sign it after they sign in.
            </p>
          ) : loading ? (
            <div className="flex h-32 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : (
            <form id="assign-template-form" onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
              {selectedTemplate?.addStartDate ? (
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Start date
                    {selectedTemplate.requireStartDate ? <span className="text-red-500"> *</span> : null}
                  </label>
                  <input
                    type="date"
                    className={inputClass}
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required={selectedTemplate.requireStartDate}
                  />
                </div>
              ) : null}
              {selectedTemplate?.addEndDate ? (
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    End date
                    {selectedTemplate.requireEndDate ? <span className="text-red-500"> *</span> : null}
                  </label>
                  <input
                    type="date"
                    className={inputClass}
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    required={selectedTemplate.requireEndDate}
                  />
                </div>
              ) : null}
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
            </form>
          )}
        </div>

        <div className="flex shrink-0 justify-end gap-2 border-t border-gray-100 px-5 py-4 dark:border-gray-800">
          {done ? (
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-black"
            >
              Done
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-700 dark:border-gray-600 dark:text-gray-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="assign-template-form"
                disabled={saving || loading}
                className="inline-flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Assign template
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
