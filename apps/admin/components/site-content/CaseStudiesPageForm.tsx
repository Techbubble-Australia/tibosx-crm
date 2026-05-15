"use client";

import { caseStudiesPagePayload } from "@site-content/defaults";
import { inputClass, labelClass, sectionClass } from "./form-styles";

export type CaseStudiesPagePayload = typeof caseStudiesPagePayload;

const ICON_OPTIONS = ["Zap", "Workflow", "Share2", "FileStack", "Braces"] as const;

export function CaseStudiesPageForm({
  value,
  onChange,
}: {
  value: CaseStudiesPagePayload;
  onChange: (next: CaseStudiesPagePayload) => void;
}) {
  return (
    <div className="space-y-8">
      <section className={sectionClass}>
        <h3 className="mb-4 font-semibold">Hero</h3>
        <div className="grid gap-3">
          <div>
            <label className={labelClass}>Title</label>
            <input className={inputClass} value={value.hero.title} onChange={(e) => onChange({ ...value, hero: { ...value.hero, title: e.target.value } })} />
          </div>
          <div>
            <label className={labelClass}>Subtitle</label>
            <textarea className={inputClass} rows={3} value={value.hero.subtitle} onChange={(e) => onChange({ ...value, hero: { ...value.hero, subtitle: e.target.value } })} />
          </div>
        </div>
      </section>

      <section className={sectionClass}>
        <h3 className="mb-4 font-semibold">Stats strip</h3>
        <label className={labelClass}>Blurb</label>
        <textarea className={inputClass} rows={3} value={value.statsStrip.blurb} onChange={(e) => onChange({ ...value, statsStrip: { ...value.statsStrip, blurb: e.target.value } })} />
        <h4 className="mb-2 mt-4 text-sm font-semibold">Stats</h4>
        <div className="space-y-2">
          {value.statsStrip.stats.map((st, i) => (
            <div key={`st-${i}`} className="grid gap-2 sm:grid-cols-2">
              <input
                className={inputClass}
                placeholder="Value"
                value={st.value}
                onChange={(e) => {
                  const next = [...value.statsStrip.stats];
                  next[i] = { ...st, value: e.target.value };
                  onChange({ ...value, statsStrip: { ...value.statsStrip, stats: next } });
                }}
              />
              <input
                className={inputClass}
                placeholder="Label"
                value={st.label}
                onChange={(e) => {
                  const next = [...value.statsStrip.stats];
                  next[i] = { ...st, label: e.target.value };
                  onChange({ ...value, statsStrip: { ...value.statsStrip, stats: next } });
                }}
              />
            </div>
          ))}
        </div>
      </section>

      <section className={sectionClass}>
        <h3 className="mb-4 font-semibold">Practice section (filters copy)</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Pill</label>
            <input
              className={inputClass}
              value={value.practiceSection.pill}
              onChange={(e) => onChange({ ...value, practiceSection: { ...value.practiceSection, pill: e.target.value } })}
            />
          </div>
          <div>
            <label className={labelClass}>Title line 2 (optional)</label>
            <input
              className={inputClass}
              value={value.practiceSection.titleLine2}
              onChange={(e) => onChange({ ...value, practiceSection: { ...value.practiceSection, titleLine2: e.target.value } })}
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>Title line 1</label>
            <input
              className={inputClass}
              value={value.practiceSection.titleLine1}
              onChange={(e) => onChange({ ...value, practiceSection: { ...value.practiceSection, titleLine1: e.target.value } })}
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>Subtitle</label>
            <textarea
              className={inputClass}
              rows={2}
              value={value.practiceSection.subtitle}
              onChange={(e) => onChange({ ...value, practiceSection: { ...value.practiceSection, subtitle: e.target.value } })}
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>Categories (comma-separated)</label>
            <input
              className={inputClass}
              value={value.practiceSection.categories.join(", ")}
              onChange={(e) =>
                onChange({
                  ...value,
                  practiceSection: {
                    ...value.practiceSection,
                    categories: e.target.value
                      .split(",")
                      .map((s) => s.trim())
                      .filter(Boolean),
                  },
                })
              }
            />
          </div>
        </div>
      </section>

      <section className={sectionClass}>
        <h3 className="mb-4 font-semibold">Empty state (no API case studies)</h3>
        <div className="grid gap-3">
          <input className={inputClass} value={value.emptyState.title} onChange={(e) => onChange({ ...value, emptyState: { ...value.emptyState, title: e.target.value } })} />
          <textarea className={inputClass} rows={3} value={value.emptyState.body} onChange={(e) => onChange({ ...value, emptyState: { ...value.emptyState, body: e.target.value } })} />
          <div className="grid gap-2 sm:grid-cols-2">
            <input
              className={inputClass}
              placeholder="CTA label"
              value={value.emptyState.ctaLabel}
              onChange={(e) => onChange({ ...value, emptyState: { ...value.emptyState, ctaLabel: e.target.value } })}
            />
            <input
              className={inputClass}
              placeholder="CTA href"
              value={value.emptyState.ctaHref}
              onChange={(e) => onChange({ ...value, emptyState: { ...value.emptyState, ctaHref: e.target.value } })}
            />
          </div>
        </div>
      </section>

      <section className={sectionClass}>
        <h3 className="mb-4 font-semibold">Expertise section</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Pill</label>
            <input
              className={inputClass}
              value={value.expertiseSection.pill}
              onChange={(e) => onChange({ ...value, expertiseSection: { ...value.expertiseSection, pill: e.target.value } })}
            />
          </div>
          <div>
            <label className={labelClass}>Title line 2</label>
            <input
              className={inputClass}
              value={value.expertiseSection.titleLine2}
              onChange={(e) => onChange({ ...value, expertiseSection: { ...value.expertiseSection, titleLine2: e.target.value } })}
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>Title line 1</label>
            <input
              className={inputClass}
              value={value.expertiseSection.titleLine1}
              onChange={(e) => onChange({ ...value, expertiseSection: { ...value.expertiseSection, titleLine1: e.target.value } })}
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>Subtitle</label>
            <textarea
              className={inputClass}
              rows={2}
              value={value.expertiseSection.subtitle}
              onChange={(e) => onChange({ ...value, expertiseSection: { ...value.expertiseSection, subtitle: e.target.value } })}
            />
          </div>
        </div>

        <h4 className="mb-2 mt-4 text-sm font-semibold">Tiles</h4>
        <div className="space-y-3">
          {value.expertiseSection.tiles.map((t, i) => (
            <div key={`tl-${i}`} className="grid gap-2 rounded-lg border border-gray-100 p-3 sm:grid-cols-2">
              <div>
                <label className={labelClass}>Icon (Lucide name)</label>
                <select
                  className={inputClass}
                  value={t.iconKey}
                  onChange={(e) => {
                    const next = [...value.expertiseSection.tiles];
                    next[i] = { ...t, iconKey: e.target.value as (typeof t)["iconKey"] };
                    onChange({ ...value, expertiseSection: { ...value.expertiseSection, tiles: next } });
                  }}
                >
                  {ICON_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Explore label</label>
                <input
                  className={inputClass}
                  value={t.exploreLabel}
                  onChange={(e) => {
                    const next = [...value.expertiseSection.tiles];
                    next[i] = { ...t, exploreLabel: e.target.value };
                    onChange({ ...value, expertiseSection: { ...value.expertiseSection, tiles: next } });
                  }}
                />
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass}>Title</label>
                <input
                  className={inputClass}
                  value={t.title}
                  onChange={(e) => {
                    const next = [...value.expertiseSection.tiles];
                    next[i] = { ...t, title: e.target.value };
                    onChange({ ...value, expertiseSection: { ...value.expertiseSection, tiles: next } });
                  }}
                />
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass}>Description</label>
                <textarea
                  className={inputClass}
                  rows={2}
                  value={t.description}
                  onChange={(e) => {
                    const next = [...value.expertiseSection.tiles];
                    next[i] = { ...t, description: e.target.value };
                    onChange({ ...value, expertiseSection: { ...value.expertiseSection, tiles: next } });
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        <h4 className="mb-2 mt-4 text-sm font-semibold">Dark CTA tile</h4>
        <div className="grid gap-2">
          <input
            className={inputClass}
            value={value.expertiseSection.ctaTile.title}
            onChange={(e) =>
              onChange({
                ...value,
                expertiseSection: { ...value.expertiseSection, ctaTile: { ...value.expertiseSection.ctaTile, title: e.target.value } },
              })
            }
          />
          <textarea
            className={inputClass}
            rows={2}
            value={value.expertiseSection.ctaTile.body}
            onChange={(e) =>
              onChange({
                ...value,
                expertiseSection: { ...value.expertiseSection, ctaTile: { ...value.expertiseSection.ctaTile, body: e.target.value } },
              })
            }
          />
          <div className="grid gap-2 sm:grid-cols-2">
            <input
              className={inputClass}
              placeholder="Button label"
              value={value.expertiseSection.ctaTile.buttonLabel}
              onChange={(e) =>
                onChange({
                  ...value,
                  expertiseSection: {
                    ...value.expertiseSection,
                    ctaTile: { ...value.expertiseSection.ctaTile, buttonLabel: e.target.value },
                  },
                })
              }
            />
            <input
              className={inputClass}
              placeholder="Button href"
              value={value.expertiseSection.ctaTile.buttonHref}
              onChange={(e) =>
                onChange({
                  ...value,
                  expertiseSection: {
                    ...value.expertiseSection,
                    ctaTile: { ...value.expertiseSection.ctaTile, buttonHref: e.target.value },
                  },
                })
              }
            />
          </div>
        </div>
      </section>

      <section className={sectionClass}>
        <h3 className="mb-4 font-semibold">Bottom CTA</h3>
        <div className="grid gap-3">
          <input className={inputClass} value={value.bottomCta.title} onChange={(e) => onChange({ ...value, bottomCta: { ...value.bottomCta, title: e.target.value } })} />
          <textarea className={inputClass} rows={2} value={value.bottomCta.description} onChange={(e) => onChange({ ...value, bottomCta: { ...value.bottomCta, description: e.target.value } })} />
          <div className="grid gap-2 sm:grid-cols-2">
            <input
              className={inputClass}
              placeholder="Primary label"
              value={value.bottomCta.primaryLabel}
              onChange={(e) => onChange({ ...value, bottomCta: { ...value.bottomCta, primaryLabel: e.target.value } })}
            />
            <input
              className={inputClass}
              placeholder="Primary href"
              value={value.bottomCta.primaryHref}
              onChange={(e) => onChange({ ...value, bottomCta: { ...value.bottomCta, primaryHref: e.target.value } })}
            />
            <input
              className={inputClass}
              placeholder="Secondary label"
              value={value.bottomCta.secondaryLabel}
              onChange={(e) => onChange({ ...value, bottomCta: { ...value.bottomCta, secondaryLabel: e.target.value } })}
            />
            <input
              className={inputClass}
              placeholder="Secondary href"
              value={value.bottomCta.secondaryHref}
              onChange={(e) => onChange({ ...value, bottomCta: { ...value.bottomCta, secondaryHref: e.target.value } })}
            />
          </div>
        </div>
      </section>
    </div>
  );
}
