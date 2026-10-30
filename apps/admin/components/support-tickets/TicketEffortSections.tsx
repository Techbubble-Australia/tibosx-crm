"use client";

import { useEffect, useState } from "react";
import { appAlert } from "@/lib/app-alert";
import { normalizeTicketStatusKey } from "@/lib/support-ticket-labels";

type Props = {
  ticketId: string;
  status: string;
  initialHours: number | null;
  disabled?: boolean;
  onSaved: () => void;
  saveEstimatedEffort: (ticketId: string, hours: number) => Promise<void>;
};

export function TicketEstimatedEffortSection({
  ticketId,
  status,
  initialHours,
  disabled,
  onSaved,
  saveEstimatedEffort,
}: Props) {
  const inProgress = normalizeTicketStatusKey(status) === "IN_PROGRESS";
  const [value, setValue] = useState(initialHours != null ? initialHours.toFixed(2) : "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setValue(initialHours != null ? initialHours.toFixed(2) : "");
  }, [initialHours, ticketId]);

  if (!inProgress) return null;

  async function handleSave() {
    const parsed = Number.parseFloat(value.replace(",", "."));
    if (!Number.isFinite(parsed) || parsed < 0) {
      appAlert("Enter a valid number of hours (e.g. 8 or 08.00)");
      return;
    }
    setSaving(true);
    try {
      await saveEstimatedEffort(ticketId, parsed);
      setValue(parsed.toFixed(2));
      onSaved();
    } catch (error) {
      appAlert(error instanceof Error ? error.message : "Failed to save estimated effort");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
      <h2 className="mb-2 text-sm font-semibold text-gray-900 dark:text-gray-100">Estimated effort</h2>
      <p className="mb-3 text-xs text-gray-500">
        Set estimated effort while this ticket is in progress. Activity log will record your update.
      </p>
      <div className="flex flex-wrap items-end gap-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
            Estimated effort
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              inputMode="decimal"
              value={value}
              disabled={disabled || saving}
              onChange={(e) => setValue(e.target.value)}
              className="w-28 rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800"
              placeholder="08.00"
            />
            <span className="text-sm text-gray-600 dark:text-gray-400">Hrs</span>
          </div>
        </div>
        <button
          type="button"
          disabled={disabled || saving}
          onClick={() => void handleSave()}
          className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black"
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
    </section>
  );
}

export type EffortBreakdown = {
  effortAnalysis: number | null;
  effortBuild: number | null;
  effortTest: number | null;
  effortDocument: number | null;
  effortSupport: number | null;
};

const PHASES: { key: keyof EffortBreakdown; label: string }[] = [
  { key: "effortAnalysis", label: "Analysis" },
  { key: "effortBuild", label: "Build" },
  { key: "effortTest", label: "Test" },
  { key: "effortDocument", label: "Document" },
  { key: "effortSupport", label: "Support" },
];

type BreakdownProps = {
  ticketId: string;
  status: string;
  breakdown: EffortBreakdown;
  total: number | null;
  disabled?: boolean;
  onSaved: () => void;
  saveBreakdown: (ticketId: string, payload: EffortBreakdown) => Promise<void>;
};

export function TicketEffortBreakdownSection({
  ticketId,
  status,
  breakdown,
  total,
  disabled,
  onSaved,
  saveBreakdown,
}: BreakdownProps) {
  const inProgress = normalizeTicketStatusKey(status) === "IN_PROGRESS";
  const [values, setValues] = useState<EffortBreakdown>(breakdown);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setValues(breakdown);
  }, [breakdown, ticketId]);

  const computedTotal = PHASES.reduce((sum, phase) => {
    const n = values[phase.key];
    return sum + (n != null && Number.isFinite(n) ? n : 0);
  }, 0);

  if (!inProgress) {
    const displayTotal =
      total != null && total > 0
        ? total
        : PHASES.reduce((sum, phase) => sum + (breakdown[phase.key] ?? 0), 0);
    if (displayTotal <= 0 && PHASES.every((p) => breakdown[p.key] == null)) return null;
    return (
      <section className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
        <h2 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-100">Estimated effort (hours)</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs uppercase text-gray-500 dark:border-gray-800">
                {PHASES.map((phase) => (
                  <th key={phase.key} className="px-2 py-2 font-medium">
                    {phase.label}
                  </th>
                ))}
                <th className="px-2 py-2 font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                {PHASES.map((phase) => (
                  <td key={phase.key} className="px-2 py-2 text-gray-800 dark:text-gray-200">
                    {breakdown[phase.key] ?? "—"}
                  </td>
                ))}
                <td className="px-2 py-2 font-semibold">{displayTotal}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    );
  }

  function patch(key: keyof EffortBreakdown, raw: string) {
    const parsed = raw.trim() === "" ? null : Number.parseFloat(raw.replace(",", "."));
    setValues((prev) => ({
      ...prev,
      [key]: parsed != null && Number.isFinite(parsed) ? parsed : null,
    }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      await saveBreakdown(ticketId, values);
      onSaved();
    } catch (error) {
      appAlert(error instanceof Error ? error.message : "Failed to save effort breakdown");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
      <h2 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-100">Estimated effort (hours)</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-left text-xs uppercase text-gray-500 dark:border-gray-800">
              {PHASES.map((phase) => (
                <th key={phase.key} className="px-2 py-2 font-medium">
                  {phase.label}
                </th>
              ))}
              <th className="px-2 py-2 font-medium">Total</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              {PHASES.map((phase) => (
                <td key={phase.key} className="px-2 py-1">
                  <input
                    type="text"
                    inputMode="decimal"
                    disabled={disabled || saving}
                    value={values[phase.key] ?? ""}
                    onChange={(e) => patch(phase.key, e.target.value)}
                    className="w-20 rounded border border-gray-200 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-800"
                  />
                </td>
              ))}
              <td className="px-2 py-1 font-semibold text-gray-900 dark:text-gray-100">
                {(computedTotal > 0 ? computedTotal : total ?? 0).toFixed(1).replace(/\.0$/, "")}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div className="mt-3 flex justify-end">
        <button
          type="button"
          disabled={disabled || saving}
          onClick={() => void handleSave()}
          className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600"
        >
          {saving ? "Saving…" : "Save breakdown"}
        </button>
      </div>
    </section>
  );
}
