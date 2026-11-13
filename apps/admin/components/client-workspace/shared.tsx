"use client";

export type Overview = {
  /** `id` is "all" when an admin views every client together. */
  client: { id: string; name: string };
  /** "projects": "Client workspace" unticked for this contact, so no invoices or payments. */
  scope: "full" | "projects";
  clients: Array<{ id: string; name: string }>;
  allClientsOption?: boolean;
  today: string;
  financialYearStart: string;
  currency: string;
  currencies?: string[];
  kpis: {
    projectsInProgress: number;
    projectsEnded: number;
    timesheetsAwaiting: { count: number; hours: number };
    awaitingPayment: { amount: number; count: number };
    overdue: { amount: number; count: number };
    dueThisMonth: { amount: number; count: number };
    paidThisYear: { amount: number; invoiced: number };
  };
  chart: Array<{ month: string; paid: number; awaiting: number; draft: number }>;
  invoices: Array<{
    id: string;
    invoiceNumber: string;
    contractTitle: string;
    clientName?: string;
    reference: string;
    issueDate: string;
    dueDate: string;
    currency: string;
    amount: number;
    balance: number;
    status: string;
    overdue: boolean;
    files: Array<{ name: string; url: string }>;
  }>;
  projects: Array<{
    id: string;
    projectNumber: string;
    title: string;
    members: string[];
    startDate: string;
    endDate: string;
    progress: number;
    remainingDays: number | null;
    state: "IN_PROGRESS" | "ON_HOLD" | "ENDED";
  }>;
  timesheets: Array<{
    id: string;
    month: string;
    projectNumber: string;
    projectTitle: string;
    member: string;
    hours: number;
    status: string;
  }>;
};

export function money(amount: number, currency: string, compact = false) {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency,
    minimumFractionDigits: compact ? 0 : 2,
    maximumFractionDigits: compact && amount >= 1000 ? 1 : 2,
    notation: compact && amount >= 1000 ? "compact" : "standard",
  }).format(amount);
}

export function day(iso: string) {
  return new Date(iso).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}

export function monthLabel(key: string, short = false) {
  return new Date(`${key}-01T00:00:00.000Z`).toLocaleDateString("en-AU", {
    month: short ? "short" : "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function plural(n: number, word: string) {
  return `${n} ${word}${n === 1 ? "" : "s"}`;
}

export const STATUS_PILL: Record<string, { label: string; className: string }> = {
  PAID: { label: "Paid", className: "bg-green-100 text-green-800" },
  AWAITING_PAYMENT: { label: "Awaiting payment", className: "bg-amber-100 text-amber-900" },
  OVERDUE: { label: "Overdue", className: "bg-red-100 text-red-800" },
  SUBMITTED: { label: "Submitted – awaiting approval", className: "bg-amber-100 text-amber-900" },
  APPROVED: { label: "Approved", className: "bg-green-100 text-green-800" },
  IN_PROGRESS: { label: "In progress", className: "bg-sky-100 text-sky-800" },
  ON_HOLD: { label: "On hold", className: "bg-gray-100 text-gray-700" },
  ENDED: { label: "Ended", className: "bg-gray-100 text-gray-600" },
};

export function Pill({ status }: { status: string }) {
  const pill = STATUS_PILL[status] ?? { label: status, className: "bg-gray-100 text-gray-700" };
  return <span className={`inline-flex whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ${pill.className}`}>{pill.label}</span>;
}

export function Card({ label, value, hint, tone = "default" }: { label: string; value: string; hint: string; tone?: "default" | "warn" | "alert" }) {
  const valueClass = tone === "alert" ? "text-red-600" : tone === "warn" ? "text-amber-600" : "text-gray-900 dark:text-gray-100";
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</p>
      <p className={`mt-2 text-2xl font-bold tabular-nums ${valueClass}`}>{value}</p>
      <p className="mt-1 text-xs text-gray-500">{hint}</p>
    </div>
  );
}

export function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
      <h3 className="font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
      {subtitle ? <p className="mb-4 mt-0.5 text-sm text-gray-500">{subtitle}</p> : <div className="mb-4" />}
      {children}
    </section>
  );
}


/** Projects table shared by the Client workspace and the client Projects page. */
export function ProjectsTable({ projects }: { projects: Overview["projects"] }) {
  return (
    <>
        {projects.length ? (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-gray-500 dark:border-gray-800">
                  <th className="py-2 pr-3">Project</th>
                  <th className="py-2 pr-3">Member</th>
                  <th className="py-2 pr-3">Dates</th>
                  <th className="py-2 pr-3">Progress</th>
                  <th className="py-2 pr-3">Remaining</th>
                  <th className="py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((p) => (
                  <tr key={p.id} className="border-b border-gray-50 dark:border-gray-800">
                    <td className="py-2 pr-3 font-medium">{p.projectNumber} · {p.title}</td>
                    <td className="py-2 pr-3">{p.members.join(", ") || "—"}</td>
                    <td className="whitespace-nowrap py-2 pr-3">{day(p.startDate)} – {day(p.endDate)}</td>
                    <td className="py-2 pr-3">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-24 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                          <div
                            className={`h-full rounded-full ${p.state === "ENDED" ? "bg-gray-400" : "bg-black dark:bg-white"}`}
                            style={{ width: `${p.progress}%` }}
                          />
                        </div>
                        <span className="tabular-nums text-gray-600">{p.progress}%</span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap py-2 pr-3 tabular-nums">
                      {p.remainingDays == null ? "—" : plural(p.remainingDays, "day")}
                    </td>
                    <td className="py-2"><Pill status={p.state} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-gray-500">No projects yet.</p>
        )}
    </>
  );
}
