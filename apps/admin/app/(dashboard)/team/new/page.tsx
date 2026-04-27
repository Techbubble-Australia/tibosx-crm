"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { AdminImageField } from "@/components/AdminImageField";
import { adminFetch } from "@/lib/admin-api";

export default function NewTeamMemberPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const payload = {
      name: formData.get("name"),
      role: formData.get("role"),
      department: formData.get("department"),
      imageUrl: formData.get("imageUrl") || "",
      order: parseInt(formData.get("order") as string) || 0,
      published: formData.get("published") === "on",
    };

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
      alert("Failed to create team member");
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
            <label className="block text-sm font-medium mb-1">Full Name *</label>
            <input name="name" required
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-sm"
              placeholder="e.g. Nikita T" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Role / Title *</label>
            <input name="role" required
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-sm"
              placeholder="e.g. Founder & Director, Australia" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Department *</label>
            <select name="department" required
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-sm bg-white">
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
            defaultValue=""
            className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
            labelClassName="mb-1 block text-sm font-medium"
          />

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
