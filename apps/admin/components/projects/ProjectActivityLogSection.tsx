"use client";

type ActivityLog = {
  id: string;
  action: string;
  fieldName: string | null;
  oldValue: string | null;
  newValue: string | null;
  reason: string | null;
  performedByName: string;
  createdAt: string;
};

function formatActivityDate(value: string) {
  return new Date(value).toLocaleString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatAction(log: ActivityLog): string {
  switch (log.action) {
    case "CREATED":
      return "Project created";
    case "UPDATED":
      return "Project updated";
    case "FIELD_UPDATED":
      return log.fieldName ? `${log.fieldName} updated` : "Field updated";
    case "CREDENTIALS_GENERATED":
      return `Credentials generated for ${log.newValue ?? "member"}`;
    default:
      return log.action.replaceAll("_", " ");
  }
}

type Props = {
  logs: ActivityLog[];
};

export function ProjectActivityLogSection({ logs }: Props) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
      <h3 className="mb-4 font-semibold text-gray-900 dark:text-gray-100">Activity log</h3>
      {logs.length === 0 ? (
        <p className="text-sm text-gray-400">No activity recorded yet.</p>
      ) : (
        <ul className="divide-y divide-gray-100 dark:divide-gray-800">
          {logs.map((log) => (
            <li key={log.id} className="py-3 text-sm">
              <p className="font-medium text-gray-900 dark:text-gray-100">{formatAction(log)}</p>
              {log.fieldName && (log.oldValue || log.newValue) ? (
                <p className="text-gray-600 dark:text-gray-400">
                  {log.oldValue ?? "—"} → {log.newValue ?? "—"}
                </p>
              ) : null}
              {log.reason ? <p className="text-gray-600 dark:text-gray-400">Reason: {log.reason}</p> : null}
              <p className="mt-1 text-xs text-gray-400">
                {formatActivityDate(log.createdAt)}
                {log.performedByName ? ` · ${log.performedByName}` : ""}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
