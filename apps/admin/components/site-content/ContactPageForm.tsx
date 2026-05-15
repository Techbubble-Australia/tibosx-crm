"use client";

import { contactPagePayload } from "@site-content/defaults";
import { inputClass, labelClass, sectionClass } from "./form-styles";

export type ContactPagePayload = typeof contactPagePayload;

export function ContactPageForm({
  value,
  onChange,
}: {
  value: ContactPagePayload;
  onChange: (next: ContactPagePayload) => void;
}) {
  return (
    <div className="space-y-8">
      <section className={sectionClass}>
        <h3 className="mb-4 font-semibold">Hero</h3>
        <div className="grid gap-4">
          <div>
            <label className={labelClass}>Title</label>
            <input className={inputClass} value={value.hero.title} onChange={(e) => onChange({ ...value, hero: { ...value.hero, title: e.target.value } })} />
          </div>
          <div>
            <label className={labelClass}>Subtitle</label>
            <textarea
              className={inputClass}
              rows={3}
              value={value.hero.subtitle}
              onChange={(e) => onChange({ ...value, hero: { ...value.hero, subtitle: e.target.value } })}
            />
          </div>
        </div>
      </section>

      <section className={sectionClass}>
        <h3 className="mb-4 font-semibold">Left column</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Pill</label>
            <input className={inputClass} value={value.left.pill} onChange={(e) => onChange({ ...value, left: { ...value.left, pill: e.target.value } })} />
          </div>
          <div>
            <label className={labelClass}>Offices pill</label>
            <input
              className={inputClass}
              value={value.left.officesPill}
              onChange={(e) => onChange({ ...value, left: { ...value.left, officesPill: e.target.value } })}
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>Title</label>
            <input className={inputClass} value={value.left.title} onChange={(e) => onChange({ ...value, left: { ...value.left, title: e.target.value } })} />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>Body</label>
            <textarea className={inputClass} rows={3} value={value.left.body} onChange={(e) => onChange({ ...value, left: { ...value.left, body: e.target.value } })} />
          </div>
        </div>

        <h4 className="mb-2 mt-6 text-sm font-semibold">Channels</h4>
        <div className="space-y-3">
          {value.left.channels.map((ch, i) => (
            <div key={`ch-${i}`} className="grid gap-2 rounded-lg border border-gray-100 p-3 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className={labelClass}>Icon</label>
                <select
                  className={inputClass}
                  value={ch.icon}
                  onChange={(e) => {
                    const next = [...value.left.channels];
                    next[i] = { ...ch, icon: e.target.value as (typeof ch)["icon"] };
                    onChange({ ...value, left: { ...value.left, channels: next } });
                  }}
                >
                  <option value="mail">mail</option>
                  <option value="phone">phone</option>
                  <option value="linkedin">linkedin</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Title</label>
                <input
                  className={inputClass}
                  value={ch.title}
                  onChange={(e) => {
                    const next = [...value.left.channels];
                    next[i] = { ...ch, title: e.target.value };
                    onChange({ ...value, left: { ...value.left, channels: next } });
                  }}
                />
              </div>
              <div>
                <label className={labelClass}>Content</label>
                <input
                  className={inputClass}
                  value={ch.content}
                  onChange={(e) => {
                    const next = [...value.left.channels];
                    next[i] = { ...ch, content: e.target.value };
                    onChange({ ...value, left: { ...value.left, channels: next } });
                  }}
                />
              </div>
              <div>
                <label className={labelClass}>Href</label>
                <input
                  className={inputClass}
                  value={ch.href}
                  onChange={(e) => {
                    const next = [...value.left.channels];
                    next[i] = { ...ch, href: e.target.value };
                    onChange({ ...value, left: { ...value.left, channels: next } });
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        <h4 className="mb-2 mt-6 text-sm font-semibold">Offices</h4>
        <div className="space-y-3">
          {value.left.offices.map((o, i) => (
            <div key={`of-${i}`} className="grid gap-2 rounded-lg border border-gray-100 p-3 sm:grid-cols-3">
              <div>
                <label className={labelClass}>Flag emoji</label>
                <input
                  className={inputClass}
                  value={o.flagEmoji}
                  onChange={(e) => {
                    const next = [...value.left.offices];
                    next[i] = { ...o, flagEmoji: e.target.value };
                    onChange({ ...value, left: { ...value.left, offices: next } });
                  }}
                />
              </div>
              <div>
                <label className={labelClass}>Country</label>
                <input
                  className={inputClass}
                  value={o.country}
                  onChange={(e) => {
                    const next = [...value.left.offices];
                    next[i] = { ...o, country: e.target.value };
                    onChange({ ...value, left: { ...value.left, offices: next } });
                  }}
                />
              </div>
              <div className="sm:col-span-3">
                <label className={labelClass}>Address</label>
                <input
                  className={inputClass}
                  value={o.address}
                  onChange={(e) => {
                    const next = [...value.left.offices];
                    next[i] = { ...o, address: e.target.value };
                    onChange({ ...value, left: { ...value.left, offices: next } });
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        <h4 className="mb-2 mt-6 text-sm font-semibold">Business hours</h4>
        <div className="mb-2">
          <label className={labelClass}>Section title</label>
          <input
            className={inputClass}
            value={value.left.businessHours.title}
            onChange={(e) =>
              onChange({ ...value, left: { ...value.left, businessHours: { ...value.left.businessHours, title: e.target.value } } })
            }
          />
        </div>
        <p className="mb-2 text-xs text-gray-500">Rows: use “divider” type for a horizontal rule; otherwise label + value.</p>
        <div className="space-y-2">
          {value.left.businessHours.rows.map((row, i) => (
            <div key={`bh-${i}`} className="flex flex-wrap items-end gap-2 rounded border border-gray-100 p-2">
              <div>
                <label className={labelClass}>Type</label>
                <select
                  className={inputClass}
                  value={"divider" in row && row.divider ? "divider" : "row"}
                  onChange={(e) => {
                    const next = [...value.left.businessHours.rows];
                    if (e.target.value === "divider") {
                      next[i] = { divider: true as const };
                    } else {
                      next[i] = { label: "Label", value: "Value" };
                    }
                    onChange({ ...value, left: { ...value.left, businessHours: { ...value.left.businessHours, rows: next } } });
                  }}
                >
                  <option value="row">Label + value</option>
                  <option value="divider">Divider</option>
                </select>
              </div>
              {"divider" in row && row.divider ? null : (
                <>
                  <div className="min-w-[120px] flex-1">
                    <label className={labelClass}>Label</label>
                    <input
                      className={inputClass}
                      value={(row as { label: string }).label}
                      onChange={(e) => {
                        const next = [...value.left.businessHours.rows];
                        next[i] = { label: e.target.value, value: (row as { value: string }).value };
                        onChange({ ...value, left: { ...value.left, businessHours: { ...value.left.businessHours, rows: next } } });
                      }}
                    />
                  </div>
                  <div className="min-w-[120px] flex-1">
                    <label className={labelClass}>Value</label>
                    <input
                      className={inputClass}
                      value={(row as { value: string }).value}
                      onChange={(e) => {
                        const next = [...value.left.businessHours.rows];
                        next[i] = { label: (row as { label: string }).label, value: e.target.value };
                        onChange({ ...value, left: { ...value.left, businessHours: { ...value.left.businessHours, rows: next } } });
                      }}
                    />
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className={sectionClass}>
        <h3 className="mb-4 font-semibold">Form (placeholders + labels)</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className={labelClass}>Form title</label>
            <input className={inputClass} value={value.form.title} onChange={(e) => onChange({ ...value, form: { ...value.form, title: e.target.value } })} />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>Form subtitle</label>
            <textarea className={inputClass} rows={2} value={value.form.subtitle} onChange={(e) => onChange({ ...value, form: { ...value.form, subtitle: e.target.value } })} />
          </div>
          {(
            [
              ["firstName", "First name placeholder"],
              ["lastName", "Last name"],
              ["email", "Email"],
              ["phone", "Phone"],
              ["company", "Company"],
              ["lookingFor", "Looking for"],
              ["region", "Region"],
              ["message", "Message"],
            ] as const
          ).map(([k, lbl]) => (
            <div key={k}>
              <label className={labelClass}>{lbl}</label>
              <input
                className={inputClass}
                value={value.form.placeholders[k]}
                onChange={(e) =>
                  onChange({ ...value, form: { ...value.form, placeholders: { ...value.form.placeholders, [k]: e.target.value } } })
                }
              />
            </div>
          ))}
          <div>
            <label className={labelClass}>Submit label</label>
            <input
              className={inputClass}
              value={value.form.submitLabel}
              onChange={(e) => onChange({ ...value, form: { ...value.form, submitLabel: e.target.value } })}
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>Footer note</label>
            <textarea className={inputClass} rows={2} value={value.form.footerNote} onChange={(e) => onChange({ ...value, form: { ...value.form, footerNote: e.target.value } })} />
          </div>
        </div>
      </section>

      <section className={sectionClass}>
        <h3 className="mb-4 font-semibold">Talent CTA strip</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className={labelClass}>Title</label>
            <input className={inputClass} value={value.talentCta.title} onChange={(e) => onChange({ ...value, talentCta: { ...value.talentCta, title: e.target.value } })} />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>Body</label>
            <textarea className={inputClass} rows={3} value={value.talentCta.body} onChange={(e) => onChange({ ...value, talentCta: { ...value.talentCta, body: e.target.value } })} />
          </div>
          <div>
            <label className={labelClass}>Email CTA label</label>
            <input
              className={inputClass}
              value={value.talentCta.emailCtaLabel}
              onChange={(e) => onChange({ ...value, talentCta: { ...value.talentCta, emailCtaLabel: e.target.value } })}
            />
          </div>
          <div>
            <label className={labelClass}>Email href</label>
            <input
              className={inputClass}
              value={value.talentCta.emailHref}
              onChange={(e) => onChange({ ...value, talentCta: { ...value.talentCta, emailHref: e.target.value } })}
            />
          </div>
          <div>
            <label className={labelClass}>Phone CTA label</label>
            <input
              className={inputClass}
              value={value.talentCta.phoneCtaLabel}
              onChange={(e) => onChange({ ...value, talentCta: { ...value.talentCta, phoneCtaLabel: e.target.value } })}
            />
          </div>
          <div>
            <label className={labelClass}>Phone href</label>
            <input
              className={inputClass}
              value={value.talentCta.phoneHref}
              onChange={(e) => onChange({ ...value, talentCta: { ...value.talentCta, phoneHref: e.target.value } })}
            />
          </div>
        </div>
      </section>
    </div>
  );
}
