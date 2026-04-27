"use client";

import { inputClass, labelClass, sectionClass } from "./form-styles";

type AnnouncementPayload = {
  badge: string;
  message: string;
  linkText: string;
  linkHref: string;
};

export function AnnouncementBarForm({
  value,
  onChange,
}: {
  value: AnnouncementPayload;
  onChange: (next: AnnouncementPayload) => void;
}) {
  return (
    <div className="space-y-6">
      <section className={sectionClass}>
        <h3 className="mb-4 font-semibold">Announcement bar</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Badge</label>
            <input
              className={inputClass}
              value={value.badge}
              onChange={(e) => onChange({ ...value, badge: e.target.value })}
            />
          </div>
          <div>
            <label className={labelClass}>Link href</label>
            <input
              className={inputClass}
              value={value.linkHref}
              onChange={(e) => onChange({ ...value, linkHref: e.target.value })}
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>Message</label>
            <input
              className={inputClass}
              value={value.message}
              onChange={(e) => onChange({ ...value, message: e.target.value })}
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>Link text</label>
            <input
              className={inputClass}
              value={value.linkText}
              onChange={(e) => onChange({ ...value, linkText: e.target.value })}
            />
          </div>
        </div>
      </section>
    </div>
  );
}
