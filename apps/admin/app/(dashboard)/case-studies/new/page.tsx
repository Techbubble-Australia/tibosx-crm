"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";

// Simplified form for demo - in production you'd use react-hook-form + zod
export default function NewCaseStudyPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    // Convert arrays
    const payload = {
      ...data,
      phase1Tags: (data.phase1Tags as string).split(",").map((t) => t.trim()),
      phase2Tags: (data.phase2Tags as string).split(",").map((t) => t.trim()),
      phase3Tags: (data.phase3Tags as string).split(",").map((t) => t.trim()),
      published: data.published === "on",
    };

    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/admin/case-studies", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to create");

      router.push("/case-studies");
    } catch (error) {
      console.error("Error creating case study:", error);
      alert("Failed to create case study");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold">New Case Study</h2>
          <p className="text-gray-500 text-sm">Create a new case study</p>
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-8">
        {/* Basic Info */}
        <section className="bg-white p-6 rounded-xl border border-gray-200">
          <h3 className="font-semibold mb-4">Basic Information</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-2">Title</label>
              <input
                name="title"
                required
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                placeholder="e.g., University of Sydney — Rapid IT Talent Deployment"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-2">Subtitle</label>
              <textarea
                name="subtitle"
                required
                rows={2}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                placeholder="Brief description of the case study"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Slug</label>
              <input
                name="slug"
                required
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                placeholder="university-of-sydney-case-study"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Category</label>
              <select
                name="category"
                required
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              >
                <option value="ServiceNow">ServiceNow</option>
                <option value="Salesforce">Salesforce</option>
                <option value="MuleSoft">MuleSoft</option>
                <option value="SharePoint">SharePoint</option>
                <option value="Staffing">Staffing</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Client Name</label>
              <input
                name="clientName"
                required
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                placeholder="e.g., University of Sydney"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Featured Image URL</label>
              <input
                name="featuredImage"
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                placeholder="/images/case-studies/image.jpg"
              />
            </div>
          </div>
        </section>

        {/* Hero Stats */}
        <section className="bg-white p-6 rounded-xl border border-gray-200">
          <h3 className="font-semibold mb-4">Hero Stats</h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Stat 1 Value</label>
              <input
                name="heroStat1Value"
                defaultValue="SERVICENOW"
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Stat 1 Label</label>
              <input
                name="heroStat1Label"
                defaultValue="CATEGORY"
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>
            <div></div>
            <div>
              <label className="block text-sm font-medium mb-2">Stat 2 Value</label>
              <input
                name="heroStat2Value"
                defaultValue="40%"
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Stat 2 Label</label>
              <input
                name="heroStat2Label"
                defaultValue="EFFICIENCY GAINS"
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>
            <div></div>
            <div>
              <label className="block text-sm font-medium mb-2">Stat 3 Value</label>
              <input
                name="heroStat3Value"
                defaultValue="3"
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Stat 3 Label</label>
              <input
                name="heroStat3Label"
                defaultValue="DOMAINS DELIVERED"
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>
          </div>
        </section>

        {/* Background Section */}
        <section className="bg-white p-6 rounded-xl border border-gray-200">
          <h3 className="font-semibold mb-4">Background Section</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Title</label>
              <input
                name="backgroundTitle"
                required
                defaultValue="A Growing Organisation Held Back by Legacy Systems"
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Content</label>
              <textarea
                name="backgroundContent"
                required
                rows={6}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                placeholder="Background content..."
              />
            </div>
          </div>
        </section>

        {/* Challenge Section */}
        <section className="bg-white p-6 rounded-xl border border-gray-200">
          <h3 className="font-semibold mb-4">Challenge Section</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Title</label>
              <input
                name="challengeTitle"
                required
                defaultValue="Four Interconnected Problems to Solve Simultaneously"
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Content</label>
              <textarea
                name="challengeContent"
                required
                rows={4}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                placeholder="Challenge content..."
              />
            </div>
          </div>
        </section>

        {/* Solution Section */}
        <section className="bg-white p-6 rounded-xl border border-gray-200">
          <h3 className="font-semibold mb-4">Solution Section</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Title</label>
              <input
                name="solutionTitle"
                required
                defaultValue="A Four-Phase Rebuild Built Around People First"
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Content</label>
              <textarea
                name="solutionContent"
                required
                rows={4}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                placeholder="Solution content..."
              />
            </div>
          </div>
        </section>

        {/* Testimonial */}
        <section className="bg-white p-6 rounded-xl border border-gray-200">
          <h3 className="font-semibold mb-4">Testimonial</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Quote</label>
              <textarea
                name="testimonialQuote"
                required
                rows={4}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                placeholder="Client testimonial quote..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Author Name</label>
                <input
                  name="testimonialAuthorName"
                  required
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Author Title</label>
                <input
                  name="testimonialAuthorTitle"
                  required
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Publish Options */}
        <section className="bg-white p-6 rounded-xl border border-gray-200">
          <div className="flex items-center gap-4">
            <input
              type="checkbox"
              name="published"
              id="published"
              defaultChecked
              className="w-4 h-4"
            />
            <label htmlFor="published" className="font-medium">
              Publish immediately
            </label>
          </div>
        </section>

        {/* Actions */}
        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex items-center gap-2 bg-black text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Case Study
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => router.push("/case-studies")}
            className="px-6 py-3 border border-gray-200 rounded-lg font-medium hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
