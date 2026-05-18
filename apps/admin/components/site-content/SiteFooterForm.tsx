"use client";

import { siteFooterPayload, SITE_FOOTER_FLAG_CODES } from "@site-content/defaults";
import { inputClass, labelClass, sectionClass } from "./form-styles";

export type SiteFooterPayload = typeof siteFooterPayload;

function createEmptyOffice(): SiteFooterPayload["offices"][number] {
  return { flagCode: "au", region: "", entity: "", address: "" };
}

export function SiteFooterForm({
  value,
  onChange,
}: {
  value: SiteFooterPayload;
  onChange: (next: SiteFooterPayload) => void;
}) {
  return (
    <div className="space-y-8">
      <section className={sectionClass}>
        <h3 className="mb-4 font-semibold">Brand</h3>
        <label className={labelClass}>Tagline</label>
        <textarea className={inputClass} rows={3} value={value.tagline} onChange={(e) => onChange({ ...value, tagline: e.target.value })} />
      </section>

      <section className={sectionClass}>
        <h3 className="mb-4 font-semibold">Social</h3>
        <div className="space-y-3">
          {value.social.map((s, i) => (
            <div key={`soc-${i}`} className="grid gap-2 sm:grid-cols-2">
              <div>
                <label className={labelClass}>Label (LinkedIn | Facebook | Instagram)</label>
                <input
                  className={inputClass}
                  value={s.label}
                  onChange={(e) => {
                    const next = [...value.social];
                    next[i] = { ...s, label: e.target.value as (typeof s)["label"] };
                    onChange({ ...value, social: next });
                  }}
                />
              </div>
              <div>
                <label className={labelClass}>Href</label>
                <input
                  className={inputClass}
                  value={s.href}
                  onChange={(e) => {
                    const next = [...value.social];
                    next[i] = { ...s, href: e.target.value };
                    onChange({ ...value, social: next });
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className={sectionClass}>
        <h3 className="mb-4 font-semibold">Company links</h3>
        <div className="space-y-2">
          {value.companyLinks.map((l, i) => (
            <div key={`co-${i}`} className="grid gap-2 sm:grid-cols-2">
              <input
                className={inputClass}
                placeholder="Label"
                value={l.label}
                onChange={(e) => {
                  const next = [...value.companyLinks];
                  next[i] = { ...l, label: e.target.value };
                  onChange({ ...value, companyLinks: next });
                }}
              />
              <input
                className={inputClass}
                placeholder="Href"
                value={l.href}
                onChange={(e) => {
                  const next = [...value.companyLinks];
                  next[i] = { ...l, href: e.target.value };
                  onChange({ ...value, companyLinks: next });
                }}
              />
            </div>
          ))}
        </div>
      </section>

      <section className={sectionClass}>
        <h3 className="mb-4 font-semibold">Service links</h3>
        <div className="space-y-2">
          {value.serviceLinks.map((l, i) => (
            <div key={`sv-${i}`} className="grid gap-2 sm:grid-cols-2">
              <input
                className={inputClass}
                value={l.label}
                onChange={(e) => {
                  const next = [...value.serviceLinks];
                  next[i] = { ...l, label: e.target.value };
                  onChange({ ...value, serviceLinks: next });
                }}
              />
              <input
                className={inputClass}
                value={l.href}
                onChange={(e) => {
                  const next = [...value.serviceLinks];
                  next[i] = { ...l, href: e.target.value };
                  onChange({ ...value, serviceLinks: next });
                }}
              />
            </div>
          ))}
        </div>
      </section>

      <section className={sectionClass}>
        <h3 className="mb-4 font-semibold">Offices</h3>
        <p className="mb-4 text-sm text-gray-600">
          These entries power the marketing site footer &quot;{value.officesHeading || "Our Offices"}&quot; block (region, legal entity, and address lines).
        </p>
        <div className="mb-3">
          <label className={labelClass}>Offices heading</label>
          <input className={inputClass} value={value.officesHeading} onChange={(e) => onChange({ ...value, officesHeading: e.target.value })} />
        </div>
        <div className="space-y-3">
          {value.offices.map((o, i) => (
            <div key={`of-${i}`} className="grid gap-2 rounded-lg border border-gray-100 p-3 sm:grid-cols-2">
              <div>
                <label className={labelClass}>Flag</label>
                <select
                  className={inputClass}
                  value={(SITE_FOOTER_FLAG_CODES as readonly string[]).includes(o.flagCode) ? o.flagCode : "au"}
                  onChange={(e) => {
                    const next = [...value.offices];
                    const flagCode = e.target.value as (typeof o)["flagCode"];
                    next[i] = { ...o, flagCode };
                    onChange({ ...value, offices: next });
                  }}
                >
                  {SITE_FOOTER_FLAG_CODES.map((code) => (
                    <option key={code} value={code}>
                      {code.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-end justify-end sm:col-span-1">
                <button
                  type="button"
                  disabled={value.offices.length <= 1}
                  onClick={() => {
                    const next = value.offices.filter((_, j) => j !== i);
                    onChange({ ...value, offices: next.length > 0 ? next : [createEmptyOffice()] });
                  }}
                  className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Remove
                </button>
              </div>
              <div>
                <label className={labelClass}>Region</label>
                <input
                  className={inputClass}
                  value={o.region}
                  onChange={(e) => {
                    const next = [...value.offices];
                    next[i] = { ...o, region: e.target.value };
                    onChange({ ...value, offices: next });
                  }}
                />
              </div>
              <div>
                <label className={labelClass}>Entity</label>
                <input
                  className={inputClass}
                  value={o.entity}
                  onChange={(e) => {
                    const next = [...value.offices];
                    next[i] = { ...o, entity: e.target.value };
                    onChange({ ...value, offices: next });
                  }}
                />
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass}>Address</label>
                <textarea
                  className={inputClass}
                  rows={2}
                  value={o.address}
                  onChange={(e) => {
                    const next = [...value.offices];
                    next[i] = { ...o, address: e.target.value };
                    onChange({ ...value, offices: next });
                  }}
                />
              </div>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => onChange({ ...value, offices: [...value.offices, createEmptyOffice()] })}
          className="mt-3 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50"
        >
          Add office
        </button>
      </section>

      <section className={sectionClass}>
        <h3 className="mb-4 font-semibold">Contact block</h3>
        <div className="mb-3">
          <label className={labelClass}>Contact info heading</label>
          <input
            className={inputClass}
            value={value.contactInfoHeading}
            onChange={(e) => onChange({ ...value, contactInfoHeading: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          {value.contactLines.map((line, i) => (
            <div key={`cl-${i}`} className="grid gap-2 sm:grid-cols-3">
              <select
                className={inputClass}
                value={line.kind}
                onChange={(e) => {
                  const next = [...value.contactLines];
                  const kind = e.target.value as "mailto" | "tel";
                  next[i] = { kind, display: line.display, href: line.href };
                  onChange({ ...value, contactLines: next });
                }}
              >
                <option value="mailto">mailto</option>
                <option value="tel">tel</option>
              </select>
              <input
                className={inputClass}
                placeholder="Display"
                value={line.display}
                onChange={(e) => {
                  const next = [...value.contactLines];
                  next[i] = { ...line, display: e.target.value };
                  onChange({ ...value, contactLines: next });
                }}
              />
              <input
                className={inputClass}
                placeholder="Href"
                value={line.href}
                onChange={(e) => {
                  const next = [...value.contactLines];
                  next[i] = { ...line, href: e.target.value };
                  onChange({ ...value, contactLines: next });
                }}
              />
            </div>
          ))}
        </div>
        <div className="mt-4">
          <label className={labelClass}>Hours line</label>
          <input className={inputClass} value={value.hoursLine} onChange={(e) => onChange({ ...value, hoursLine: e.target.value })} />
        </div>
        <div className="mt-4">
          <label className={labelClass}>Copyright</label>
          <input className={inputClass} value={value.copyright} onChange={(e) => onChange({ ...value, copyright: e.target.value })} />
        </div>
      </section>
    </div>
  );
}
