"use client";
import { appAlert, appConfirm } from "@/lib/app-alert";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { AdminImageField } from "@/components/AdminImageField";
import { adminFetch } from "@/lib/admin-api";

export default function EditTestimonialPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [t, setT] = useState<Record<string, unknown> | null>(null);
  const [authorImageUrl, setAuthorImageUrl] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const res = await adminFetch("/api/admin/testimonials/all");
        const data = await res.json();
        const found = (data.data || []).find((item: { id: string }) => item.id === id);
        if (found) {
          setT(found);
          setAuthorImageUrl(String((found.authorImageUrl as string) ?? "").trim());
        } else {
          setT(null);
          setAuthorImageUrl("");
        }
      } catch (error) {
        console.error("Error loading testimonial:", error);
      } finally {
        setIsFetching(false);
      }
    }
    load();
  }, [id]);

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
      authorImageUrl: authorImageUrl.trim(),
      order: parseInt(formData.get("order") as string) || 0,
      published: formData.get("published") === "on",
    };

    try {
      const res = await adminFetch(`/api/admin/testimonials/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to update testimonial");
      router.push("/testimonials");
    } catch (error) {
      console.error(error);
      appAlert("Failed to update testimonial");
    } finally {
      setIsLoading(false);
    }
  }

  if (isFetching) return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-2 border-black border-t-transparent rounded-full" /></div>;
  if (!t) return <div className="text-gray-500">Testimonial not found.</div>;

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/testimonials" className="p-1.5 rounded hover:bg-gray-100"><ArrowLeft className="w-4 h-4" /></Link>
        <div>
          <h2 className="text-lg font-semibold">Edit Testimonial</h2>
          <p className="text-gray-500 text-sm">{t.authorName as string}</p>
        </div>
      </div>

      <form key={t.id as string} onSubmit={onSubmit} className="space-y-6">
        <section className="space-y-4 rounded-xl border border-gray-200 bg-white p-6">
          <h3 className="font-semibold">Testimonial Content</h3>
          <div>
            <label className="block text-sm font-medium mb-1">Quote <span className="text-red-500">*</span></label>
            <textarea name="quote" required rows={5} defaultValue={t.quote as string}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Author Name <span className="text-red-500">*</span></label>
              <input name="authorName" required defaultValue={t.authorName as string}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Initials <span className="text-red-500">*</span></label>
              <input name="authorInitials" required maxLength={3} defaultValue={t.authorInitials as string}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Title / Position <span className="text-red-500">*</span></label>
            <input name="authorTitle" required defaultValue={t.authorTitle as string}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Company <span className="text-red-500">*</span></label>
            <input name="authorCompany" required defaultValue={t.authorCompany as string}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-sm" />
          </div>
          <AdminImageField
            name="authorImageUrl"
            label="Author photo (optional)"
            value={authorImageUrl}
            onValueChange={setAuthorImageUrl}
            className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
            labelClassName="mb-1 block text-sm font-medium"
          />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Display Order</label>
              <input name="order" type="number" defaultValue={t.order as number}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-sm" />
            </div>
            <div className="flex items-center gap-3 pt-6">
              <input name="published" type="checkbox" id="published" defaultChecked={t.published as boolean} className="w-4 h-4 rounded" />
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
          <Link href="/testimonials" className="inline-flex items-center px-6 py-2 rounded-lg text-sm font-medium border border-gray-200 hover:bg-gray-50">Cancel</Link>
        </div>
      </form>
    </div>
  );
}
