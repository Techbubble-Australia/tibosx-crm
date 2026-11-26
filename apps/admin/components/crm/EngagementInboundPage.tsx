"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { adminFetch } from "@/lib/admin-api";
import { ClientsOnlyGuard } from "@/components/ClientsOnlyGuard";
import {
  CrmFilterSelect,
  CrmGhostButton,
  CrmKpiCard,
  CrmPageHeader,
  CrmPrimaryButton,
  CrmSegmentTabs,
} from "@/components/crm/CrmPageChrome";
import { titleCaseToken } from "@/lib/crm-format";

type Lead = {
  id: string;
  status: string;
  firstName: string;
  lastName: string;
  company: string | null;
  source: string;
  owner?: { name: string | null; email: string } | null;
  createdAt: string;
  notes?: string | null;
};

function channelFromSource(source: string) {
  const s = (source || "").toLowerCase();
  if (s.includes("email") || s.includes("mail")) return "Email";
  if (s.includes("call") || s.includes("phone")) return "Call";
  if (s.includes("chat") || s.includes("web") || s.includes("website") || s.includes("form")) return "Chat";
  if (s.includes("referral")) return "Email";
  return "Email";
}

function relativeReceived(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const now = new Date();
  const sameDay =
    d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
  if (sameDay) {
    return d.toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit", hour12: false });
  }
  const yday = new Date(now);
  yday.setDate(yday.getDate() - 1);
  if (d.getFullYear() === yday.getFullYear() && d.getMonth() === yday.getMonth() && d.getDate() === yday.getDate()) {
    return "Yesterday";
  }
  const hours = Math.round((now.getTime() - d.getTime()) / 3600000);
  if (hours < 48) return `${hours} hours ago`;
  return d.toLocaleDateString("en-AU", { day: "numeric", month: "short" });
}

function statusLabel(status: string) {
  const s = status.toUpperCase();
  if (s === "NEW") return "Unanswered";
  if (s === "CONTACTED" || s === "QUALIFIED" || s === "NURTURING") return "Replied";
  if (s === "CONVERTED") return "Replied";
  return titleCaseToken(status);
}

function statusTone(label: string) {
  if (label === "Unanswered" || label === "Waiting" || label === "Missed") return "bg-amber-50 text-amber-800";
  if (label === "Replied") return "bg-emerald-50 text-emerald-700";
  if (label === "Voicemail") return "bg-sky-50 text-sky-800";
  return "bg-zinc-100 text-zinc-700";
}

