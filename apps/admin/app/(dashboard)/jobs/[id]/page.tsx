"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { CountryFlagPicker } from "@/components/CountryFlagPicker";
import { adminFetch } from "@/lib/admin-api";

export default function EditJobPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [job, setJob] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    async function loadJob() {
      try {
        const res = await adminFetch("/api/admin/jobs/admin/all");
        const data = await res.json();
        const found = (data.data || []).find((j: { id: string }) => j.id === id);
        setJob(found || null);
      } catch (error) {
        console.error("Error loading job:", error);
      } finally {
        setIsFetching(false);
      }
    }
    loadJob();
  }, [id]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const payload = {
      title: formData.get("title"),
      location: formData.get("location"),
      country: formData.get("country"),
      flag: formData.get("flag"),
      type: formData.get("type"),
      workMode: formData.get("workMode"),
      department: formData.get("department"),
      description: formData.get("description"),
      order: parseInt(formData.get("order") as string) || 0,
      published: formData.get("published") === "on",
    };

    try {
      const res = await adminFetch(`/api/admin/jobs/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to update job");
      router.push("/jobs");
    } catch (error) {
      console.error(error);
      alert("Failed to update job listing");
    } finally {
      setIsLoading(false);
    }
  }

  if (isFetching) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-black border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!job) return <div className="text-gray-500">Job listing not found.</div>;

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/jobs" className="p-1.5 rounded hover:bg-gray-100">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h2 className="text-lg font-semibold">Edit Job Listing</h2>
          <p className="text-gray-500 text-sm">{job.title as string}</p>
        </div>
      </div>

      <form key={id} onSubmit={onSubmit} className="space-y-6">
        <section className="space-y-4 rounded-xl border border-gray-200 bg-white p-6">
          <h3 className="font-semibold">Job Details</h3>

          <div>
            <label className="block text-sm font-medium mb-1">Job Title *</label>
            <input
              name="title"
              required
              defaultValue={job.title as string}
              className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Location *</label>
            <input
              name="location"
              required
              defaultValue={job.location as string}
              className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
            />
            <p className="mt-1 text-xs text-gray-500">Shown on the careers listing next to the flag.</p>
          </div>

          <CountryFlagPicker
            defaultFlag={(job.flag as string) || ""}
            defaultCountry={(job.country as string) || ""}
            selectClassName="w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
            labelClassName="mb-1 block text-sm font-medium"
          />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Employment Type *</label>
              <select
                name="type"
                required
                defaultValue={job.type as string}
                className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
              >
                <option value="Full-time">Full-time</option>
                <option value="Contract">Contract</option>
                <option value="Part-time">Part-time</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Work Mode *</label>
              <select
                name="workMode"
                required
                defaultValue={job.workMode as string}
                className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
              >
                <option value="Remote">Remote</option>
                <option value="Hybrid">Hybrid</option>
                <option value="Onsite">Onsite</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Department *</label>
            <select
              name="department"
              required
              defaultValue={job.department as string}
              className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
            >
              <option value="Engineering">Engineering</option>
              <option value="Consulting">Consulting</option>
              <option value="Sales">Sales</option>
              <option value="Operations">Operations</option>
              <option value="Recruitment">Recruitment</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              name="description"
              rows={5}
              defaultValue={job.description as string}
              className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Display Order</label>
              <input
                name="order"
                type="number"
                defaultValue={job.order as number}
                className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>
            <div className="flex items-center gap-3 pt-6">
              <input name="published" type="checkbox" id="published" defaultChecked={job.published as boolean} className="w-4 h-4 rounded" />
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
          <Link href="/jobs" className="inline-flex items-center px-6 py-2 rounded-lg text-sm font-medium border border-gray-200 hover:bg-gray-50">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
