"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Save } from "lucide-react";
import { useState } from "react";
import { buildCaseStudyPayloadFromFormData, emptyCaseStudyFormDefaults } from "@/lib/case-study-payload";
import { AdminImageField } from "@/components/AdminImageField";
import { adminFetch } from "@/lib/admin-api";

const inputClass =
  "w-full rounded-lg border border-gray-200 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black";
const labelClass = "mb-2 block text-sm font-medium";

function str(record: Record<string, unknown> | null | undefined, key: string): string {
  if (!record) return "";
  const v = record[key];
  return v == null ? "" : String(v);
}

function tagsJoin(record: Record<string, unknown> | null | undefined, key: string): string {
  if (!record) return "";
  const v = record[key];
  if (!Array.isArray(v)) return "";
  return v.map(String).join(", ");
}

export function CaseStudyForm({
  initialRecord,
}: {
  initialRecord?: Record<string, unknown> | null;
}) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const isEdit = Boolean(initialRecord?.id);
  const defaults = initialRecord ?? emptyCaseStudyFormDefaults();
  const formKey = isEdit ? String(initialRecord?.id) : "new-case-study";

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    const form = e.currentTarget;
    const payload = buildCaseStudyPayloadFromFormData(new FormData(form));

    try {
      const url = isEdit
        ? `/api/admin/case-studies/${encodeURIComponent(String(initialRecord?.id))}`
        : "/api/admin/case-studies";
      const res = await adminFetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        const msg =
          typeof err === "object" && err && "details" in err
            ? JSON.stringify((err as { details?: unknown }).details)
            : (err as { error?: string }).error;
        alert(msg || "Save failed");
        return;
      }
      router.push("/case-studies");
    } catch (err) {
      console.error(err);
      alert("Save failed");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form key={formKey} onSubmit={onSubmit} className="max-w-4xl space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">{isEdit ? "Edit case study" : "New case study"}</h2>
          <p className="text-sm text-gray-500">
            {isEdit ? (
              <>
                {str(initialRecord, "title")}{" "}
                <span className="font-mono text-gray-400">/{str(initialRecord, "slug")}</span>
              </>
            ) : (
              "All fields are required unless noted. Tag fields: comma-separated."
            )}
          </p>
        </div>
      </div>

      <section className="rounded-xl border border-gray-200 bg-white p-6">
        <h3 className="mb-4 font-semibold">Basic information</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className={labelClass}>Title</label>
            <input name="title" required defaultValue={str(defaults as Record<string, unknown>, "title")} className={inputClass} />
          </div>
          <div className="col-span-2">
            <label className={labelClass}>Subtitle</label>
            <textarea
              name="subtitle"
              required
              rows={2}
              defaultValue={str(defaults as Record<string, unknown>, "subtitle")}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Slug</label>
            <input name="slug" required defaultValue={str(defaults as Record<string, unknown>, "slug")} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Category</label>
            <select
              name="category"
              required
              defaultValue={str(defaults as Record<string, unknown>, "category") || "ServiceNow"}
              className={inputClass}
            >
              <option value="ServiceNow">ServiceNow</option>
              <option value="Salesforce">Salesforce</option>
              <option value="MuleSoft">MuleSoft</option>
              <option value="SharePoint">SharePoint</option>
              <option value="Staffing">Staffing</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Client name</label>
            <input
              name="clientName"
              required
              defaultValue={str(defaults as Record<string, unknown>, "clientName")}
              className={inputClass}
            />
          </div>
          <AdminImageField
            key={`featured-${formKey}`}
            name="featuredImage"
            label="Featured image"
            defaultValue={str(defaults as Record<string, unknown>, "featuredImage")}
            className={inputClass}
            labelClassName={labelClass}
          />
        </div>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-6">
        <h3 className="mb-4 font-semibold">Hero stats</h3>
        <div className="grid grid-cols-3 gap-4">
          {([1, 2, 3] as const).map((n) => (
            <div key={n} className="contents">
              <div>
                <label className={labelClass}>Stat {n} value</label>
                <input
                  name={`heroStat${n}Value`}
                  defaultValue={str(defaults as Record<string, unknown>, `heroStat${n}Value`)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Stat {n} label</label>
                <input
                  name={`heroStat${n}Label`}
                  defaultValue={str(defaults as Record<string, unknown>, `heroStat${n}Label`)}
                  className={inputClass}
                />
              </div>
              <div />
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-6">
        <h3 className="mb-4 font-semibold">Background</h3>
        <div className="space-y-4">
          <div>
            <label className={labelClass}>Title</label>
            <input name="backgroundTitle" defaultValue={str(defaults as Record<string, unknown>, "backgroundTitle")} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Content</label>
            <textarea
              name="backgroundContent"
              rows={6}
              defaultValue={str(defaults as Record<string, unknown>, "backgroundContent")}
              className={inputClass}
            />
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-6">
        <h3 className="mb-4 font-semibold">Challenge</h3>
        <div className="space-y-4">
          <div>
            <label className={labelClass}>Title</label>
            <input name="challengeTitle" defaultValue={str(defaults as Record<string, unknown>, "challengeTitle")} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Content</label>
            <textarea
              name="challengeContent"
              rows={4}
              defaultValue={str(defaults as Record<string, unknown>, "challengeContent")}
              className={inputClass}
            />
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-6">
        <h3 className="mb-4 font-semibold">Challenge stats</h3>
        <div className="grid grid-cols-3 gap-4">
          {([1, 2, 3] as const).map((n) => (
            <div key={n} className="contents">
              <div>
                <label className={labelClass}>Stat {n} value</label>
                <input
                  name={`challengeStat${n}Value`}
                  defaultValue={str(defaults as Record<string, unknown>, `challengeStat${n}Value`)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Stat {n} label</label>
                <input
                  name={`challengeStat${n}Label`}
                  defaultValue={str(defaults as Record<string, unknown>, `challengeStat${n}Label`)}
                  className={inputClass}
                />
              </div>
              <div />
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-6">
        <h3 className="mb-4 font-semibold">Problems (four blocks)</h3>
        <div className="space-y-6">
          {([1, 2, 3, 4] as const).map((n) => (
            <div key={n} className="grid grid-cols-1 gap-3 border-t border-gray-100 pt-4 first:border-t-0 first:pt-0">
              <label className={labelClass}>Problem {n} title</label>
              <input
                name={`problem${n}Title`}
                defaultValue={str(defaults as Record<string, unknown>, `problem${n}Title`)}
                className={inputClass}
              />
              <label className={labelClass}>Problem {n} content</label>
              <textarea
                name={`problem${n}Content`}
                rows={3}
                defaultValue={str(defaults as Record<string, unknown>, `problem${n}Content`)}
                className={inputClass}
              />
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-6">
        <h3 className="mb-4 font-semibold">Solution</h3>
        <div className="space-y-4">
          <div>
            <label className={labelClass}>Title</label>
            <input name="solutionTitle" defaultValue={str(defaults as Record<string, unknown>, "solutionTitle")} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Content</label>
            <textarea
              name="solutionContent"
              rows={4}
              defaultValue={str(defaults as Record<string, unknown>, "solutionContent")}
              className={inputClass}
            />
          </div>
        </div>
      </section>

      {([1, 2, 3, 4] as const).map((n) => (
        <section key={n} className="rounded-xl border border-gray-200 bg-white p-6">
          <h3 className="mb-4 font-semibold">Phase {n}{n === 4 ? " (optional)" : ""}</h3>
          <div className="space-y-4">
            <div>
              <label className={labelClass}>Title</label>
              <input name={`phase${n}Title`} defaultValue={str(defaults as Record<string, unknown>, `phase${n}Title`)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Duration</label>
              <input
                name={`phase${n}Duration`}
                defaultValue={str(defaults as Record<string, unknown>, `phase${n}Duration`)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Content</label>
              <textarea
                name={`phase${n}Content`}
                rows={4}
                defaultValue={str(defaults as Record<string, unknown>, `phase${n}Content`)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Tags (comma-separated)</label>
              <input
                name={`phase${n}Tags`}
                defaultValue={tagsJoin(defaults as Record<string, unknown>, `phase${n}Tags`)}
                className={inputClass}
              />
            </div>
          </div>
        </section>
      ))}

      <section className="rounded-xl border border-gray-200 bg-white p-6">
        <h3 className="mb-4 font-semibold">Technology stack</h3>
        <div className="space-y-4">
          <div>
            <label className={labelClass}>Section title</label>
            <input name="techStackTitle" defaultValue={str(defaults as Record<string, unknown>, "techStackTitle")} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Intro</label>
            <textarea
              name="techStackIntro"
              rows={3}
              defaultValue={str(defaults as Record<string, unknown>, "techStackIntro")}
              className={inputClass}
            />
          </div>
        </div>
        <div className="mt-6 space-y-6">
          {([1, 2, 3, 4, 5, 6] as const).map((n) => (
            <div key={n} className="grid grid-cols-1 gap-3 border-t border-gray-100 pt-4 sm:grid-cols-3">
              <div className="sm:col-span-3 text-sm font-medium text-gray-700">Technology {n}</div>
              <div>
                <label className={labelClass}>Name</label>
                <input name={`tech${n}Name`} defaultValue={str(defaults as Record<string, unknown>, `tech${n}Name`)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Icon</label>
                <input name={`tech${n}Icon`} defaultValue={str(defaults as Record<string, unknown>, `tech${n}Icon`)} className={inputClass} />
              </div>
              <div className="sm:col-span-3">
                <label className={labelClass}>Description</label>
                <textarea
                  name={`tech${n}Description`}
                  rows={2}
                  defaultValue={str(defaults as Record<string, unknown>, `tech${n}Description`)}
                  className={inputClass}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-6">
        <h3 className="mb-4 font-semibold">Testimonial</h3>
        <div className="space-y-4">
          <div>
            <label className={labelClass}>Quote</label>
            <textarea
              name="testimonialQuote"
              rows={4}
              defaultValue={str(defaults as Record<string, unknown>, "testimonialQuote")}
              className={inputClass}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Author name</label>
              <input
                name="testimonialAuthorName"
                defaultValue={str(defaults as Record<string, unknown>, "testimonialAuthorName")}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Author title</label>
              <input
                name="testimonialAuthorTitle"
                defaultValue={str(defaults as Record<string, unknown>, "testimonialAuthorTitle")}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Company</label>
              <input
                name="testimonialAuthorCompany"
                defaultValue={str(defaults as Record<string, unknown>, "testimonialAuthorCompany")}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Initials</label>
              <input
                name="testimonialAuthorInitials"
                defaultValue={str(defaults as Record<string, unknown>, "testimonialAuthorInitials")}
                className={inputClass}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-6">
        <h3 className="mb-4 font-semibold">Results</h3>
        <div className="space-y-4">
          <div>
            <label className={labelClass}>Title</label>
            <input name="resultsTitle" defaultValue={str(defaults as Record<string, unknown>, "resultsTitle")} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Content</label>
            <textarea
              name="resultsContent"
              rows={4}
              defaultValue={str(defaults as Record<string, unknown>, "resultsContent")}
              className={inputClass}
            />
          </div>
        </div>
        <div className="mt-6 grid grid-cols-3 gap-4">
          {([1, 2, 3] as const).map((n) => (
            <div key={n} className="contents">
              <div>
                <label className={labelClass}>Result stat {n} value</label>
                <input
                  name={`resultStat${n}Value`}
                  defaultValue={str(defaults as Record<string, unknown>, `resultStat${n}Value`)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Result stat {n} label</label>
                <input
                  name={`resultStat${n}Label`}
                  defaultValue={str(defaults as Record<string, unknown>, `resultStat${n}Label`)}
                  className={inputClass}
                />
              </div>
              <div />
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4 rounded-xl border border-gray-200 bg-white p-6">
        <div className="flex items-center gap-4">
          <input
            type="checkbox"
            name="published"
            id="published"
            defaultChecked={defaults.published !== false && String((defaults as Record<string, unknown>).published) !== "false"}
            className="h-4 w-4"
          />
          <label htmlFor="published" className="font-medium">
            Published
          </label>
        </div>
        <div className="flex items-center gap-4">
          <input
            type="checkbox"
            name="featured"
            id="featured"
            defaultChecked={Boolean((defaults as Record<string, unknown>).featured)}
            className="h-4 w-4"
          />
          <label htmlFor="featured" className="font-medium">
            Featured (homepage / large card)
          </label>
        </div>
      </section>

      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex items-center gap-2 rounded-lg bg-black px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-gray-800 disabled:opacity-50"
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {isEdit ? "Save changes" : "Create case study"}
        </button>
        <Link href="/case-studies" className="rounded-lg border border-gray-200 px-6 py-3 text-sm font-medium hover:bg-gray-50">
          Cancel
        </Link>
      </div>
    </form>
  );
}
