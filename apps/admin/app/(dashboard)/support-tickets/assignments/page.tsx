"use client";
import { appAlert, appConfirm } from "@/lib/app-alert";

import { useEffect, useState } from "react";
import Link from "next/link";
import { adminFetch } from "@/lib/admin-api";
import { useAdminSession } from "@/contexts/AdminSessionContext";

type Consultant = {
  id: string;
  email: string;
  name: string;
  organizations: { id: string; name: string }[];
};

export default function SupportAssignmentsPage() {
  const { role } = useAdminSession();
  const [consultants, setConsultants] = useState<Consultant[]>([]);
  const [orgs, setOrgs] = useState<{ id: string; name: string }[]>([]);
  const [selected, setSelected] = useState<Record<string, string[]>>({});

  useEffect(() => {
    if (role !== "admin") return;
    void adminFetch("/api/admin/ticketing/consultants")
      .then((res) => res.json())
      .then((data) => {
        const list = (data.data as Consultant[]) ?? [];
        setConsultants(list);
        const map: Record<string, string[]> = {};
        for (const c of list) map[c.id] = c.organizations.map((o) => o.id);
        setSelected(map);
      });
    void adminFetch("/api/admin/ticketing/organizations")
      .then((res) => res.json())
      .then((data) => setOrgs((data.data as { id: string; name: string }[]) ?? []));
  }, [role]);

  async function save(consultantId: string) {
    const res = await adminFetch(`/api/admin/ticketing/consultants/${consultantId}/organizations`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ organizationIds: selected[consultantId] ?? [] }),
    });
    if (!res.ok) appAlert("Save failed");
  }

  if (role !== "admin") {
    return <p className="text-gray-500">Admin only.</p>;
  }

  return (
    <div className="space-y-6">
      <Link href="/support-tickets" className="text-sm text-blue-600 hover:underline">← Tickets</Link>
      <h1 className="text-2xl font-semibold">Consultant project access</h1>
      <p className="text-sm text-gray-500">Sales consultants only see tickets for assigned projects. Admins see all tickets.</p>
      <ul className="space-y-4">
        {consultants.map((c) => (
          <li key={c.id} className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
            <p className="font-medium">{c.name} <span className="text-sm text-gray-500">({c.email})</span></p>
            <div className="mt-3 flex flex-wrap gap-2">
              {orgs.map((o) => {
                const checked = (selected[c.id] ?? []).includes(o.id);
                return (
                  <label key={o.id} className="inline-flex items-center gap-2 rounded-lg border px-2 py-1 text-sm">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        const cur = selected[c.id] ?? [];
                        setSelected({
                          ...selected,
                          [c.id]: e.target.checked ? [...cur, o.id] : cur.filter((id) => id !== o.id),
                        });
                      }}
                    />
                    {o.name}
                  </label>
                );
              })}
            </div>
            <button
              type="button"
              onClick={() => void save(c.id)}
              className="mt-3 rounded-lg bg-black px-3 py-1.5 text-sm text-white dark:bg-white dark:text-black"
            >
              Save
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
