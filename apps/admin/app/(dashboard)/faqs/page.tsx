"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Edit, Trash2 } from "lucide-react";
import { adminFetch } from "@/lib/admin-api";

interface FaqItem {
  id: string;
  question: string;
  category: string;
  order: number;
  published: boolean;
}

export default function FaqsPage() {
  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => { fetchFaqs(); }, []);

  async function fetchFaqs() {
    try {
      const res = await adminFetch("/api/admin/faqs/admin/all");
      const data = await res.json();
      setFaqs(data.data || []);
    } catch (error) {
      console.error("Error fetching FAQs:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function deleteFaq(id: string) {
    if (!confirm("Delete this FAQ?")) return;
    try {
      const res = await adminFetch(`/api/admin/faqs/${id}`, {
        method: "DELETE",
      });
      if (res.ok) setFaqs(faqs.filter((f) => f.id !== id));
    } catch (error) {
      console.error("Error deleting FAQ:", error);
    }
  }

  if (isLoading) return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-2 border-black border-t-transparent rounded-full" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold">FAQs</h2>
          <p className="text-gray-500 text-sm">Manage frequently asked questions shown on the Pricing page</p>
        </div>
        <Link href="/faqs/new" className="inline-flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors">
          <Plus className="w-4 h-4" />Add FAQ
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Question</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Category</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Order</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {faqs.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">No FAQs yet.</td></tr>
            ) : (
              faqs.map((faq) => (
                <tr key={faq.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 max-w-[420px] truncate font-medium">{faq.question}</td>
                  <td className="px-4 py-3 text-gray-600 capitalize">{faq.category}</td>
                  <td className="px-4 py-3 text-gray-600">{faq.order}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${faq.published ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {faq.published ? "Published" : "Draft"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex items-center gap-2">
                      <Link href={`/faqs/${faq.id}`} className="p-1.5 rounded hover:bg-gray-100 text-gray-500 hover:text-black">
                        <Edit className="w-4 h-4" />
                      </Link>
                      <button onClick={() => deleteFaq(faq.id)} className="p-1.5 rounded hover:bg-red-50 text-gray-500 hover:text-red-600">
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