/** TIBOSX CRM Screens – 21 Engagement Inbound (backed by inbound leads as engagement rows). */
export function EngagementInboundPage() {
  const [rows, setRows] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [channel, setChannel] = useState("");
  const [owner, setOwner] = useState("");
  const [status, setStatus] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    void adminFetch("/api/admin/crm/leads?status=open")
      .then((r) => r.json())
      .then((body) => setRows((body.data ?? []) as Lead[]))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const owners = useMemo(() => {
    const names = new Set<string>();
    for (const r of rows) {
      const n = r.owner?.name?.trim() || r.owner?.email;
      if (n) names.add(n);
    }
    return [...names].sort((a, b) => a.localeCompare(b));
  }, [rows]);

  const mapped = rows.map((lead) => {
    const name = `${lead.firstName} ${lead.lastName}`.trim() || lead.company || "Contact";
    const ch = channelFromSource(lead.source);
    const st = statusLabel(lead.status);
    const handled = lead.owner?.name?.trim() || lead.owner?.email || "Unassigned";
    return {
      id: lead.id,
      contact: name,
      company: lead.company,
      channel: ch,
      summary:
        lead.notes?.trim() ||
        (lead.source ? `${titleCaseToken(lead.source)} enquiry` : "Inbound enquiry"),
      received: relativeReceived(lead.createdAt),
      handledBy: handled,
      status: st,
      createdAt: lead.createdAt,
    };
  });

  const filtered = mapped.filter((r) => {
    if (channel && r.channel !== channel) return false;
    if (owner && r.handledBy !== owner) return false;
    if (status && r.status !== status) return false;
    return true;
  });

  const unanswered = mapped.filter((r) => r.status === "Unanswered" || r.status === "Waiting").length;
  const weekAgo = Date.now() - 7 * 86400000;
  const inboundWeek = mapped.filter((r) => new Date(r.createdAt).getTime() >= weekAgo).length;

  return (
    <ClientsOnlyGuard>
      <div className="space-y-5">
        <CrmPageHeader
          title="Engagement"
          subtitle="Track incoming and outgoing calls, emails and chats with contacts"
          actions={
            <>
              <CrmGhostButton>Export</CrmGhostButton>
              <CrmPrimaryButton href="/leads/new">
                <Plus className="h-4 w-4" /> Log inbound
              </CrmPrimaryButton>
            </>
          }
        />

        <CrmSegmentTabs
          activeId="inbound"
          tabs={[
            { id: "inbound", label: "Inbound", href: "/leads" },
            { id: "outbound", label: "Outbound", href: "/leads?tab=outbound" },
            { id: "inbox", label: "Inbox", href: "/leads?tab=inbox" },
            { id: "chatbots", label: "Chatbots", href: "/leads?tab=chatbots" },
            { id: "forms", label: "Forms", href: "/leads?tab=forms" },
            { id: "storefront", label: "Storefront", href: "/leads?tab=storefront" },
          ]}
        />

        <div className="flex flex-wrap gap-3.5">
          <CrmKpiCard label="Inbound this week" value={String(inboundWeek)} sub="open enquiries" />
          <CrmKpiCard label="Needs reply" value={String(unanswered)} sub="awaiting response" />
          <CrmKpiCard label="Missed calls" value="—" sub="not tracked yet" />
          <CrmKpiCard label="First response" value="—" sub="target 4 h" />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <CrmFilterSelect value={channel} onChange={setChannel} aria-label="Channel">
            <option value="">All</option>
            <option value="Call">Calls</option>
            <option value="Email">Emails</option>
            <option value="Chat">Chats</option>
          </CrmFilterSelect>
          <CrmFilterSelect value={owner} onChange={setOwner} aria-label="Owner">
            <option value="">All owners</option>
            {owners.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </CrmFilterSelect>
          <CrmFilterSelect value={status} onChange={setStatus} aria-label="Status">
            <option value="">Any status</option>
            <option value="Unanswered">Unanswered</option>
            <option value="Replied">Replied</option>
            <option value="Waiting">Waiting</option>
          </CrmFilterSelect>
        </div>

        <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-gray-900">
          {loading ? (
            <div className="flex h-40 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-900 border-t-transparent" />
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-100 text-left text-xs text-zinc-500 dark:border-zinc-800">
                  <th className="px-4 py-3 font-medium">Contact</th>
                  <th className="px-4 py-3 font-medium">Channel</th>
                  <th className="px-4 py-3 font-medium">Summary</th>
                  <th className="px-4 py-3 font-medium">Received</th>
                  <th className="px-4 py-3 font-medium">Handled by</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => (
                  <tr key={row.id} className="border-b border-zinc-50 last:border-0 dark:border-zinc-800">
                    <td className="px-4 py-3">
                      <Link href={`/leads?highlight=${encodeURIComponent(row.id)}`} className="font-semibold hover:underline">
                        {row.contact}
                      </Link>
                      {row.company ? <p className="text-xs text-zinc-500">{row.company}</p> : null}
                    </td>
                    <td className="px-4 py-3 text-zinc-600">{row.channel}</td>
                    <td className="max-w-xs truncate px-4 py-3 text-zinc-700">{row.summary}</td>
                    <td className="px-4 py-3 text-zinc-500">{row.received}</td>
                    <td className="px-4 py-3 text-zinc-600">{row.handledBy}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusTone(row.status)}`}>
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {!filtered.length ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-sm text-zinc-400">
                      No inbound items match these filters.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </ClientsOnlyGuard>
  );
}
