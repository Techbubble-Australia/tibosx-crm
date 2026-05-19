"use client";

import { multilineToLines } from "@/lib/multiline-list";
import { inputClass, labelClass, sectionClass } from "./form-styles";

type StatNumber = { kind: "number"; value: string; label: string };
type StatIcon = { kind: "icon"; icon: string; label: string };
type StatStrip = StatNumber | StatIcon;
type CultureCard = { title: string; description: string; icon: string };

export type CareersPagePayload = {
  hero: { title: string; subtitle: string };
  cultureSection: { eyebrow: string; title: string; subtitle: string };
  statsStrip: StatStrip[];
  benefits: string[];
  cultureCards: CultureCard[];
};

export function CareersPageForm({
  value,
  onChange,
}: {
  value: CareersPagePayload;
  onChange: (next: CareersPagePayload) => void;
}) {
  const setHero = (patch: Partial<CareersPagePayload["hero"]>) => onChange({ ...value, hero: { ...value.hero, ...patch } });
  const setCultureSection = (patch: Partial<CareersPagePayload["cultureSection"]>) =>
    onChange({ ...value, cultureSection: { ...value.cultureSection, ...patch } });

  const setStat = (i: number, next: StatStrip) => {
    const statsStrip = value.statsStrip.map((s, j) => (j === i ? next : s));
    onChange({ ...value, statsStrip });
  };

  const setCard = (i: number, patch: Partial<CultureCard>) => {
    const cultureCards = value.cultureCards.map((c, j) => (j === i ? { ...c, ...patch } : c));
    onChange({ ...value, cultureCards });
  };

  const benefitsText = value.benefits.join("\n");

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
            <textarea className={inputClass} rows={3} value={value.hero.subtitle} onChange={(e) => setHero({ subtitle: e.target.value })} />
          </div>
        </div>
      </section>

      <section className={sectionClass}>
        <h3 className="mb-4 font-semibold">Stats strip</h3>
        <div className="space-y-4">
          {value.statsStrip.map((row, i) => (
            <div key={i} className="rounded-lg border border-gray-100 p-3">
              <label className={labelClass}>Row {i + 1} type</label>
              <select
                className={`${inputClass} mb-3 bg-white`}
                value={row.kind}
                onChange={(e) => {
                  const kind = e.target.value as "number" | "icon";
                  if (kind === "number") setStat(i, { kind: "number", value: "", label: "" });
                  else setStat(i, { kind: "icon", icon: "Laptop", label: "" });
                }}
              >
                <option value="number">Number + label</option>
                <option value="icon">Icon + label</option>
              </select>
              {row.kind === "number" ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className={labelClass}>Value</label>
                    <input
                      className={inputClass}
                      value={row.value}
                      onChange={(e) => setStat(i, { ...row, value: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Label</label>
                    <input
                      className={inputClass}
                      value={row.label}
                      onChange={(e) => setStat(i, { ...row, label: e.target.value })}
                    />
                  </div>
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className={labelClass}>Lucide icon name</label>
                    <input
                      className={inputClass}
                      value={row.icon}
                      onChange={(e) => setStat(i, { ...row, icon: e.target.value })}
                      placeholder="Laptop"
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Label</label>
                    <input
                      className={inputClass}
                      value={row.label}
                      onChange={(e) => setStat(i, { ...row, label: e.target.value })}
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className={sectionClass}>
        <h3 className="mb-4 font-semibold">Culture section</h3>
        <div className="space-y-3">
          <div>
            <label className={labelClass}>Eyebrow</label>
            <input
              className={inputClass}
              value={value.cultureSection.eyebrow}
              onChange={(e) => setCultureSection({ eyebrow: e.target.value })}
            />
          </div>
          <div>
            <label className={labelClass}>Title</label>
            <input className={inputClass} value={value.cultureSection.title} onChange={(e) => setCultureSection({ title: e.target.value })} />
          </div>
          <div>
            <label className={labelClass}>Subtitle</label>
            <textarea
              className={inputClass}
              rows={3}
              value={value.cultureSection.subtitle}
              onChange={(e) => setCultureSection({ subtitle: e.target.value })}
            />
          </div>
        </div>
      </section>

      <section className={sectionClass}>
        <h3 className="mb-4 font-semibold">Benefits (apply section)</h3>
        <label className={labelClass}>One benefit per line</label>
        <textarea
          className={inputClass}
          rows={8}
          value={benefitsText}
          onChange={(e) =>
            onChange({
              ...value,
              benefits: multilineToLines(e.target.value),
            })
          }
        />
      </section>

      <section className={sectionClass}>
        <h3 className="mb-4 font-semibold">Culture cards</h3>
        <div className="space-y-4">
          {value.cultureCards.map((card, i) => (
            <div key={i} className="space-y-2 rounded-lg border border-gray-100 p-3">
              <div>
                <label className={labelClass}>Title</label>
                <input className={inputClass} value={card.title} onChange={(e) => setCard(i, { title: e.target.value })} />
              </div>
              <div>
                <label className={labelClass}>Description</label>
                <textarea className={inputClass} rows={2} value={card.description} onChange={(e) => setCard(i, { description: e.target.value })} />
              </div>
              <div>
                <label className={labelClass}>Icon (Lucide name)</label>
                <input className={inputClass} value={card.icon} onChange={(e) => setCard(i, { icon: e.target.value })} />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
