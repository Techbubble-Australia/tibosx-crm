"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { AdminImageField } from "@/components/AdminImageField";
import { adminFetch } from "@/lib/admin-api";

export default function NewTestimonialPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const payload = {
      quote: formData.get("quote"),
      authorName: formData.get("authorName"),
      authorTitle: formData.get("authorTitle"),
      authorCompany: formData.get("authorCompany"),
      authorInitials: formData.get("authorInitials"),
      authorImageUrl: formData.get("authorImageUrl") || "",
      order: parseInt(formData.get("order") as string) || 0,
      published: formData.get("published") === "on",
    };

    try {
      const res = await adminFetch("/api/admin/testimonials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to create testimonial");
      router.push("/testimonials");
    } catch (error) {
      console.error(error);
      alert("Failed to create testimonial");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/testimonials" className="p-1.5 rounded hover:bg-gray-100"><ArrowLeft className="w-4 h-4" /></Link>
        <div>
          <h2 className="text-lg font-semibold">New Testimonial</h2>
          <p className="text-gray-500 text-sm">Add a client testimonial</p>
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-6">
        <section className="bg-white p-6 rounded-xl border border-gray-200 space-y-4">
          <h3 className="font-semibold">Testimonial Content</h3>

          <div>
            <label className="block text-sm font-medium mb-1">Quote *</label>
            <textarea name="quote" required rows={5}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-sm"
              placeholder="What did the client say? (without quotation marks)" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Author Name *</label>
              <input name="authorName" required
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-sm"
                placeholder="e.g. Haima Prakash" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Initials *</label>
              <input name="authorInitials" required maxLength={3}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-sm"
                placeholder="e.g. HP" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Title / Position *</label>
            <input name="authorTitle" required
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-sm"
              placeholder="e.g. Sr. Manager, Chief Technology Office" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Company *</label>
            <input name="authorCompany" required
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-sm"
              placeholder="e.g. University of Sydney" />
          </div>

          <AdminImageField
            name="authorImageUrl"
            label="Author photo (optional)"
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
            Add Testimonial
          </button>
          <Link href="/testimonials" className="inline-flex items-center px-6 py-2 rounded-lg text-sm font-medium border border-gray-200 hover:bg-gray-50">Cancel</Link>
        </div>
      </form>
    </div>
  );
}
