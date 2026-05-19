"use client";

import { multilineToLines } from "@/lib/multiline-list";
import { inputClass, labelClass, sectionClass } from "./form-styles";

type Highlight = { title: string; description: string; icon: string };
type Metric = { value: string; label: string };
type ProcessStep = { icon: string; title: string; description: string };

export type ServicesPagePayload = {
  hero: { title: string; subtitle: string };
  highlights: Highlight[];
  projectServices: {
    eyebrow: string;
    title: string;
    body: string;
    bullets: string[];
    tags: string[];
    missionCard: { title: string; body: string; metrics: Metric[] };
  };
  productDevelopment: {
    eyebrow: string;
    title: string;
    intro: string;
    bullets: string[];
    metricsBar: Metric[];
    tags: string[];
  };
  staffingServices: {
    eyebrow: string;
    title: string;
    body: string;
    bullets: string[];
    tags: string[];
    metricsTitle: string;
    metrics: Metric[];
  };
  processSection: { eyebrow: string; title: string; subtitle: string };
  processSteps: ProcessStep[];
  cta: {
    title: string;
    description: string;
    primaryLabel: string;
    primaryHref: string;
    secondaryLabel: string;
    secondaryHref: string;
    checklist: string[];
  };
};

function tagsFromCsv(s: string): string[] {
  return s.split(",").map((t) => t.trim()).filter(Boolean);
}

