"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Edit, Trash2 } from "lucide-react";
import { adminFetch } from "@/lib/admin-api";

interface Testimonial {
  id: string;
  authorName: string;
  authorTitle: string;
  authorCompany: string;
  quote: string;
  order: number;
  published: boolean;
}

export default function TestimonialsPage() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => { fetchTestimonials(); }, []);

  async function fetchTestimonials() {
    try {
      const res = await adminFetch("/api/admin/testimonials/admin/all");
      const data = await res.json();
      setTestimonials(data.data || []);
    } catch (error) {
      console.error("Error fetching testimonials:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function deleteTestimonial(id: string) {
    if (!confirm("Delete this testimonial?")) return;
    try {
      const res = await adminFetch(`/api/admin/testimonials/${id}`, {
        method: "DELETE",
      });
      if (res.ok) setTestimonials(testimonials.filter((t) => t.id !== id));
    } catch (error) {
      console.error("Error deleting testimonial:", error);
    }
  }

  if (isLoading) return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-2 border-black border-t-transparent rounded-full" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold">Testimonials</h2>
          <p className="text-gray-500 text-sm">Manage client stories shown across the website</p>
        </div>
        <Link href="/testimonials/new" className="inline-flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors">
          <Plus className="w-4 h-4" />Add Testimonial
        </Link>
      </div>

      <div className="space-y-3">
        {testimonials.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 px-6 py-12 text-center text-gray-400">No testimonials yet.</div>
        ) : (
          testimonials.map((t) => (
            <div key={t.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-start gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-600 line-clamp-2 italic">&ldquo;{t.quote}&rdquo;</p>
                <p className="mt-2 text-sm font-semibold text-gray-900">{t.authorName}</p>
                <p className="text-xs text-gray-500">{t.authorTitle} · {t.authorCompany}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${t.published ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                  {t.published ? "Published" : "Draft"}
                </span>
                <Link href={`/testimonials/${t.id}`} className="p-1.5 rounded hover:bg-gray-100 text-gray-500 hover:text-black">
                  <Edit className="w-4 h-4" />
                </Link>
                <button onClick={() => deleteTestimonial(t.id)} className="p-1.5 rounded hover:bg-red-50 text-gray-500 hover:text-red-600">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
