"use client";

import { multilineToLines } from "@/lib/multiline-list";
import { inputClass, labelClass, sectionClass } from "./form-styles";

type ValueStripItem = { text: string; width: string };
type PricingModel = {
  name: string;
  title: string;
  description: string;
  price: string;
  priceNote: string;
  features: string[];
  cta: string;
  popular: boolean;
};
type Faq = { question: string; answer: string };

export type PricingPagePayload = {
  hero: { title: string; subtitle: string };
  valueStrip: ValueStripItem[];
  cardsSection: { eyebrow: string; title: string; subtitle: string };
  models: PricingModel[];
  faqs: Faq[];
  rateCardSection: {
    eyebrow: string;
    title: string;
    subtitle: string;
    bullets: string[];
    footerChips: string[];
    formTitle: string;
    formSubtitle: string;
    formSubmitLabel: string;
  };
  faqSection: {
    eyebrow: string;
    titleLines: string[];
    asideBlurb: string;
    asideCtaLabel: string;
    asideCtaHref: string;
  };
  closingCta: {
    title: string;
    description: string;
    primaryLabel: string;
    primaryHref: string;
    secondaryLabel: string;
    secondaryHref: string;
  };
};

export function PricingPageForm({
  value,
  onChange,
}: {
  value: PricingPagePayload;
  onChange: (next: PricingPagePayload) => void;
}) {
  const setHero = (patch: Partial<PricingPagePayload["hero"]>) => onChange({ ...value, hero: { ...value.hero, ...patch } });
  const setCards = (patch: Partial<PricingPagePayload["cardsSection"]>) =>
    onChange({ ...value, cardsSection: { ...value.cardsSection, ...patch } });
  const setRate = (patch: Partial<PricingPagePayload["rateCardSection"]>) =>
    onChange({ ...value, rateCardSection: { ...value.rateCardSection, ...patch } });
  const setFaqSec = (patch: Partial<PricingPagePayload["faqSection"]>) =>
    onChange({ ...value, faqSection: { ...value.faqSection, ...patch } });
  const setClose = (patch: Partial<PricingPagePayload["closingCta"]>) =>
    onChange({ ...value, closingCta: { ...value.closingCta, ...patch } });

  const setValueStrip = (i: number, patch: Partial<ValueStripItem>) => {
    const valueStrip = value.valueStrip.map((v, j) => (j === i ? { ...v, ...patch } : v));
    onChange({ ...value, valueStrip });
  };

  const setModel = (i: number, patch: Partial<PricingModel>) => {
    const models = value.models.map((m, j) => (j === i ? { ...m, ...patch } : m));
    onChange({ ...value, models });
  };

  const setFaq = (i: number, patch: Partial<Faq>) => {
    const faqs = value.faqs.map((f, j) => (j === i ? { ...f, ...patch } : f));
    onChange({ ...value, faqs });
  };

  return (
    <div className="space-y-6">
      <section className={sectionClass}>
        <h3 className="mb-4 font-semibold">Hero</h3>
        <div className="space-y-3">
          <input className={inputClass} value={value.hero.title} onChange={(e) => setHero({ title: e.target.value })} />
          <textarea className={inputClass} rows={4} value={value.hero.subtitle} onChange={(e) => setHero({ subtitle: e.target.value })} />
        </div>
      </section>

      <section className={sectionClass}>
        <h3 className="mb-4 font-semibold">Value strip</h3>
        <div className="space-y-3">
          {value.valueStrip.map((row, i) => (
            <div key={i} className="grid gap-2 sm:grid-cols-2">
              <input className={inputClass} placeholder="Text" value={row.text} onChange={(e) => setValueStrip(i, { text: e.target.value })} />
              <input className={inputClass} placeholder="Width class" value={row.width} onChange={(e) => setValueStrip(i, { width: e.target.value })} />
            </div>
          ))}
        </div>
      </section>

      <section className={sectionClass}>
        <h3 className="mb-4 font-semibold">Cards section header</h3>
        <div className="space-y-3">
          <input className={inputClass} value={value.cardsSection.eyebrow} onChange={(e) => setCards({ eyebrow: e.target.value })} />
          <input className={inputClass} value={value.cardsSection.title} onChange={(e) => setCards({ title: e.target.value })} />
          <textarea className={inputClass} rows={2} value={value.cardsSection.subtitle} onChange={(e) => setCards({ subtitle: e.target.value })} />
        </div>
      </section>

      <section className={sectionClass}>
        <h3 className="mb-4 font-semibold">Pricing models (3)</h3>
        <div className="space-y-6">
          {value.models.map((m, i) => (
            <div key={i} className="space-y-3 rounded-lg border border-gray-100 p-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <input className={inputClass} value={m.name} onChange={(e) => setModel(i, { name: e.target.value })} />
                <input className={inputClass} value={m.title} onChange={(e) => setModel(i, { title: e.target.value })} />
              </div>
              <textarea className={inputClass} rows={2} value={m.description} onChange={(e) => setModel(i, { description: e.target.value })} />
              <div className="grid gap-3 sm:grid-cols-3">
                <input className={inputClass} placeholder="Price" value={m.price} onChange={(e) => setModel(i, { price: e.target.value })} />
                <input className={inputClass} placeholder="Price note" value={m.priceNote} onChange={(e) => setModel(i, { priceNote: e.target.value })} />
                <input className={inputClass} placeholder="CTA" value={m.cta} onChange={(e) => setModel(i, { cta: e.target.value })} />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={m.popular}
                  onChange={(e) => setModel(i, { popular: e.target.checked })}
                />
                Popular / highlighted
              </label>
              <div>
                <label className={labelClass}>Features (one per line)</label>
                <textarea
                  className={inputClass}
                  rows={6}
                  value={m.features.join("\n")}
                  onChange={(e) => setModel(i, { features: multilineToLines(e.target.value) })}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className={sectionClass}>
        <h3 className="mb-4 font-semibold">Inline FAQs (pricing page)</h3>
        <div className="space-y-4">
          {value.faqs.map((f, i) => (
            <div key={i} className="space-y-2 rounded-lg border border-gray-100 p-3">
              <input className={inputClass} placeholder="Question" value={f.question} onChange={(e) => setFaq(i, { question: e.target.value })} />
              <textarea className={inputClass} rows={3} placeholder="Answer" value={f.answer} onChange={(e) => setFaq(i, { answer: e.target.value })} />
            </div>
          ))}
        </div>
      </section>

      <section className={sectionClass}>
        <h3 className="mb-4 font-semibold">Rate card section</h3>
        <div className="space-y-3">
          <input className={inputClass} value={value.rateCardSection.eyebrow} onChange={(e) => setRate({ eyebrow: e.target.value })} />
          <input className={inputClass} value={value.rateCardSection.title} onChange={(e) => setRate({ title: e.target.value })} />
          <textarea className={inputClass} rows={3} value={value.rateCardSection.subtitle} onChange={(e) => setRate({ subtitle: e.target.value })} />
          <div>
            <label className={labelClass}>Bullets (one per line)</label>
            <textarea
              className={inputClass}
              rows={4}
              value={value.rateCardSection.bullets.join("\n")}
              onChange={(e) => setRate({ bullets: multilineToLines(e.target.value) })}
            />
          </div>
          <div>
            <label className={labelClass}>Footer chips (one per line)</label>
            <textarea
              className={inputClass}
              rows={3}
              value={value.rateCardSection.footerChips.join("\n")}
              onChange={(e) => setRate({ footerChips: multilineToLines(e.target.value) })}
            />
          </div>
          <input className={inputClass} placeholder="Form title" value={value.rateCardSection.formTitle} onChange={(e) => setRate({ formTitle: e.target.value })} />
          <input className={inputClass} placeholder="Form subtitle" value={value.rateCardSection.formSubtitle} onChange={(e) => setRate({ formSubtitle: e.target.value })} />
          <input className={inputClass} placeholder="Submit label" value={value.rateCardSection.formSubmitLabel} onChange={(e) => setRate({ formSubmitLabel: e.target.value })} />
        </div>
      </section>

      <section className={sectionClass}>
        <h3 className="mb-4 font-semibold">FAQ aside (layout)</h3>
        <div className="space-y-3">
          <input className={inputClass} value={value.faqSection.eyebrow} onChange={(e) => setFaqSec({ eyebrow: e.target.value })} />
          <div>
            <label className={labelClass}>Title lines (one per line)</label>
            <textarea
              className={inputClass}
              rows={3}
              value={value.faqSection.titleLines.join("\n")}
              onChange={(e) => setFaqSec({ titleLines: multilineToLines(e.target.value) })}
            />
          </div>
          <textarea className={inputClass} rows={2} value={value.faqSection.asideBlurb} onChange={(e) => setFaqSec({ asideBlurb: e.target.value })} />
          <div className="grid gap-3 sm:grid-cols-2">
            <input className={inputClass} value={value.faqSection.asideCtaLabel} onChange={(e) => setFaqSec({ asideCtaLabel: e.target.value })} />
            <input className={inputClass} value={value.faqSection.asideCtaHref} onChange={(e) => setFaqSec({ asideCtaHref: e.target.value })} />
          </div>
        </div>
      </section>

      <section className={sectionClass}>
        <h3 className="mb-4 font-semibold">Closing CTA</h3>
        <div className="space-y-3">
          <input className={inputClass} value={value.closingCta.title} onChange={(e) => setClose({ title: e.target.value })} />
          <textarea className={inputClass} rows={3} value={value.closingCta.description} onChange={(e) => setClose({ description: e.target.value })} />
          <div className="grid gap-3 sm:grid-cols-2">
            <input className={inputClass} value={value.closingCta.primaryLabel} onChange={(e) => setClose({ primaryLabel: e.target.value })} />
            <input className={inputClass} value={value.closingCta.primaryHref} onChange={(e) => setClose({ primaryHref: e.target.value })} />
            <input className={inputClass} value={value.closingCta.secondaryLabel} onChange={(e) => setClose({ secondaryLabel: e.target.value })} />
            <input className={inputClass} value={value.closingCta.secondaryHref} onChange={(e) => setClose({ secondaryHref: e.target.value })} />
          </div>
        </div>
      </section>
    </div>
  );
}
