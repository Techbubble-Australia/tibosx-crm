"use client";

import { useState } from "react";
import { inputClass, labelClass, sectionClass } from "./form-styles";

/** Mutable homepage payload for forms (seed types use `as const` literal unions). */
type HomePayload = any;
/** Explicit `any` for `.map` callbacks so `noImplicitAny` passes when iterating `HomePayload`. */
type HomeAny = any;

const tabs = [
  "Hero, stats & logos",
  "Engagement & how it works",
  "Platforms",
  "Journey",
  "FAQ & CTAs",
] as const;

export function MarketingHomeForm({
  value,
  onChange,
}: {
  value: HomePayload;
  onChange: (next: HomePayload) => void;
}) {
  const [tab, setTab] = useState(0);
  const v = value;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-3">
        {tabs.map((t, i) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(i)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              tab === i ? "bg-black text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 0 ? <TabHeroStatsLogos v={v} onChange={onChange} /> : null}
      {tab === 1 ? <TabEngagementHow v={v} onChange={onChange} /> : null}
      {tab === 2 ? <TabPlatforms v={v} onChange={onChange} /> : null}
      {tab === 3 ? <TabJourney v={v} onChange={onChange} /> : null}
      {tab === 4 ? <TabFaqCtas v={v} onChange={onChange} /> : null}
    </div>
  );
}

function TabHeroStatsLogos({
  v,
  onChange,
}: {
  v: HomePayload;
  onChange: (n: HomePayload) => void;
}) {
  const setHero = (patch: Record<string, unknown>) =>
    onChange({ ...v, hero: { ...v.hero, ...patch } });
  const setStats = (patch: Record<string, unknown>) =>
    onChange({ ...v, statsStrip: { ...v.statsStrip, ...patch } });

  const setItem = (i: number, patch: { n?: string; l?: string }) => {
    const items = v.statsStrip.items.map((row: HomeAny, j: number) => (j === i ? { ...row, ...patch } : row));
    onChange({ ...v, statsStrip: { ...v.statsStrip, items } });
  };

  const setPartner = (i: number, patch: Record<string, unknown>) => {
    const featuredPartners = v.featuredPartners.map((p: HomeAny, j: number) => (j === i ? { ...p, ...patch } : p));
    onChange({ ...v, featuredPartners });
  };

  const setLogo = (i: number, patch: Record<string, unknown>) => {
    const trustedLogos = v.trustedLogos.map((p: HomeAny, j: number) => (j === i ? { ...p, ...patch } : p));
    onChange({ ...v, trustedLogos });
  };

  return (
    <div className="space-y-6">
      <section className={sectionClass}>
        <h3 className="mb-4 font-semibold">Hero</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Pill left</label>
            <input className={inputClass} value={v.hero.pillLeft} onChange={(e) => setHero({ pillLeft: e.target.value })} />
          </div>
          <div>
            <label className={labelClass}>Pill right</label>
            <input className={inputClass} value={v.hero.pillRight} onChange={(e) => setHero({ pillRight: e.target.value })} />
          </div>
        </div>
        <div className="mt-3">
          <label className={labelClass}>Title</label>
          <input className={inputClass} value={v.hero.title} onChange={(e) => setHero({ title: e.target.value })} />
        </div>
        <div className="mt-3">
          <label className={labelClass}>Subtitle</label>
          <textarea className={inputClass} rows={3} value={v.hero.subtitle} onChange={(e) => setHero({ subtitle: e.target.value })} />
        </div>
        <div className="mt-3">
          <label className={labelClass}>Trust chips (one per line)</label>
          <textarea
            className={inputClass}
            rows={6}
            value={typeof v.hero.trustChips === "string" ? v.hero.trustChips : Array.isArray(v.hero.trustChips) ? v.hero.trustChips.join("\n") : ""}
            onChange={(e) => setHero({ trustChips: e.target.value })}
          />
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Social proof — client label</label>
            <input
              className={inputClass}
              value={v.hero.socialProof.clientLabel}
              onChange={(e) =>
                setHero({ socialProof: { ...v.hero.socialProof, clientLabel: e.target.value } })
              }
            />
          </div>
          <div>
            <label className={labelClass}>Rating label</label>
            <input
              className={inputClass}
              value={v.hero.socialProof.ratingLabel}
              onChange={(e) =>
                setHero({ socialProof: { ...v.hero.socialProof, ratingLabel: e.target.value } })
              }
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>Available label</label>
            <input
              className={inputClass}
              value={v.hero.socialProof.availableLabel}
              onChange={(e) =>
                setHero({ socialProof: { ...v.hero.socialProof, availableLabel: e.target.value } })
              }
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>Initials (comma-separated)</label>
            <input
              className={inputClass}
              value={[...v.hero.socialProof.initials].join(", ")}
              onChange={(e) =>
                setHero({
                  socialProof: {
                    ...v.hero.socialProof,
                    initials: e.target.value.split(",").map((x) => x.trim()).filter(Boolean),
                  },
                })
              }
            />
          </div>
        </div>
      </section>

      <section className={sectionClass}>
        <h3 className="mb-4 font-semibold">Stats strip</h3>
        <div className="space-y-3">
          <input className={inputClass} placeholder="Pill" value={v.statsStrip.pill} onChange={(e) => setStats({ pill: e.target.value })} />
          <input className={inputClass} placeholder="Title" value={v.statsStrip.title} onChange={(e) => setStats({ title: e.target.value })} />
        </div>
        <div className="mt-4 space-y-3">
          {v.statsStrip.items.map((row: HomeAny, i: number) => (
            <div key={i} className="grid gap-2 sm:grid-cols-2">
              <input className={inputClass} placeholder="Value" value={row.n} onChange={(e) => setItem(i, { n: e.target.value })} />
              <input className={inputClass} placeholder="Label" value={row.l} onChange={(e) => setItem(i, { l: e.target.value })} />
            </div>
          ))}
        </div>
      </section>

      <section className={sectionClass}>
        <h3 className="mb-4 font-semibold">Featured partners ({v.featuredPartners.length})</h3>
        <div className="space-y-3">
          {v.featuredPartners.map((p: HomeAny, i: number) => (
            <div key={p.id} className="grid gap-2 sm:grid-cols-3">
              <input className={inputClass} value={p.id} onChange={(e) => setPartner(i, { id: e.target.value })} />
              <input className={inputClass} placeholder="imageKey" value={p.imageKey} onChange={(e) => setPartner(i, { imageKey: e.target.value })} />
              <input className={inputClass} placeholder="imageClass" value={p.imageClass} onChange={(e) => setPartner(i, { imageClass: e.target.value })} />
            </div>
          ))}
        </div>
      </section>

      <section className={sectionClass}>
        <h3 className="mb-4 font-semibold">Trusted logos ({v.trustedLogos.length})</h3>
        <p className="mb-3 text-xs text-gray-500">Edit each row; width/height are numbers.</p>
        <div className="max-h-[420px] space-y-2 overflow-y-auto pr-1">
          {v.trustedLogos.map((logo: HomeAny, i: number) => (
            <div key={logo.name} className="grid gap-2 rounded border border-gray-100 p-2 sm:grid-cols-5">
              <input className={inputClass} placeholder="Name" value={logo.name} onChange={(e) => setLogo(i, { name: e.target.value })} />
              <input className={inputClass} placeholder="imageKey" value={logo.imageKey} onChange={(e) => setLogo(i, { imageKey: e.target.value })} />
              <input
                className={inputClass}
                type="number"
                value={logo.width}
                onChange={(e) => setLogo(i, { width: Number(e.target.value) })}
              />
              <input
                className={inputClass}
                type="number"
                value={logo.height}
                onChange={(e) => setLogo(i, { height: Number(e.target.value) })}
              />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function TabEngagementHow({
  v,
  onChange,
}: {
  v: HomePayload;
  onChange: (n: HomePayload) => void;
}) {
  const eg = v.engagement;
  const setHeader = (patch: Record<string, unknown>) =>
    onChange({ ...v, engagement: { ...eg, header: { ...eg.header, ...patch } } });
  const setHelp = (patch: Record<string, unknown>) =>
    onChange({ ...v, engagement: { ...eg, helpCard: { ...eg.helpCard, ...patch } } });
  const setModel = (i: number, patch: Record<string, unknown>) => {
    const models = eg.models.map((m: HomeAny, j: number) => (j === i ? { ...m, ...patch } : m));
    onChange({ ...v, engagement: { ...eg, models } });
  };
  const hi = v.howItWorks;
  const setHi = (patch: Record<string, unknown>) => onChange({ ...v, howItWorks: { ...hi, ...patch } });
  const setStep = (i: number, patch: Record<string, unknown>) => {
    const steps = hi.steps.map((s: HomeAny, j: number) => (j === i ? { ...s, ...patch } : s));
    onChange({ ...v, howItWorks: { ...hi, steps } });
  };

  return (
    <div className="space-y-6">
      <section className={sectionClass}>
        <h3 className="mb-4 font-semibold">Engagement header</h3>
        <div className="space-y-3">
          <input className={inputClass} value={eg.header.pill} onChange={(e) => setHeader({ pill: e.target.value })} />
          <input className={inputClass} value={eg.header.titleLine1} onChange={(e) => setHeader({ titleLine1: e.target.value })} />
          <input className={inputClass} value={eg.header.titleLine2} onChange={(e) => setHeader({ titleLine2: e.target.value })} />
          <textarea className={inputClass} rows={3} value={eg.header.subtitle} onChange={(e) => setHeader({ subtitle: e.target.value })} />
        </div>
      </section>

      <section className={sectionClass}>
        <h3 className="mb-4 font-semibold">Engagement models (3)</h3>
        <div className="space-y-6">
          {eg.models.map((m: HomeAny, i: number) => (
            <div key={m.id} className="space-y-2 rounded-lg border border-gray-100 p-3">
              <div className="grid gap-2 sm:grid-cols-2">
                <input className={inputClass} value={m.id} onChange={(e) => setModel(i, { id: e.target.value })} />
                <input className={inputClass} value={m.navLabel} onChange={(e) => setModel(i, { navLabel: e.target.value })} />
              </div>
              <input className={inputClass} value={m.label} onChange={(e) => setModel(i, { label: e.target.value })} />
              <textarea className={inputClass} rows={3} value={m.description} onChange={(e) => setModel(i, { description: e.target.value })} />
              <div>
                <label className={labelClass}>Bullets (one per line)</label>
                <textarea
                  className={inputClass}
                  rows={4}
                  value={Array.isArray(m.bullets) ? m.bullets.join("\n") : (typeof m.bullets === 'string' ? m.bullets : "")}
                  onChange={(e) => setModel(i, { bullets: e.target.value.split("\n") })}
                />
              </div>
              <div>
                <label className={labelClass}>Tags (one per line)</label>
                <textarea
                  className={inputClass}
                  rows={3}
                  value={Array.isArray(m.tags) ? m.tags.join("\n") : (typeof m.tags === 'string' ? m.tags : "")}
                  onChange={(e) => setModel(i, { tags: e.target.value.split("\n") })}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className={sectionClass}>
        <h3 className="mb-4 font-semibold">Help card</h3>
        <input className={inputClass} value={eg.helpCard.title} onChange={(e) => setHelp({ title: e.target.value })} />
        <textarea className={inputClass} rows={2} value={eg.helpCard.body} onChange={(e) => setHelp({ body: e.target.value })} />
        <input className={inputClass} value={eg.helpCard.ctaLabel} onChange={(e) => setHelp({ ctaLabel: e.target.value })} />
      </section>

      <section className={sectionClass}>
        <h3 className="mb-4 font-semibold">How it works</h3>
        <input className={inputClass} value={hi.pill} onChange={(e) => setHi({ pill: e.target.value })} />
        <input className={inputClass} value={hi.title} onChange={(e) => setHi({ title: e.target.value })} />
        <textarea className={inputClass} rows={2} value={hi.subtitle} onChange={(e) => setHi({ subtitle: e.target.value })} />
        <div className="mt-4 space-y-4">
          {hi.steps.map((s: HomeAny, i: number) => (
            <div key={s.title} className="space-y-2 rounded border border-gray-100 p-3">
              <input className={inputClass} placeholder="Icon" value={s.icon} onChange={(e) => setStep(i, { icon: e.target.value })} />
              <input className={inputClass} placeholder="Title" value={s.title} onChange={(e) => setStep(i, { title: e.target.value })} />
              <textarea className={inputClass} rows={2} value={s.body} onChange={(e) => setStep(i, { body: e.target.value })} />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function TabPlatforms({
  v,
  onChange,
}: {
  v: HomePayload;
  onChange: (n: HomePayload) => void;
}) {
  const setIntro = (patch: Record<string, unknown>) =>
    onChange({ ...v, platformsIntro: { ...v.platformsIntro, ...patch } });
  const setPlat = (i: number, patch: Record<string, unknown>) => {
    const platforms = v.platforms.map((p: HomeAny, j: number) => (j === i ? { ...p, ...patch } : p));
    onChange({ ...v, platforms });
  };
  const setFeat = (pi: number, fi: number, patch: Record<string, unknown>) => {
    const p = v.platforms[pi];
    if (!p) return;
    const features = p.features.map((f: HomeAny, j: number) => (j === fi ? { ...f, ...patch } : f));
    setPlat(pi, { features });
  };
  const setStat = (pi: number, si: number, patch: Record<string, unknown>) => {
    const p = v.platforms[pi];
    if (!p) return;
    const stats = p.stats.map((s: HomeAny, j: number) => (j === si ? { ...s, ...patch } : s));
    setPlat(pi, { stats });
  };

  return (
    <div className="space-y-6">
      <section className={sectionClass}>
        <h3 className="mb-4 font-semibold">Platforms intro</h3>
        <input className={inputClass} value={v.platformsIntro.pill} onChange={(e) => setIntro({ pill: e.target.value })} />
        <input className={inputClass} value={v.platformsIntro.title} onChange={(e) => setIntro({ title: e.target.value })} />
        <textarea className={inputClass} rows={2} value={v.platformsIntro.subtitle} onChange={(e) => setIntro({ subtitle: e.target.value })} />
      </section>

      {v.platforms.map((plat: HomeAny, pi: number) => (
        <section key={plat.id} className={sectionClass}>
          <h3 className="mb-4 font-semibold">Platform: {plat.name}</h3>
          <div className="space-y-2">
            <input className={inputClass} value={plat.id} onChange={(e) => setPlat(pi, { id: e.target.value })} />
            <input className={inputClass} value={plat.name} onChange={(e) => setPlat(pi, { name: e.target.value })} />
            <textarea className={inputClass} rows={2} value={plat.headline} onChange={(e) => setPlat(pi, { headline: e.target.value })} />
            <textarea className={inputClass} rows={3} value={plat.body} onChange={(e) => setPlat(pi, { body: e.target.value })} />
            <input className={inputClass} value={plat.ctaLabel} onChange={(e) => setPlat(pi, { ctaLabel: e.target.value })} />
            <input className={inputClass} value={plat.cardTitle} onChange={(e) => setPlat(pi, { cardTitle: e.target.value })} />
            <input className={inputClass} value={plat.cardSubtitle} onChange={(e) => setPlat(pi, { cardSubtitle: e.target.value })} />
          </div>
          <p className="mt-4 text-sm font-medium">Features</p>
          {plat.features.map((f: HomeAny, fi: number) => (
            <div key={fi} className="mt-2 space-y-1">
              <input className={inputClass} value={f.title} onChange={(e) => setFeat(pi, fi, { title: e.target.value })} />
              <input className={inputClass} value={f.sub} onChange={(e) => setFeat(pi, fi, { sub: e.target.value })} />
            </div>
          ))}
          <p className="mt-4 text-sm font-medium">Stats</p>
          <div className="grid gap-2 sm:grid-cols-3">
            {plat.stats.map((s: HomeAny, si: number) => (
              <div key={si} className="space-y-1">
                <input className={inputClass} value={s.value} onChange={(e) => setStat(pi, si, { value: e.target.value })} />
                <input className={inputClass} value={s.label} onChange={(e) => setStat(pi, si, { label: e.target.value })} />
              </div>
            ))}
          </div>
          <div className="mt-3">
            <label className={labelClass}>Tags (one per line)</label>
            <textarea
              className={inputClass}
              rows={3}
              value={Array.isArray(plat.tags) ? plat.tags.join("\n") : (typeof plat.tags === 'string' ? plat.tags : "")}
              onChange={(e) =>
                setPlat(pi, {
                  tags: e.target.value
                    .split(/\r?\n/)
                    .map((line) => line.trim())
                    .filter(Boolean),
                })
              }
            />
          </div>
        </section>
      ))}
    </div>
  );
}

function TabJourney({
  v,
  onChange,
}: {
  v: HomePayload;
  onChange: (n: HomePayload) => void;
}) {
  const j = v.journey;
  const setHead = (patch: Record<string, unknown>) =>
    onChange({ ...v, journey: { ...j, header: { ...j.header, ...patch } } });
  const setStep = (i: number, patch: Record<string, unknown>) => {
    const steps = j.steps.map((s: HomeAny, idx: number) => (idx === i ? { ...s, ...patch } : s));
    onChange({ ...v, journey: { ...j, steps } });
  };
  const setStepStat = (i: number, si: number, patch: Record<string, unknown>) => {
    const step = j.steps[i];
    if (!step) return;
    const stats = step.stats.map((x: HomeAny, idx: number) => (idx === si ? { ...x, ...patch } : x));
    setStep(i, { stats });
  };
  const setStepFeat = (i: number, fi: number, patch: Record<string, unknown>) => {
    const step = j.steps[i];
    if (!step) return;
    const features = step.features.map((x: HomeAny, idx: number) => (idx === fi ? { ...x, ...patch } : x));
    setStep(i, { features });
  };

  return (
    <div className="space-y-6">
      <section className={sectionClass}>
        <h3 className="mb-4 font-semibold">Journey header</h3>
        <input className={inputClass} value={j.header.pill} onChange={(e) => setHead({ pill: e.target.value })} />
        <input className={inputClass} value={j.header.titleLine1} onChange={(e) => setHead({ titleLine1: e.target.value })} />
        <input className={inputClass} value={j.header.titleLine2} onChange={(e) => setHead({ titleLine2: e.target.value })} />
        <textarea className={inputClass} rows={3} value={j.header.subtitle} onChange={(e) => setHead({ subtitle: e.target.value })} />
      </section>

      {j.steps.map((step: HomeAny, i: number) => (
        <section key={step.num} className={sectionClass}>
          <h3 className="mb-4 font-semibold">Step {step.num}</h3>
          <div className="grid gap-2 sm:grid-cols-2">
            <input className={inputClass} value={step.num} onChange={(e) => setStep(i, { num: e.target.value })} />
            <input className={inputClass} value={step.category} onChange={(e) => setStep(i, { category: e.target.value })} />
          </div>
          <input className={inputClass} value={step.title} onChange={(e) => setStep(i, { title: e.target.value })} />
          <input className={inputClass} value={step.badgeLabel} onChange={(e) => setStep(i, { badgeLabel: e.target.value })} />
          <textarea className={inputClass} rows={2} value={step.heading} onChange={(e) => setStep(i, { heading: e.target.value })} />
          <textarea className={inputClass} rows={3} value={step.body} onChange={(e) => setStep(i, { body: e.target.value })} />
          <div className="grid gap-2 sm:grid-cols-2">
            <input className={inputClass} value={step.cta} onChange={(e) => setStep(i, { cta: e.target.value })} />
            <input className={inputClass} value={step.ctaNote} onChange={(e) => setStep(i, { ctaNote: e.target.value })} />
          </div>
          <p className="mt-3 text-sm font-medium">Stats</p>
          <div className="grid gap-2 sm:grid-cols-3">
            {step.stats.map((st: HomeAny, si: number) => (
              <div key={si} className="space-y-1">
                <input className={inputClass} value={st.value} onChange={(e) => setStepStat(i, si, { value: e.target.value })} />
                <input className={inputClass} value={st.label} onChange={(e) => setStepStat(i, si, { label: e.target.value })} />
              </div>
            ))}
          </div>
          <p className="mt-3 text-sm font-medium">Features</p>
          {step.features.map((f: HomeAny, fi: number) => (
            <div key={fi} className="mt-2 space-y-1">
              <input className={inputClass} value={f.title} onChange={(e) => setStepFeat(i, fi, { title: e.target.value })} />
              <input className={inputClass} value={f.sub} onChange={(e) => setStepFeat(i, fi, { sub: e.target.value })} />
            </div>
          ))}
        </section>
      ))}
    </div>
  );
}

function TabFaqCtas({
  v,
  onChange,
}: {
  v: HomePayload;
  onChange: (n: HomePayload) => void;
}) {
  const setAside = (patch: Record<string, unknown>) => onChange({ ...v, faqAside: { ...v.faqAside, ...patch } });
  const setBand = (patch: Record<string, unknown>) => onChange({ ...v, careersBand: { ...v.careersBand, ...patch } });
  const setSched = (patch: Record<string, unknown>) =>
    onChange({ ...v, scheduleDemo: { ...v.scheduleDemo, ...patch } });
  const setCareersCta = (patch: Record<string, unknown>) =>
    onChange({ ...v, careersCta: { ...v.careersCta, ...patch } });
  const setFaq = (i: number, patch: Record<string, unknown>) => {
    const faqItems = v.faqItems.map((f: HomeAny, j: number) => (j === i ? { ...f, ...patch } : f));
    onChange({ ...v, faqItems });
  };

  return (
    <div className="space-y-6">
      <section className={sectionClass}>
        <h3 className="mb-4 font-semibold">FAQ aside</h3>
        <textarea className={inputClass} rows={2} value={v.faqAside.blurb} onChange={(e) => setAside({ blurb: e.target.value })} />
        <input className={inputClass} value={v.faqAside.ctaLabel} onChange={(e) => setAside({ ctaLabel: e.target.value })} />
      </section>

      <section className={sectionClass}>
        <h3 className="mb-4 font-semibold">Careers band</h3>
        <input className={inputClass} value={v.careersBand.pill} onChange={(e) => setBand({ pill: e.target.value })} />
        <input className={inputClass} value={v.careersBand.title} onChange={(e) => setBand({ title: e.target.value })} />
        <textarea className={inputClass} rows={3} value={v.careersBand.subtitle} onChange={(e) => setBand({ subtitle: e.target.value })} />
        <div className="grid gap-2 sm:grid-cols-2">
          <input className={inputClass} value={v.careersBand.browseCta} onChange={(e) => setBand({ browseCta: e.target.value })} />
          <input className={inputClass} value={v.careersBand.viewAllLabel} onChange={(e) => setBand({ viewAllLabel: e.target.value })} />
        </div>
      </section>

      <section className={sectionClass}>
        <h3 className="mb-4 font-semibold">Schedule demo</h3>
        <input className={inputClass} value={v.scheduleDemo.pill} onChange={(e) => setSched({ pill: e.target.value })} />
        <textarea className={inputClass} rows={2} value={v.scheduleDemo.title} onChange={(e) => setSched({ title: e.target.value })} />
        <textarea className={inputClass} rows={2} value={v.scheduleDemo.subtitle} onChange={(e) => setSched({ subtitle: e.target.value })} />
        <div className="grid gap-2 sm:grid-cols-2">
          <input className={inputClass} value={v.scheduleDemo.primaryCta} onChange={(e) => setSched({ primaryCta: e.target.value })} />
          <input className={inputClass} value={v.scheduleDemo.secondaryCta} onChange={(e) => setSched({ secondaryCta: e.target.value })} />
        </div>
        <label className={labelClass}>Bullets (one per line)</label>
        <textarea
          className={inputClass}
          rows={3}
          value={Array.isArray(v.scheduleDemo.bullets) ? v.scheduleDemo.bullets.join("\n") : (typeof v.scheduleDemo.bullets === 'string' ? v.scheduleDemo.bullets : "")}
          onChange={(e) => setSched({ bullets: e.target.value.split("\n") })}
        />
      </section>

      <section className={sectionClass}>
        <h3 className="mb-4 font-semibold">Careers CTA (footer)</h3>
        <input className={inputClass} value={v.careersCta.title} onChange={(e) => setCareersCta({ title: e.target.value })} />
        <textarea className={inputClass} rows={3} value={v.careersCta.subtitle} onChange={(e) => setCareersCta({ subtitle: e.target.value })} />
        <label className={labelClass}>Bullets</label>
        <textarea
          className={inputClass}
          rows={3}
          value={Array.isArray(v.careersCta.bullets) ? v.careersCta.bullets.join("\n") : (typeof v.careersCta.bullets === 'string' ? v.careersCta.bullets : "")}
          onChange={(e) => setCareersCta({ bullets: e.target.value.split("\n") })}
        />
      </section>

      <section className={sectionClass}>
        <h3 className="mb-4 font-semibold">FAQ items</h3>
        <div className="space-y-4">
          {v.faqItems.map((f: HomeAny, i: number) => (
            <div key={i} className="space-y-2 rounded border border-gray-100 p-3">
              <input className={inputClass} value={f.question} onChange={(e) => setFaq(i, { question: e.target.value })} />
              <textarea className={inputClass} rows={4} value={f.answer} onChange={(e) => setFaq(i, { answer: e.target.value })} />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
