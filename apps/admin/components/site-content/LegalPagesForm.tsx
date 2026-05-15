"use client";

import { useState } from "react";
import { legalPagesPayload } from "@site-content/defaults";
import { inputClass, labelClass, sectionClass } from "./form-styles";

export type LegalPagesPayload = typeof legalPagesPayload;

type DocKey = keyof LegalPagesPayload;

function SectionEditor({
  heading,
  paragraphs,
  onChange,
}: {
  heading: string;
  paragraphs: string[];
  onChange: (next: { heading: string; paragraphs: string[] }) => void;
}) {
  return (
    <div className="rounded-lg border border-gray-100 p-3">
      <label className={labelClass}>Section heading</label>
      <input className={inputClass} value={heading} onChange={(e) => onChange({ heading: e.target.value, paragraphs })} />
      <label className={`${labelClass} mt-2`}>Paragraphs (one per line)</label>
      <textarea
        className={inputClass}
        rows={4}
        value={paragraphs.join("\n")}
        onChange={(e) => onChange({ heading, paragraphs: e.target.value.split("\n").map((s) => s.trimEnd()) })}
      />
    </div>
  );
}

export function LegalPagesForm({
  value,
  onChange,
}: {
  value: LegalPagesPayload;
  onChange: (next: LegalPagesPayload) => void;
}) {
  const [tab, setTab] = useState<DocKey>("privacy");

  const doc = value[tab];

  function patchDoc(patch: Partial<LegalPagesPayload[DocKey]>) {
    onChange({ ...value, [tab]: { ...value[tab], ...patch } });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {(["privacy", "terms", "cookies"] as const).map((k) => (
          <button
            key={k}
            type="button"
            className={`rounded-full px-4 py-1.5 text-sm font-medium ${tab === k ? "bg-black text-white" : "bg-gray-100 text-gray-800"}`}
            onClick={() => setTab(k)}
          >
            {k}
          </button>
        ))}
      </div>

      <section className={sectionClass}>
        <h3 className="mb-4 font-semibold capitalize">{tab}</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Shell title</label>
            <input className={inputClass} value={doc.shellTitle} onChange={(e) => patchDoc({ shellTitle: e.target.value })} />
          </div>
          <div>
            <label className={labelClass}>Last updated</label>
            <input className={inputClass} value={doc.lastUpdated} onChange={(e) => patchDoc({ lastUpdated: e.target.value })} />
          </div>
        </div>

        {tab === "cookies" && "privacyPolicyLink" in doc ? (
          <>
            <label className={`${labelClass} mt-4`}>Intro (before link)</label>
            <textarea className={inputClass} rows={2} value={doc.intro} onChange={(e) => patchDoc({ intro: e.target.value })} />
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div>
                <label className={labelClass}>Privacy link label</label>
                <input
                  className={inputClass}
                  value={doc.privacyPolicyLink.label}
                  onChange={(e) =>
                    patchDoc({
                      privacyPolicyLink: { ...doc.privacyPolicyLink, label: e.target.value },
                    })
                  }
                />
              </div>
              <div>
                <label className={labelClass}>Privacy link href</label>
                <input
                  className={inputClass}
                  value={doc.privacyPolicyLink.href}
                  onChange={(e) =>
                    patchDoc({
                      privacyPolicyLink: { ...doc.privacyPolicyLink, href: e.target.value },
                    })
                  }
                />
              </div>
            </div>
            <label className={`${labelClass} mt-2`}>Text after link</label>
            <input
              className={inputClass}
              value={doc.introAfterLink ?? ""}
              onChange={(e) => patchDoc({ introAfterLink: e.target.value })}
            />
          </>
        ) : (
          <>
            <label className={`${labelClass} mt-4`}>Intro</label>
            <textarea className={inputClass} rows={4} value={doc.intro} onChange={(e) => patchDoc({ intro: e.target.value })} />
          </>
        )}

        <h4 className="mb-2 mt-6 text-sm font-semibold">Sections</h4>
        <div className="space-y-4">
          {doc.sections.map((sec, i) => (
            <SectionEditor
              key={`${tab}-${i}`}
              heading={sec.heading}
              paragraphs={sec.paragraphs}
              onChange={(next) => {
                const nextSections = [...doc.sections];
                nextSections[i] = next;
                patchDoc({ sections: nextSections });
              }}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
