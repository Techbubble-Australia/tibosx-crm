"use client";

import { inputClass, labelClass, sectionClass } from "./form-styles";

type Highlight = { title: string; description: string; bodyWidth: string };
type ServiceModel = {
  name: string;
  title: string;
  description: string;
  price: string;
  priceNote: string;
  features: string[];
  cta: string;
  emphasis: string;
  featuredBadge?: string;
};
type ProcessStep = { icon: string; title: string; description: string };

export type ServicesPagePayload = {
  hero: { title: string; subtitle: string };
  highlights: Highlight[];
  engagementSection: { eyebrow: string; title: string; subtitle: string };
  serviceModels: ServiceModel[];
  processSection: { eyebrow: string; title: string; subtitle: string };
  processSteps: ProcessStep[];
  cta: { title: string; description: string; primaryLabel: string; primaryHref: string; secondaryLabel: string; secondaryHref: string };
};

function linesToFeatures(s: string): string[] {
  return s.split("\n").map((l) => l.trim()).filter(Boolean);
}

export function ServicesPageForm({
  value,
  onChange,
}: {
  value: ServicesPagePayload;
  onChange: (next: ServicesPagePayload) => void;
}) {
  const setHero = (patch: Partial<ServicesPagePayload["hero"]>) => onChange({ ...value, hero: { ...value.hero, ...patch } });
  const setEng = (patch: Partial<ServicesPagePayload["engagementSection"]>) =>
    onChange({ ...value, engagementSection: { ...value.engagementSection, ...patch } });
  const setProcSec = (patch: Partial<ServicesPagePayload["processSection"]>) =>
    onChange({ ...value, processSection: { ...value.processSection, ...patch } });
  const setCta = (patch: Partial<ServicesPagePayload["cta"]>) => onChange({ ...value, cta: { ...value.cta, ...patch } });

  const setHighlight = (i: number, patch: Partial<Highlight>) => {
    const highlights = value.highlights.map((h, j) => (j === i ? { ...h, ...patch } : h));
    onChange({ ...value, highlights });
  };

  const setModel = (i: number, patch: Partial<ServiceModel>) => {
    const serviceModels = value.serviceModels.map((m, j) => (j === i ? { ...m, ...patch } : m));
    onChange({ ...value, serviceModels });
  };

  const setStep = (i: number, patch: Partial<ProcessStep>) => {
    const processSteps = value.processSteps.map((s, j) => (j === i ? { ...s, ...patch } : s));
    onChange({ ...value, processSteps });
  };

  return (
    <div className="space-y-6">
      <section className={sectionClass}>
        <h3 className="mb-4 font-semibold">Hero</h3>
        <div className="space-y-3">
          <div>
            <label className={labelClass}>Title</label>
            <input className={inputClass} value={value.hero.title} onChange={(e) => setHero({ title: e.target.value })} />
          </div>
          <div>
            <label className={labelClass}>Subtitle</label>
            <textarea className={inputClass} rows={4} value={value.hero.subtitle} onChange={(e) => setHero({ subtitle: e.target.value })} />
          </div>
        </div>
      </section>

      <section className={sectionClass}>
        <h3 className="mb-4 font-semibold">Highlights (4 cards)</h3>
        <div className="space-y-4">
          {value.highlights.map((h, i) => (
            <div key={i} className="rounded-lg border border-gray-100 p-3">
              <p className="mb-2 text-sm font-medium text-gray-600">Highlight {i + 1}</p>
              <div className="space-y-2">
                <input className={inputClass} placeholder="Title" value={h.title} onChange={(e) => setHighlight(i, { title: e.target.value })} />
                <textarea
                  className={inputClass}
                  rows={2}
                  placeholder="Description"
                  value={h.description}
                  onChange={(e) => setHighlight(i, { description: e.target.value })}
                />
                <input
                  className={inputClass}
                  placeholder="Body width (Tailwind class)"
                  value={h.bodyWidth}
                  onChange={(e) => setHighlight(i, { bodyWidth: e.target.value })}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className={sectionClass}>
        <h3 className="mb-4 font-semibold">Engagement section header</h3>
        <div className="space-y-3">
          <input className={inputClass} placeholder="Eyebrow" value={value.engagementSection.eyebrow} onChange={(e) => setEng({ eyebrow: e.target.value })} />
          <input className={inputClass} placeholder="Title" value={value.engagementSection.title} onChange={(e) => setEng({ title: e.target.value })} />
          <textarea className={inputClass} rows={3} placeholder="Subtitle" value={value.engagementSection.subtitle} onChange={(e) => setEng({ subtitle: e.target.value })} />
        </div>
      </section>

      <section className={sectionClass}>
        <h3 className="mb-4 font-semibold">Service model cards (3)</h3>
        <div className="space-y-6">
          {value.serviceModels.map((m, i) => (
            <div key={i} className="space-y-3 rounded-lg border border-dashed border-gray-200 p-4">
              <p className="text-sm font-semibold">Model {i + 1}</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <input className={inputClass} placeholder="Name (e.g. STARTER)" value={m.name} onChange={(e) => setModel(i, { name: e.target.value })} />
                <input className={inputClass} placeholder="Title" value={m.title} onChange={(e) => setModel(i, { title: e.target.value })} />
              </div>
              <textarea className={inputClass} rows={3} placeholder="Description" value={m.description} onChange={(e) => setModel(i, { description: e.target.value })} />
              <div className="grid gap-3 sm:grid-cols-3">
                <input className={inputClass} placeholder="Price" value={m.price} onChange={(e) => setModel(i, { price: e.target.value })} />
                <input className={inputClass} placeholder="Price note" value={m.priceNote} onChange={(e) => setModel(i, { priceNote: e.target.value })} />
                <input className={inputClass} placeholder="CTA label" value={m.cta} onChange={(e) => setModel(i, { cta: e.target.value })} />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>Emphasis</label>
                  <select
                    className={`${inputClass} bg-white`}
                    value={m.emphasis}
                    onChange={(e) => setModel(i, { emphasis: e.target.value })}
                  >
                    <option value="standard">standard</option>
                    <option value="featured">featured</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Featured badge (optional)</label>
                  <input
                    className={inputClass}
                    value={m.featuredBadge ?? ""}
                    onChange={(e) => setModel(i, { featuredBadge: e.target.value || undefined })}
                  />
                </div>
              </div>
              <div>
                <label className={labelClass}>Features (one per line)</label>
                <textarea
                  className={inputClass}
                  rows={6}
                  value={m.features.join("\n")}
                  onChange={(e) => setModel(i, { features: linesToFeatures(e.target.value) })}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className={sectionClass}>
        <h3 className="mb-4 font-semibold">Process section header</h3>
        <div className="space-y-3">
          <input className={inputClass} value={value.processSection.eyebrow} onChange={(e) => setProcSec({ eyebrow: e.target.value })} />
          <input className={inputClass} value={value.processSection.title} onChange={(e) => setProcSec({ title: e.target.value })} />
          <textarea className={inputClass} rows={2} value={value.processSection.subtitle} onChange={(e) => setProcSec({ subtitle: e.target.value })} />
        </div>
      </section>

      <section className={sectionClass}>
        <h3 className="mb-4 font-semibold">Process steps (4)</h3>
        <div className="space-y-4">
          {value.processSteps.map((s, i) => (
            <div key={i} className="space-y-2 rounded-lg border border-gray-100 p-3">
              <input className={inputClass} placeholder="Icon (Phone, Search, User, Heart)" value={s.icon} onChange={(e) => setStep(i, { icon: e.target.value })} />
              <input className={inputClass} placeholder="Title" value={s.title} onChange={(e) => setStep(i, { title: e.target.value })} />
              <textarea className={inputClass} rows={2} placeholder="Description" value={s.description} onChange={(e) => setStep(i, { description: e.target.value })} />
            </div>
          ))}
        </div>
      </section>

      <section className={sectionClass}>
        <h3 className="mb-4 font-semibold">Bottom CTA</h3>
        <div className="space-y-3">
          <input className={inputClass} value={value.cta.title} onChange={(e) => setCta({ title: e.target.value })} />
          <textarea className={inputClass} rows={3} value={value.cta.description} onChange={(e) => setCta({ description: e.target.value })} />
          <div className="grid gap-3 sm:grid-cols-2">
            <input className={inputClass} placeholder="Primary label" value={value.cta.primaryLabel} onChange={(e) => setCta({ primaryLabel: e.target.value })} />
            <input className={inputClass} placeholder="Primary href" value={value.cta.primaryHref} onChange={(e) => setCta({ primaryHref: e.target.value })} />
            <input className={inputClass} placeholder="Secondary label" value={value.cta.secondaryLabel} onChange={(e) => setCta({ secondaryLabel: e.target.value })} />
            <input className={inputClass} placeholder="Secondary href" value={value.cta.secondaryHref} onChange={(e) => setCta({ secondaryHref: e.target.value })} />
          </div>
        </div>
      </section>
    </div>
  );
}