export function ServicesPageForm({
  value,
  onChange,
}: {
  value: ServicesPagePayload;
  onChange: (next: ServicesPagePayload) => void;
}) {
  const setHero = (patch: Partial<ServicesPagePayload["hero"]>) => onChange({ ...value, hero: { ...value.hero, ...patch } });
  const setProcSec = (patch: Partial<ServicesPagePayload["processSection"]>) =>
    onChange({ ...value, processSection: { ...value.processSection, ...patch } });
  const setCta = (patch: Partial<ServicesPagePayload["cta"]>) => onChange({ ...value, cta: { ...value.cta, ...patch } });

  const setPs = (patch: Partial<ServicesPagePayload["projectServices"]>) =>
    onChange({ ...value, projectServices: { ...value.projectServices, ...patch } });
  const setPsMission = (patch: Partial<ServicesPagePayload["projectServices"]["missionCard"]>) =>
    onChange({
      ...value,
      projectServices: {
        ...value.projectServices,
        missionCard: { ...value.projectServices.missionCard, ...patch },
      },
    });

  const setPd = (patch: Partial<ServicesPagePayload["productDevelopment"]>) =>
    onChange({ ...value, productDevelopment: { ...value.productDevelopment, ...patch } });

  const setSs = (patch: Partial<ServicesPagePayload["staffingServices"]>) =>
    onChange({ ...value, staffingServices: { ...value.staffingServices, ...patch } });

  const setHighlight = (i: number, patch: Partial<Highlight>) => {
    const highlights = value.highlights.map((h, j) => (j === i ? { ...h, ...patch } : h));
    onChange({ ...value, highlights });
  };

  const setStep = (i: number, patch: Partial<ProcessStep>) => {
    const processSteps = value.processSteps.map((s, j) => (j === i ? { ...s, ...patch } : s));
    onChange({ ...value, processSteps });
  };

  const setMissionMetric = (i: number, patch: Partial<Metric>) => {
    const metrics = value.projectServices.missionCard.metrics.map((m, j) => (j === i ? { ...m, ...patch } : m));
    setPsMission({ metrics });
  };

  const setBarMetric = (i: number, patch: Partial<Metric>) => {
    const metricsBar = value.productDevelopment.metricsBar.map((m, j) => (j === i ? { ...m, ...patch } : m));
    setPd({ metricsBar });
  };

  const setStaffMetric = (i: number, patch: Partial<Metric>) => {
    const metrics = value.staffingServices.metrics.map((m, j) => (j === i ? { ...m, ...patch } : m));
    setSs({ metrics });
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
        <h3 className="mb-4 font-semibold">Trust pillars (4 hero cards)</h3>
        <p className="mb-3 text-xs text-gray-500">Icon keys: Scaling, Transparency, Quality, Global</p>
        <div className="space-y-4">
          {value.highlights.map((h, i) => (
            <div key={i} className="rounded-lg border border-gray-100 p-3">
              <p className="mb-2 text-sm font-medium text-gray-600">Card {i + 1}</p>
              <div className="space-y-2">
                <input className={inputClass} placeholder="Icon key" value={h.icon} onChange={(e) => setHighlight(i, { icon: e.target.value })} />
                <input className={inputClass} placeholder="Title" value={h.title} onChange={(e) => setHighlight(i, { title: e.target.value })} />
                <textarea
                  className={inputClass}
                  rows={2}
                  placeholder="Description"
                  value={h.description}
                  onChange={(e) => setHighlight(i, { description: e.target.value })}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className={sectionClass}>
        <h3 className="mb-4 font-semibold">01 — Project services</h3>
        <div className="space-y-3">
          <input className={inputClass} placeholder="Eyebrow" value={value.projectServices.eyebrow} onChange={(e) => setPs({ eyebrow: e.target.value })} />
          <input className={inputClass} placeholder="Title" value={value.projectServices.title} onChange={(e) => setPs({ title: e.target.value })} />
          <textarea className={inputClass} rows={4} value={value.projectServices.body} onChange={(e) => setPs({ body: e.target.value })} />
          <div>
            <label className={labelClass}>Bullets (one per line)</label>
            <textarea
              className={inputClass}
              rows={5}
              value={value.projectServices.bullets.join("\n")}
              onChange={(e) => setPs({ bullets: multilineToLines(e.target.value) })}
            />
          </div>
          <div>
            <label className={labelClass}>Tags (comma-separated)</label>
            <input
              className={inputClass}
              value={value.projectServices.tags.join(", ")}
              onChange={(e) => setPs({ tags: tagsFromCsv(e.target.value) })}
            />
          </div>
          <p className="text-sm font-medium text-gray-700">Mission card</p>
          <input className={inputClass} placeholder="Mission title" value={value.projectServices.missionCard.title} onChange={(e) => setPsMission({ title: e.target.value })} />
          <textarea className={inputClass} rows={3} value={value.projectServices.missionCard.body} onChange={(e) => setPsMission({ body: e.target.value })} />
          {value.projectServices.missionCard.metrics.map((m, i) => (
            <div key={i} className="grid gap-2 sm:grid-cols-2">
              <input className={inputClass} placeholder="Value" value={m.value} onChange={(e) => setMissionMetric(i, { value: e.target.value })} />
              <input className={inputClass} placeholder="Label" value={m.label} onChange={(e) => setMissionMetric(i, { label: e.target.value })} />
            </div>
          ))}
        </div>
      </section>

      <section className={sectionClass}>
        <h3 className="mb-4 font-semibold">02 — Product development</h3>
        <div className="space-y-3">
          <input className={inputClass} value={value.productDevelopment.eyebrow} onChange={(e) => setPd({ eyebrow: e.target.value })} />
          <input className={inputClass} value={value.productDevelopment.title} onChange={(e) => setPd({ title: e.target.value })} />
          <textarea className={inputClass} rows={4} value={value.productDevelopment.intro} onChange={(e) => setPd({ intro: e.target.value })} />
          <label className={labelClass}>Bullets (one per line)</label>
          <textarea className={inputClass} rows={5} value={value.productDevelopment.bullets.join("\n")} onChange={(e) => setPd({ bullets: multilineToLines(e.target.value) })} />
          <p className="text-sm font-medium text-gray-700">Metrics bar (4)</p>
          {value.productDevelopment.metricsBar.map((m, i) => (
            <div key={i} className="grid gap-2 sm:grid-cols-2">
              <input className={inputClass} placeholder="Value" value={m.value} onChange={(e) => setBarMetric(i, { value: e.target.value })} />
              <input className={inputClass} placeholder="Label" value={m.label} onChange={(e) => setBarMetric(i, { label: e.target.value })} />
            </div>
          ))}
          <label className={labelClass}>Tags (comma-separated)</label>
          <input
            className={inputClass}
            value={value.productDevelopment.tags.join(", ")}
            onChange={(e) => setPd({ tags: tagsFromCsv(e.target.value) })}
          />
        </div>
      </section>

      <section className={sectionClass}>
        <h3 className="mb-4 font-semibold">03 — Staffing services</h3>
        <div className="space-y-3">
          <input className={inputClass} value={value.staffingServices.eyebrow} onChange={(e) => setSs({ eyebrow: e.target.value })} />
          <input className={inputClass} value={value.staffingServices.title} onChange={(e) => setSs({ title: e.target.value })} />
          <textarea className={inputClass} rows={4} value={value.staffingServices.body} onChange={(e) => setSs({ body: e.target.value })} />
          <label className={labelClass}>Bullets (one per line)</label>
          <textarea className={inputClass} rows={5} value={value.staffingServices.bullets.join("\n")} onChange={(e) => setSs({ bullets: multilineToLines(e.target.value) })} />
          <label className={labelClass}>Tags (comma-separated)</label>
          <input className={inputClass} value={value.staffingServices.tags.join(", ")} onChange={(e) => setSs({ tags: tagsFromCsv(e.target.value) })} />
          <input className={inputClass} placeholder="Metrics card title" value={value.staffingServices.metricsTitle} onChange={(e) => setSs({ metricsTitle: e.target.value })} />
          {value.staffingServices.metrics.map((m, i) => (
            <div key={i} className="grid gap-2 sm:grid-cols-2">
              <input className={inputClass} placeholder="Value" value={m.value} onChange={(e) => setStaffMetric(i, { value: e.target.value })} />
              <input className={inputClass} placeholder="Label" value={m.label} onChange={(e) => setStaffMetric(i, { label: e.target.value })} />
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
        <p className="mb-2 text-xs text-gray-500">Icons: MessageCircle, LineChart, FileText, Rocket</p>
        <div className="space-y-4">
          {value.processSteps.map((s, i) => (
            <div key={i} className="space-y-2 rounded-lg border border-gray-100 p-3">
              <input className={inputClass} placeholder="Icon" value={s.icon} onChange={(e) => setStep(i, { icon: e.target.value })} />
              <input className={inputClass} placeholder="Title" value={s.title} onChange={(e) => setStep(i, { title: e.target.value })} />
              <textarea className={inputClass} rows={2} value={s.description} onChange={(e) => setStep(i, { description: e.target.value })} />
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
          <div>
            <label className={labelClass}>Checklist (one per line)</label>
            <textarea
              className={inputClass}
              rows={4}
              value={value.cta.checklist.join("\n")}
              onChange={(e) => setCta({ checklist: multilineToLines(e.target.value) })}
            />
          </div>
        </div>
      </section>
    </div>
  );
}
