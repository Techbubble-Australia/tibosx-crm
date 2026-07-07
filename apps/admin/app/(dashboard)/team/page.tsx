"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Edit, Trash2, ChevronUp, ChevronDown } from "lucide-react";
import { adminFetch } from "@/lib/admin-api";

interface TeamMember {
  id: string;
  name: string;
  role: string;
  location: string;
  department: string;
  imageUrl: string;
  order: number;
  published: boolean;
  featuredLeadershipOrder: number | null;
}

type SortKey = "name" | "role" | "location" | "department" | "featuredLeadershipOrder" | "order" | "published";
type SortDir = "asc" | "desc";

function SortHeader({
  label,
  sortKey,
  activeKey,
  dir,
  onSort,
}: {
  label: string;
  sortKey: SortKey;
  activeKey: SortKey;
  dir: SortDir;
  onSort: (key: SortKey) => void;
}) {
  const active = activeKey === sortKey;
  return (
    <button
      type="button"
      onClick={() => onSort(sortKey)}
      className="inline-flex items-center gap-1 font-medium text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100"
    >
      {label}
      {active ? (
        dir === "asc" ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />
      ) : (
        <span className="inline-block h-3.5 w-3.5 opacity-0" aria-hidden />
      )}
    </button>
  );
}

export default function TeamPage() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortKey, setSortKey] = useState<SortKey>("order");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  useEffect(() => {
    void fetchMembers();
  }, []);

  async function fetchMembers() {
    try {
      const res = await adminFetch("/api/admin/team/admin/all");
      const data = await res.json();
      setMembers(data.data || []);
    } catch (error) {
      console.error("Error fetching team members:", error);
    } finally {
      setIsLoading(false);
    }
  }

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  const sortedMembers = useMemo(() => {
    const list = [...members];
    list.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "name":
          cmp = a.name.localeCompare(b.name);
          break;
        case "role":
          cmp = a.role.localeCompare(b.role);
          break;
        case "location":
          cmp = (a.location || "").localeCompare(b.location || "");
          break;
        case "department":
          cmp = a.department.localeCompare(b.department);
          break;
        case "featuredLeadershipOrder": {
          const av = a.featuredLeadershipOrder ?? 999;
          const bv = b.featuredLeadershipOrder ?? 999;
          cmp = av - bv;
          break;
        }
        case "order":
          cmp = a.order - b.order;
          break;
        case "published":
          cmp = Number(b.published) - Number(a.published);
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return list;
  }, [members, sortKey, sortDir]);

  async function deleteMember(id: string) {
    if (!confirm("Delete this team member?")) return;
    try {
      const res = await adminFetch(`/api/admin/team/${id}`, { method: "DELETE" });
      if (res.ok) setMembers(members.filter((m) => m.id !== id));
    } catch (error) {
      console.error("Error deleting team member:", error);
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-black border-t-transparent dark:border-white" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Team Members</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Manage team member profiles shown on the About page</p>
        </div>
        <Link
          href="/team/new"
          className="inline-flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 dark:bg-white dark:text-black"
        >
          <Plus className="h-4 w-4" />
          Add Member
        </Link>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
            <tr>
              <th className="px-4 py-3 text-left">
                <SortHeader label="Name" sortKey="name" activeKey={sortKey} dir={sortDir} onSort={handleSort} />
              </th>
              <th className="px-4 py-3 text-left">
                <SortHeader label="Role" sortKey="role" activeKey={sortKey} dir={sortDir} onSort={handleSort} />
              </th>
              <th className="px-4 py-3 text-left">
                <SortHeader label="Location" sortKey="location" activeKey={sortKey} dir={sortDir} onSort={handleSort} />
              </th>
              <th className="px-4 py-3 text-left">
                <SortHeader label="Department" sortKey="department" activeKey={sortKey} dir={sortDir} onSort={handleSort} />
              </th>
              <th className="px-4 py-3 text-left">
                <SortHeader label="Leadership" sortKey="featuredLeadershipOrder" activeKey={sortKey} dir={sortDir} onSort={handleSort} />
              </th>
              <th className="px-4 py-3 text-left">
                <SortHeader label="Order" sortKey="order" activeKey={sortKey} dir={sortDir} onSort={handleSort} />
              </th>
              <th className="px-4 py-3 text-left">
                <SortHeader label="Status" sortKey="published" activeKey={sortKey} dir={sortDir} onSort={handleSort} />
              </th>
              <th className="px-4 py-3 text-right font-medium text-gray-600 dark:text-gray-300">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {sortedMembers.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-gray-400">
                  No team members yet.
                </td>
              </tr>
            ) : (
              sortedMembers.map((member) => (
                <tr key={member.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">{member.name}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{member.role}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{member.location?.trim() || "—"}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{member.department}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                    {member.featuredLeadershipOrder != null ? `Slot ${member.featuredLeadershipOrder}` : "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{member.order}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        member.published
                          ? "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                      }`}
                    >
                      {member.published ? "Published" : "Draft"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex items-center gap-2">
                      <Link
                        href={`/team/${member.id}`}
                        className="rounded p-1.5 text-gray-500 hover:bg-gray-100 hover:text-black dark:hover:bg-gray-800 dark:hover:text-white"
                      >
                        <Edit className="h-4 w-4" />
                      </Link>
                      <button
                        type="button"
                        onClick={() => void deleteMember(member.id)}
                        className="rounded p-1.5 text-gray-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
