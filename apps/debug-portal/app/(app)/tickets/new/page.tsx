"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FileText, Loader2, Upload, X } from "lucide-react";
import { ChevronSelect } from "@/components/ChevronSelect";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  MAX_TICKET_SCREENSHOTS,
  TICKET_ATTACHMENT_ACCEPT,
  isPdfFile,
  uploadScreenshots,
} from "@/lib/upload-screenshot";
import { useSprints } from "@/lib/sprints";
import { usePortalUser } from "@/lib/use-portal-user";
import { useTicketStatuses } from "@/components/TicketStatusesProvider";
import { StatusBadge } from "@/components/TicketBadges";
import {
  TICKET_TITLE_MAX,
  defaultTypeForLevel,
  formatTicketType,
  parseHierarchyLevel,
  typesForLevel,
  type DebugIssueType,
  type HierarchyLevel,
} from "@/lib/tickets";

type ReportedEnvironment = "development" | "production";
type PendingShot = { file: File; previewUrl: string };
type ParentOption = { id: string; ticketId: string; type: string; title: string | null };

export default function NewTicketPage() {
  const router = useRouter();
  const [boardLevel, setBoardLevel] = useState<HierarchyLevel>(0);
  const levelTypes = useMemo(() => typesForLevel(boardLevel), [boardLevel]);
  const [type, setType] = useState<DebugIssueType>("TASK");
  const [parentId, setParentId] = useState("");
  const [parentOptions, setParentOptions] = useState<ParentOption[]>([]);
  const [reportedEnvironment, setReportedEnvironment] = useState<ReportedEnvironment>("development");
  const [currentUrl, setCurrentUrl] = useState("");
  const [title, setTitle] = useState("");
  const [userDescription, setUserDescription] = useState("");
  const [shots, setShots] = useState<PendingShot[]>([]);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const { sprints, loading: sprintsLoading } = useSprints();
  const activeSprint = sprints.find((s) => s.status === "ACTIVE") ?? null;
  const { isAdmin } = usePortalUser();
  const { labelOf } = useTicketStatuses();
  const [startStatus, setStartStatus] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const requested = params.get("status");
    if (requested) setStartStatus(requested);
    const level = parseHierarchyLevel(params.get("level"));
    setBoardLevel(level);
    setType(defaultTypeForLevel(level));
    const parent = params.get("parentId");
    if (parent) setParentId(parent);
  }, []);

  useEffect(() => {
    if (!levelTypes.includes(type)) setType(defaultTypeForLevel(boardLevel));
  }, [boardLevel, levelTypes, type]);

  const needsParent = type === "SUBTASK";
  const parentLevel = boardLevel === -1 ? 0 : boardLevel + 1;
  const canHaveParent = boardLevel < 2;

  useEffect(() => {
    if (!canHaveParent) {
      setParentOptions([]);
      return;
    }
    const qs = new URLSearchParams({ limit: "200", hierarchyLevel: String(parentLevel) });
    void fetch(`/api/debug-portal/tickets?${qs}`, { credentials: "include", cache: "no-store" })
      .then((r) => r.json())
      .then((json) => {
        const rows = Array.isArray(json?.data) ? (json.data as ParentOption[]) : [];
        setParentOptions(rows);
      })
      .catch(() => setParentOptions([]));
  }, [canHaveParent, parentLevel]);

  const effectiveStatus = startStatus && (isAdmin || startStatus === "PENDING") ? startStatus : null;

  const addFiles = useCallback((incoming: File[]) => {
    const images = incoming.filter((file) => TICKET_ATTACHMENT_ACCEPT.split(",").includes(file.type) || isPdfFile(file));
    if (incoming.length && !images.length) {
      setError("Only PNG, JPEG, GIF, WebP images or PDF files can be attached.");
      return;
    }
    setShots((prev) => {
      const room = MAX_TICKET_SCREENSHOTS - prev.length;
      if (images.length > room) {
        setError(`You can attach up to ${MAX_TICKET_SCREENSHOTS} screenshots per ticket.`);
      }
      const picked = images.slice(0, Math.max(room, 0));
      return [...prev, ...picked.map((file) => ({ file, previewUrl: URL.createObjectURL(file) }))];
    });
  }, []);

  function onPickScreenshots(files: FileList | null) {
    if (files?.length) addFiles(Array.from(files));
  }

  useEffect(() => {
    function onPaste(e: ClipboardEvent) {
      const files = Array.from(e.clipboardData?.files ?? []);
      if (!files.length) return;
      e.preventDefault();
      addFiles(
        files.map((file, i) =>
          file.name && file.name !== "image.png"
            ? file
            : new File([file], `pasted-${Date.now()}-${i + 1}.png`, { type: file.type || "image/png" }),
        ),
      );
    }
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [addFiles]);

  function removeShot(index: number) {
    setShots((prev) => {
      const target = prev[index];
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((_, i) => i !== index);
    });
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!title.trim()) {
      setError("Please add a short title for this ticket.");
      return;
    }
    if (!userDescription.trim()) {
      setError("Please add a description so others can understand the issue.");
      return;
    }
    if (needsParent && !parentId) {
      setError("Subtasks require a parent story, task, or bug.");
      return;
    }

    setSubmitting(true);
    try {
      const screenshotUrls = await uploadScreenshots(shots.map((shot) => shot.file));

      const res = await fetch("/api/debug-portal/tickets", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          parentId: parentId || null,
          reportedEnvironment,
          title: title.trim(),
          userDescription: userDescription.trim(),
          currentUrl: currentUrl.trim() || undefined,
          screenshotUrls,
          ...(effectiveStatus ? { status: effectiveStatus } : {}),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(typeof data.error === "string" ? data.error : "Failed to create ticket");
      }
      const id = data?.data?.id;
      if (typeof id === "string") {
        router.push(`/tickets/${id}`);
        return;
      }
      router.push(`/board?level=${boardLevel}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create ticket");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        backHref={`/board?level=${boardLevel}`}
        backLabel="Board"
        title="New ticket"
        description="Create an initiative, epic, work item, or subtask for the debug portal board."
      />
      {effectiveStatus ? (
        <p className="flex items-center gap-2 text-sm text-slate-600">
          This ticket will be added to the <StatusBadge status={effectiveStatus} /> column ({labelOf(effectiveStatus)}).
        </p>
      ) : null}

      <form onSubmit={(e) => void onSubmit(e)} className="dp-card space-y-6 p-5 sm:p-6">
        {error ? (
          <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
            {error}
          </p>
        ) : null}

        <fieldset>
          <legend className="dp-label">Type</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {levelTypes.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                  type === t
                    ? "border-sky-600 bg-sky-50 text-sky-900 ring-2 ring-sky-500/20"
                    : "border-slate-300 bg-white text-slate-700 hover:border-slate-400"
                }`}
              >
                {formatTicketType(t)}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Types on this form match the board level you came from
            {boardLevel === 0 ? " (stories, tasks, and bugs share the work items board)" : ""}.
          </p>
        </fieldset>

        {canHaveParent ? (
          <div>
            <label htmlFor="parent" className="dp-label">
              Parent {needsParent ? <span className="text-red-600">*</span> : <span className="font-normal text-slate-500">(optional)</span>}
            </label>
            <ChevronSelect
              id="parent"
              value={parentId}
              onChange={setParentId}
              className="block w-full"
              aria-label="Parent ticket"
            >
              <option value="">{needsParent ? "Select a parent…" : "No parent"}</option>
              {parentOptions.map((row) => (
                <option key={row.id} value={row.id}>
                  {row.ticketId}
                  {row.title ? ` — ${row.title}` : ""} ({formatTicketType(row.type)})
                </option>
              ))}
            </ChevronSelect>
          </div>
        ) : null}

        <div>
          <label htmlFor="env" className="dp-label">
            Environment
          </label>
          <ChevronSelect
            id="env"
            value={reportedEnvironment}
            onChange={(v) => setReportedEnvironment(v as ReportedEnvironment)}
            className="block w-full max-w-xs"
            aria-label="Reported environment"
          >
            <option value="development">Development</option>
            <option value="production">Production</option>
          </ChevronSelect>
        </div>

        <div>
          <label htmlFor="related-url" className="dp-label">
            Related URL <span className="font-normal text-slate-500">(optional)</span>
          </label>
          <input
            id="related-url"
            value={currentUrl}
            onChange={(e) => setCurrentUrl(e.target.value)}
            placeholder="https://…"
            className="dp-input"
          />
        </div>

        <div>
          <label htmlFor="title" className="dp-label">
            Title
          </label>
          <input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={TICKET_TITLE_MAX}
            required
            className="dp-input"
            placeholder="Short summary"
          />
        </div>

        <div>
          <label htmlFor="description" className="dp-label">
            Description
          </label>
          <textarea
            id="description"
            value={userDescription}
            onChange={(e) => setUserDescription(e.target.value)}
            required
            rows={6}
            className="dp-input"
            placeholder="What needs to happen, and how to verify it…"
          />
        </div>

        <div>
          <p className="dp-label">Attachments</p>
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              addFiles(Array.from(e.dataTransfer.files));
            }}
            className={`mt-2 rounded-xl border border-dashed px-4 py-6 text-center ${
              dragOver ? "border-sky-500 bg-sky-50" : "border-slate-300 bg-slate-50"
            }`}
          >
            <Upload className="mx-auto h-6 w-6 text-slate-400" aria-hidden />
            <p className="mt-2 text-sm text-slate-600">Drop files here, paste, or browse</p>
            <label className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
              <FileText className="h-4 w-4" aria-hidden />
              Choose files
              <input
                type="file"
                accept={TICKET_ATTACHMENT_ACCEPT}
                multiple
                className="hidden"
                onChange={(e) => onPickScreenshots(e.target.files)}
              />
            </label>
          </div>
          {shots.length ? (
            <ul className="mt-3 space-y-2">
              {shots.map((shot, index) => (
                <li key={shot.previewUrl} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
                  <span className="truncate">{shot.file.name}</span>
                  <button type="button" onClick={() => removeShot(index)} className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
                    <X className="h-4 w-4" aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        {!sprintsLoading && activeSprint ? (
          <p className="text-xs text-slate-500">
            New tickets are added to the active sprint: <strong>{activeSprint.name}</strong>.
          </p>
        ) : null}

        <div className="flex flex-wrap gap-3">
          <button type="submit" disabled={submitting} className="dp-btn-primary">
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
            {submitting ? "Creating…" : "Create ticket"}
          </button>
          <Link href={`/board?level=${boardLevel}`} className="dp-btn-secondary">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
