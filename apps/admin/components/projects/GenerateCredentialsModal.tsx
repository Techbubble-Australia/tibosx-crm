"use client";
import { appAlert, appConfirm } from "@/lib/app-alert";

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
  /** `assign` — existing TBOS user; `invite` — create user from project member (default). */
  mode?: "invite" | "assign";
  userEmail?: string;
};

export function GenerateCredentialsModal({
  projectId,
  member,
  onClose,
  onSuccess,
  mode = "invite",
  userEmail,
}: Props) {
  const isAssign = mode === "assign";
  const [templates, setTemplates] = useState<TemplateOption[]>([]);
  const [templateId, setTemplateId] = useState("");
  const [inviteEmail, setInviteEmail] = useState(userEmail?.trim() || member.email);
  const [values, setValues] = useState<Record<string, string>>({});
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState<{ email: string; inviteEmailSent: boolean; temporaryPassword?: string } | null>(
    null,
  );

  const selectedTemplate = templates.find((row) => row.id === templateId);

  useEffect(() => {
    setInviteEmail(userEmail?.trim() || member.email);
  }, [member.email, userEmail]);

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
        appAlert("Failed to load templates");
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
      appAlert("Please select a template.");
      return;
    }
    if (!inviteEmail.trim()) {
      appAlert("Email is required.");
      return;
    }
    const template = selectedTemplate;
    if (template?.addStartDate && template.requireStartDate && !startDate) {
      appAlert("Start date is required.");
      return;
    }
    if (template?.addEndDate && template.requireEndDate && !endDate) {
      appAlert("End date is required.");
      return;
    }
    if (startDate && endDate && endDate < startDate) {
      appAlert("End date must be on or after start date.");
      return;
    }
    const variables = template?.variables ?? [];
    for (const variable of variables) {
      if (variable.required && !values[variable.key]?.trim()) {
        appAlert(`${variable.label} is required.`);
        return;
      }
    }
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        templateId,
        inviteEmail: inviteEmail.trim(),
        values,
      };
      if (startDate) body.startDate = startDate;
      if (endDate) body.endDate = endDate;
      const endpoint = isAssign
        ? `/api/admin/projects/${projectId}/members/${member.id}/assign-template`
        : `/api/admin/projects/${projectId}/members/${member.id}/generate-credentials`;
      const assignBody = {
        templateId,
        values,
        ...(startDate ? { startDate } : {}),
        ...(endDate ? { endDate } : {}),
      };
      const res = await adminFetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(isAssign ? assignBody : body),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(
          (data as { error?: string }).error ||
            (isAssign ? "Failed to assign template" : "Failed to invite user"),
        );
      }
      const result = data.data as {
        email?: string;
        inviteEmailSent?: boolean;
        temporaryPassword?: string;
      };
      setDone({
        email: result.email ?? inviteEmail.trim(),
        inviteEmailSent: Boolean(result.inviteEmailSent),
        temporaryPassword: result.temporaryPassword,
      });
      onSuccess();
    } catch (error) {
      appAlert(error instanceof Error ? error.message : "Failed to invite user");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 sm:p-6">
      <div className="flex max-h-[min(85vh,720px)] w-full max-w-lg flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-900">
        <div className="shrink-0 border-b border-gray-100 px-5 py-4 dark:border-gray-800">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {isAssign ? "Assign template" : "Create user"}
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {member.firstName} {member.lastName}
          </p>
          {!done && !loading ? (
            <div className="mt-4 space-y-4">
              {!isAssign ? (
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    className={inputClass}
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    required
                    form="credential-vars-form"
                    placeholder="company.email@client.com"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Use the company email for the TBOS user record when possible.
                  </p>
                </div>
              ) : (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  User account: <strong>{inviteEmail}</strong>
                </p>
              )}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Agreement template <span className="text-red-500">*</span>
                </label>
                <select
                  className={inputClass}
                  value={templateId}
                  onChange={(e) => setTemplateId(e.target.value)}
                  required
                  form="credential-vars-form"
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
            <div className="space-y-3 text-sm">
              <p className="text-green-700 dark:text-green-400">
                {isAssign
                  ? "Agreement template assigned. The user will sign it after they sign in."
                  : done.inviteEmailSent
                    ? `Invitation email sent to ${done.email} with sign-in details. MFA enrollment is required on first sign-in.`
                    : "User created. Email could not be sent — share the temporary password securely."}
              </p>
              {!done.inviteEmailSent && done.temporaryPassword ? (
                <div className="rounded-lg bg-gray-50 p-4 font-mono dark:bg-gray-800">
                  Temporary password: {done.temporaryPassword}
                </div>
              ) : null}
            </div>
          ) : loading ? (
            <div className="flex h-32 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : (
            <form id="credential-vars-form" onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
              {selectedTemplate?.addStartDate ? (
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Agreement start date
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
                    Agreement end date
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
                form="credential-vars-form"
                disabled={saving || loading}
                className="inline-flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {isAssign ? "Assign template" : "Invite user"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
