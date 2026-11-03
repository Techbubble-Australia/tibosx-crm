"use client";
import { appAlert, appConfirm } from "@/lib/app-alert";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { AdminImageField } from "@/components/AdminImageField";
import { TeamDepartmentSelect } from "@/components/team/TeamDepartmentSelect";
import { adminFetch } from "@/lib/admin-api";

export default function NewTeamMemberPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const slotRaw = formData.get("featuredLeadershipOrder");
    const featuredLeadershipOrder =
      slotRaw === "" || slotRaw == null ? undefined : Number(String(slotRaw));
    const payload: Record<string, unknown> = {
      name: formData.get("name"),
      role: formData.get("role"),
      location: String(formData.get("location") ?? ""),
      department: formData.get("department"),
      description: String(formData.get("description") ?? ""),
      imageUrl: imageUrl.trim(),
      order: parseInt(formData.get("order") as string) || 0,
      published: formData.get("published") === "on",
    };
    if (featuredLeadershipOrder !== undefined && [1, 2, 3].includes(featuredLeadershipOrder)) {
      payload.featuredLeadershipOrder = featuredLeadershipOrder;
    }

    try {
      const res = await adminFetch("/api/admin/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to create team member");
      router.push("/team");
    } catch (error) {
      console.error(error);
      appAlert("Failed to create team member");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/team" className="p-1.5 rounded hover:bg-gray-100">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h2 className="text-lg font-semibold">New Team Member</h2>
          <p className="text-gray-500 text-sm">Add a team member profile to the About page</p>
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-6">
        <section className="bg-white p-6 rounded-xl border border-gray-200 space-y-4">
          <h3 className="font-semibold">Profile Details</h3>

          <div>
            <label className="block text-sm font-medium mb-1">Full Name <span className="text-red-500">*</span></label>
            <input name="name" required
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-sm"
              placeholder="e.g. Nikita T" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Role / Title <span className="text-red-500">*</span></label>
            <input name="role" required
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-sm"
              placeholder="e.g. Founder & Director" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Location</label>
            <input name="location"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-sm"
              placeholder="e.g. Australia, India, USA" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Department <span className="text-red-500">*</span></label>
            <TeamDepartmentSelect />
            <p className="mt-1 text-xs text-gray-500 dark:text-zinc-400">
              Options come from Site content → About page → Workforce → Team tabs (plus any department already used on a
              team member). Add a team tab there to add a department here.
            </p>
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
              placeholder="Short bio shown on the About page when this member is published."
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Meet the Leadership slot</label>
            <select
              name="featuredLeadershipOrder"
              defaultValue=""
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-sm bg-white"
            >
              <option value="">Not on leadership row</option>
              <option value="1">Position 1 (left)</option>
              <option value="2">Position 2 (center)</option>
              <option value="3">Position 3 (right)</option>
            </select>
            <p className="mt-1 text-xs text-gray-500">
              Assigns this profile to the About page leadership row. All three positions must be filled with published members for the site to use Team data.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Display Order</label>
              <input name="order" type="number" defaultValue={0}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-sm" />
            </div>
            <div className="flex items-center gap-3 pt-6">
              <input name="published" type="checkbox" id="published" defaultChecked className="w-4 h-4 rounded" />
              <label htmlFor="published" className="text-sm font-medium">Published</label>
            </div>
          </div>
        </section>

        <div className="flex gap-3">
          <button type="submit" disabled={isLoading}
            className="inline-flex items-center gap-2 bg-black text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors">
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Add Team Member
          </button>
          <Link href="/team" className="inline-flex items-center px-6 py-2 rounded-lg text-sm font-medium border border-gray-200 hover:bg-gray-50">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
