"use client";

import { inputClass, labelClass, sectionClass } from "./form-styles";

type StatRow = { n: string; l: string; labelClass: string };
type MissionCard = { title: string; text: string };

export type AboutPagePayload = {
  hero: { titleLine1: string; titleLine2: string; subtitle: string };
  mission: { eyebrow: string; title: string; body: string };
  statsStrip: StatRow[];
  missionCards: MissionCard[];
};

export function AboutPageForm({
  value,
  onChange,
}: {
  value: AboutPagePayload;
  onChange: (next: AboutPagePayload) => void;
}) {
  const setHero = (patch: Partial<AboutPagePayload["hero"]>) => onChange({ ...value, hero: { ...value.hero, ...patch } });
  const setMission = (patch: Partial<AboutPagePayload["mission"]>) =>
    onChange({ ...value, mission: { ...value.mission, ...patch } });

  const setStat = (i: number, patch: Partial<StatRow>) => {
    const statsStrip = value.statsStrip.map((s, j) => (j === i ? { ...s, ...patch } : s));
    onChange({ ...value, statsStrip });
  };

  const setCard = (i: number, patch: Partial<MissionCard>) => {
    const missionCards = value.missionCards.map((c, j) => (j === i ? { ...c, ...patch } : c));
    onChange({ ...value, missionCards });
  };

  return (
    <div className="space-y-6">
      <section className={sectionClass}>
        <h3 className="mb-4 font-semibold">Hero</h3>
        <div className="space-y-3">
          <div>
            <label className={labelClass}>Title line 1</label>
            <input className={inputClass} value={value.hero.titleLine1} onChange={(e) => setHero({ titleLine1: e.target.value })} />
          </div>
          <div>
            <label className={labelClass}>Title line 2</label>
            <input className={inputClass} value={value.hero.titleLine2} onChange={(e) => setHero({ titleLine2: e.target.value })} />
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
            <div key={i} className="grid gap-3 rounded-lg border border-gray-100 p-3 sm:grid-cols-3">
              <div>
                <label className={labelClass}>Value</label>
                <input className={inputClass} value={row.n} onChange={(e) => setStat(i, { n: e.target.value })} />
              </div>
              <div>
                <label className={labelClass}>Label</label>
                <input className={inputClass} value={row.l} onChange={(e) => setStat(i, { l: e.target.value })} />
              </div>
              <div>
                <label className={labelClass}>Label CSS class</label>
                <input
                  className={inputClass}
                  value={row.labelClass}
                  onChange={(e) => setStat(i, { labelClass: e.target.value })}
                  placeholder="Tailwind classes"
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className={sectionClass}>
        <h3 className="mb-4 font-semibold">Mission</h3>
        <div className="space-y-3">
          <div>
            <label className={labelClass}>Eyebrow</label>
            <input className={inputClass} value={value.mission.eyebrow} onChange={(e) => setMission({ eyebrow: e.target.value })} />
          </div>
          <div>
            <label className={labelClass}>Title</label>
            <input className={inputClass} value={value.mission.title} onChange={(e) => setMission({ title: e.target.value })} />
          </div>
          <div>
            <label className={labelClass}>Body</label>
            <textarea className={inputClass} rows={6} value={value.mission.body} onChange={(e) => setMission({ body: e.target.value })} />
          </div>
        </div>
      </section>

      <section className={sectionClass}>
        <h3 className="mb-4 font-semibold">Mission cards</h3>
        <div className="space-y-4">
          {value.missionCards.map((card, i) => (
            <div key={i} className="space-y-2 rounded-lg border border-gray-100 p-3">
              <label className={labelClass}>Card {i + 1} title</label>
              <input className={inputClass} value={card.title} onChange={(e) => setCard(i, { title: e.target.value })} />
              <label className={labelClass}>Text</label>
              <textarea className={inputClass} rows={2} value={card.text} onChange={(e) => setCard(i, { text: e.target.value })} />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
