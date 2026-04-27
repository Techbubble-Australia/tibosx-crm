"use client";

import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { adminFetch } from "@/lib/admin-api";

interface ContactSubmission {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  company?: string;
  interest?: string;
  country?: string;
  message: string;
  createdAt: string;
}

export default function ContactSubmissionsPage() {
  const [submissions, setSubmissions] = useState<ContactSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => { fetchSubmissions(); }, []);

  async function fetchSubmissions() {
    try {
      const res = await adminFetch("/api/admin/contact-submissions/admin/submissions");
      const data = await res.json();
      setSubmissions(data.data || []);
    } catch (error) {
      console.error("Error fetching submissions:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function deleteSubmission(id: string) {
    if (!confirm("Permanently delete this submission?")) return;
    try {
      const res = await adminFetch(`/api/admin/contact-submissions/admin/submissions/${id}`, {
        method: "DELETE",
      });
      if (res.ok) setSubmissions((s) => s.filter((x) => x.id !== id));
    } catch (error) {
      console.error("Error deleting submission:", error);
    }
  }

  if (isLoading) return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-2 border-black border-t-transparent rounded-full" /></div>;

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-lg font-semibold">Contact Submissions</h2>
        <p className="text-gray-500 text-sm">{submissions.length} submission{submissions.length !== 1 ? "s" : ""} received</p>
      </div>

      <div className="space-y-3">
        {submissions.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 px-6 py-12 text-center text-gray-400">No contact submissions yet.</div>
        ) : (
          submissions.map((sub) => (
            <div key={sub.id} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900">{sub.firstName} {sub.lastName}</p>
                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
                    <a href={`mailto:${sub.email}`} className="hover:text-black hover:underline">{sub.email}</a>
                    {sub.phone && <span>{sub.phone}</span>}
                    {sub.company && <span>{sub.company}</span>}
                    {sub.country && <span>{sub.country}</span>}
                    {sub.interest && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                        {sub.interest}
                      </span>
                    )}
                  </div>
                  <p className="mt-3 text-sm text-gray-700 border-t border-gray-100 pt-3">{sub.message}</p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2">
                  <span className="text-xs text-gray-400">
                    {new Date(sub.createdAt).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })}
                  </span>
                  <button
                    type="button"
                    onClick={() => void deleteSubmission(sub.id)}
                    className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                    aria-label="Delete submission"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
