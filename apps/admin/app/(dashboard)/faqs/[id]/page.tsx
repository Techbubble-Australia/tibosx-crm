"use client";
import { appAlert, appConfirm } from "@/lib/app-alert";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { adminFetch } from "@/lib/admin-api";

export default function EditFaqPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [faq, setFaq] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await adminFetch("/api/admin/faqs/admin/all");
        const data = await res.json();
        const found = (data.data || []).find((f: { id: string }) => f.id === id);
        setFaq(found || null);
      } catch (error) {
        console.error("Error loading FAQ:", error);
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
      question: formData.get("question"),
      answer: formData.get("answer"),
      category: formData.get("category"),
      order: parseInt(formData.get("order") as string) || 0,
      published: formData.get("published") === "on",
    };

    try {
      const res = await adminFetch(`/api/admin/faqs/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to update FAQ");
      router.push("/faqs");
    } catch (error) {
      console.error(error);
      appAlert("Failed to update FAQ");
    } finally {
      setIsLoading(false);
    }
  }

  if (isFetching) return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-2 border-black border-t-transparent rounded-full" /></div>;
  if (!faq) return <div className="text-gray-500">FAQ not found.</div>;

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/faqs" className="p-1.5 rounded hover:bg-gray-100"><ArrowLeft className="w-4 h-4" /></Link>
        <div>
          <h2 className="text-lg font-semibold">Edit FAQ</h2>
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-6">
        <section className="bg-white p-6 rounded-xl border border-gray-200 space-y-4">
          <h3 className="font-semibold">FAQ Details</h3>
          <div>
            <label className="block text-sm font-medium mb-1">Question <span className="text-red-500">*</span></label>
            <input name="question" required defaultValue={faq.question as string}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Answer <span className="text-red-500">*</span></label>
            <textarea name="answer" required rows={5} defaultValue={faq.answer as string}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Category <span className="text-red-500">*</span></label>
            <select name="category" required defaultValue={faq.category as string}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-sm bg-white">
              <option value="pricing">Pricing</option>
              <option value="general">General</option>
              <option value="technical">Technical</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Display Order</label>
              <input name="order" type="number" defaultValue={faq.order as number}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-sm" />
            </div>
            <div className="flex items-center gap-3 pt-6">
              <input name="published" type="checkbox" id="published" defaultChecked={faq.published as boolean} className="w-4 h-4 rounded" />
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
          <Link href="/faqs" className="inline-flex items-center px-6 py-2 rounded-lg text-sm font-medium border border-gray-200 hover:bg-gray-50">Cancel</Link>
        </div>
      </form>
    </div>
  );
}
