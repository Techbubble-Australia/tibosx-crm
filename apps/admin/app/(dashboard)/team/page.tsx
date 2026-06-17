"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Edit, Trash2 } from "lucide-react";
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

export default function TeamPage() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => { fetchMembers(); }, []);

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

  async function deleteMember(id: string) {
    if (!confirm("Delete this team member?")) return;
    try {
      const res = await adminFetch(`/api/admin/team/${id}`, {
        method: "DELETE",
      });
      if (res.ok) setMembers(members.filter((m) => m.id !== id));
    } catch (error) {
      console.error("Error deleting team member:", error);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-black border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold">Team Members</h2>
          <p className="text-gray-500 text-sm">Manage team member profiles shown on the About page</p>
        </div>
        <Link href="/team/new" className="inline-flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors">
          <Plus className="w-4 h-4" />
          Add Member
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Role</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Location</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Department</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Leadership</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Order</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {members.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-gray-400">No team members yet.</td>
              </tr>
            ) : (
              members.map((member) => (
                <tr key={member.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{member.name}</td>
                  <td className="px-4 py-3 text-gray-600">{member.role}</td>
                  <td className="px-4 py-3 text-gray-600">{member.location?.trim() || "—"}</td>
                  <td className="px-4 py-3 text-gray-600">{member.department}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {member.featuredLeadershipOrder != null ? `Slot ${member.featuredLeadershipOrder}` : "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{member.order}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${member.published ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {member.published ? "Published" : "Draft"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex items-center gap-2">
                      <Link href={`/team/${member.id}`} className="p-1.5 rounded hover:bg-gray-100 text-gray-500 hover:text-black">
                        <Edit className="w-4 h-4" />
                      </Link>
                      <button onClick={() => deleteMember(member.id)} className="p-1.5 rounded hover:bg-red-50 text-gray-500 hover:text-red-600">
                        <Trash2 className="w-4 h-4" />
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
