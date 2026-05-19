"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { AdminImageField } from "@/components/AdminImageField";
import { adminFetch } from "@/lib/admin-api";

export default function EditTeamMemberPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [member, setMember] = useState<Record<string, unknown> | null>(null);
  const [imageUrl, setImageUrl] = useState("");

  useEffect(() => {
    async function loadMember() {
      try {
        const res = await adminFetch("/api/admin/team/admin/all");
        const data = await res.json();
        const found = (data.data || []).find((m: { id: string }) => m.id === id);
        if (found) {
          setMember(found);
          setImageUrl(String((found.imageUrl as string) ?? "").trim());
        } else {
          setMember(null);
          setImageUrl("");
        }
      } catch (error) {
        console.error("Error loading team member:", error);
      } finally {
        setIsFetching(false);
      }
    }
    loadMember();
  }, [id]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const slotRaw = formData.get("featuredLeadershipOrder");
    const slotNum = slotRaw === "" || slotRaw == null ? null : Number(String(slotRaw));
    const featuredLeadershipOrder =
      slotNum != null && !Number.isNaN(slotNum) && [1, 2, 3].includes(slotNum) ? slotNum : null;

    const payload = {
      name: formData.get("name"),
      role: formData.get("role"),
      department: formData.get("department"),
      description: String(formData.get("description") ?? ""),
      imageUrl: imageUrl.trim(),
      order: parseInt(formData.get("order") as string) || 0,
      published: formData.get("published") === "on",
      featuredLeadershipOrder,
    };

    try {
      const res = await adminFetch(`/api/admin/team/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to update team member");
      router.push("/team");
    } catch (error) {
      console.error(error);
      alert("Failed to update team member");
    } finally {
      setIsLoading(false);
    }
  }

  if (isFetching) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-2 border-black border-t-transparent rounded-full" /></div>;
  }
  if (!member) return <div className="text-gray-500">Team member not found.</div>;

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/team" className="p-1.5 rounded hover:bg-gray-100"><ArrowLeft className="w-4 h-4" /></Link>
        <div>
          <h2 className="text-lg font-semibold">Edit Team Member</h2>
          <p className="text-gray-500 text-sm">{member.name as string}</p>
        </div>
      </div>

      <form key={member.id as string} onSubmit={onSubmit} className="space-y-6">
        <section className="space-y-4 rounded-xl border border-gray-200 bg-white p-6">
          <h3 className="font-semibold">Profile Details</h3>
          <div>
            <label className="block text-sm font-medium mb-1">Full Name *</label>
            <input name="name" required defaultValue={member.name as string}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Role / Title *</label>
            <input name="role" required defaultValue={member.role as string}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Department *</label>
            <select name="department" required defaultValue={member.department as string}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-sm bg-white">
              <option value="Leadership">Leadership</option>
              <option value="Management Team">Management Team</option>
              <option value="Sales Team">Sales Team</option>
              <option value="Recruitment Team">Recruitment Team</option>
              <option value="ServiceNow Developers">ServiceNow Developers</option>
              <option value="Salesforce Developers">Salesforce Developers</option>
              <option value="MuleSoft Developers">MuleSoft Developers</option>
              <option value="Workday Team">Workday Team</option>
              <option value="Product Team">Product Team</option>
              <option value="Other Techstack Developers">Other Techstack Developers</option>
            </select>
          </div>
          <AdminImageField
            name="imageUrl"
            label="Profile photo"
            value={imageUrl}
            onValueChange={setImageUrl}
            className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
            labelClassName="mb-1 block text-sm font-medium"
          />
          <div>
            <label className="block text-sm font-medium mb-1">Description / bio</label>
            <textarea
              name="description"
              rows={4}
              defaultValue={(member.description as string) || ""}
              placeholder="Short bio shown on the About page under this person when published."
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-sm"
            />
            <p className="mt-1 text-xs text-gray-500">If left empty, the marketing site uses the matching placeholder from Site content → About page (workforce).</p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Meet the Leadership slot</label>
            <select
              name="featuredLeadershipOrder"
              defaultValue={
                member.featuredLeadershipOrder != null && typeof member.featuredLeadershipOrder === "number"
                  ? String(member.featuredLeadershipOrder)
                  : ""
              }
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-sm bg-white"
            >
              <option value="">Not on leadership row</option>
              <option value="1">Position 1 (left)</option>
              <option value="2">Position 2 (center)</option>
              <option value="3">Position 3 (right)</option>
            </select>
            <p className="mt-1 text-xs text-gray-500">
              Saving assigns this slot; another member with the same slot is cleared automatically.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Display Order</label>
              <input name="order" type="number" defaultValue={member.order as number}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-sm" />
            </div>
            <div className="flex items-center gap-3 pt-6">
              <input name="published" type="checkbox" id="published" defaultChecked={member.published as boolean} className="w-4 h-4 rounded" />
              <label htmlFor="published" className="text-sm font-medium">Published</label>
            </div>
          </div>
        </section>
        <div className="flex gap-3">
          <button type="submit" disabled={isLoading}
            className="inline-flex items-center gap-2 bg-black text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors">
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Save Changes
          </button>
          <Link href="/team" className="inline-flex items-center px-6 py-2 rounded-lg text-sm font-medium border border-gray-200 hover:bg-gray-50">Cancel</Link>
        </div>
      </form>
    </div>
  );
}
