"use client";

import { useEffect, useState } from "react";
import { adminFetch } from "@/lib/admin-api";
import { inputClass, labelClass, sectionClass } from "./form-styles";

/** Must match keys in `apps/web/lib/about-bundled-media.ts`. */
const ABOUT_BUNDLED_IMAGE_KEYS = [
  "about_us_1",
  "about_us_2",
  "about_us_3",
  "about_us_4",
  "about_us_5",
  "about_us_6",
  "about_us_7",
  "about_us_8",
  "about_us_9",
  "about_us_10",
  "about_us_11",
] as const;

type StatRow = { n: string; l: string; labelClass: string };
type MissionCard = { title: string; text: string };
type LeadershipMember = { name: string; role: string; bio: string; imageKey: string; imageUrl: string };
type WorkforceTab = { label: string; widthPx: number; active: boolean };
type ManagementPerson = { name: string; role: string; bio?: string; imageKey: string; imageUrl: string };
type UspColumn = { title: string; body: string };
type ValuePillar = { title: string; subtitle: string };
type Metric = { n: string; l: string };

export type AboutPagePayload = {
  hero: { titleLine1: string; titleLine2: string; subtitle: string };
  mission: { eyebrow: string; title: string; body: string; ctaLabel: string; ctaHref: string };
  statsStrip: StatRow[];
  missionCards: MissionCard[];
  leadership: {
    pill: string;
    title: string;
    subtitle: string;
    featuredTeamMemberIds: [string, string, string];
    members: LeadershipMember[];
  };
  workforce: {
    pill: string;
    title: string;
    intro: string;
    defaultMemberBio: string;
    stats: { n: string; l: string }[];
    tabs: WorkforceTab[];
    management: { title: string; memberCountLabel: string; people: ManagementPerson[] };
  };
  usp: { pill: string; title: string; subtitle: string; columns: UspColumn[] };
  values: {
    pill: string;
    title: string;
    introLeadBold: string;
    introRest: string;
    pillars: ValuePillar[];
    missionCard: { title: string; body: string; metrics: Metric[] };
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

const TABS = [
  "Hero & stats",
  "Mission",
  "Leadership",
  "Workforce",
  "USP",
  "Values & footer CTA",
] as const;

function SiteImageUrlField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const [uploading, setUploading] = useState(false);

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("image", file);
      const res = await adminFetch("/api/upload/image", {
        method: "POST",
        body: fd,
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string; data?: { url?: string } };
      if (!res.ok) {
        alert(json.error || "Upload failed");
        return;
      }
      const next = json.data?.url;
      if (next) onChange(next);
    } catch (err) {
      console.error(err);
      alert("Upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  return (
    <div>
      <label className={labelClass}>{label}</label>
      <p className="mb-1 text-xs text-gray-500">Paste a URL or upload. If set, this overrides the bundled image key.</p>
      <input className={inputClass} value={value} onChange={(e) => onChange(e.target.value)} placeholder="https://… or /uploads/…" />
      <div className="mt-2 flex items-center gap-2">
        <input type="file" accept="image/jpeg,image/png,image/gif,image/webp" onChange={(e) => void onFileChange(e)} className="text-sm" />
        {uploading ? <span className="text-xs text-gray-500">Uploading…</span> : null}
      </div>
    </div>
  );
}

export function AboutPageForm({
  value,
  onChange,
}: {
  value: AboutPagePayload;
  onChange: (next: AboutPagePayload) => void;
}) {
  const [tab, setTab] = useState(0);

  const [teamPickList, setTeamPickList] = useState<{ id: string; label: string }[]>([]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await adminFetch("/api/admin/team/admin/all");
        const json = await res.json();
        if (cancelled || !res.ok) return;
        const rows = (json.data || []) as { id: string; name: string; department: string; published: boolean }[];
        setTeamPickList(
          rows
            .filter((r) => r.published)
            .map((r) => ({ id: r.id, label: `${r.name} — ${r.department}` })),
        );
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const setHero = (patch: Partial<AboutPagePayload["hero"]>) => onChange({ ...value, hero: { ...value.hero, ...patch } });
  const setMission = (patch: Partial<AboutPagePayload["mission"]>) =>
    onChange({ ...value, mission: { ...value.mission, ...patch } });
  const setLeadership = (patch: Partial<AboutPagePayload["leadership"]>) =>
    onChange({ ...value, leadership: { ...value.leadership, ...patch } });
  const setWorkforce = (patch: Partial<AboutPagePayload["workforce"]>) =>
    onChange({ ...value, workforce: { ...value.workforce, ...patch } });
  const setUsp = (patch: Partial<AboutPagePayload["usp"]>) => onChange({ ...value, usp: { ...value.usp, ...patch } });
  const setValues = (patch: Partial<AboutPagePayload["values"]>) =>
    onChange({ ...value, values: { ...value.values, ...patch } });
  const setClosing = (patch: Partial<AboutPagePayload["closingCta"]>) =>
    onChange({ ...value, closingCta: { ...value.closingCta, ...patch } });

  const setStat = (i: number, patch: Partial<StatRow>) => {
    const statsStrip = value.statsStrip.map((s, j) => (j === i ? { ...s, ...patch } : s));
    onChange({ ...value, statsStrip });
  };

  const setCard = (i: number, patch: Partial<MissionCard>) => {
    const missionCards = value.missionCards.map((c, j) => (j === i ? { ...c, ...patch } : c));
    onChange({ ...value, missionCards });
  };

  const setLeader = (i: number, patch: Partial<LeadershipMember>) => {
    const members = value.leadership.members.map((m, j) => (j === i ? { ...m, ...patch } : m));
    onChange({ ...value, leadership: { ...value.leadership, members } });
  };

  const setFeaturedTeamMemberId = (index: 0 | 1 | 2, id: string) => {
    const cur = value.leadership.featuredTeamMemberIds ?? ["", "", ""];
    const next: [string, string, string] = [...cur] as [string, string, string];
    next[index] = id;
    onChange({ ...value, leadership: { ...value.leadership, featuredTeamMemberIds: next } });
  };

  const setWorkforceStat = (i: number, patch: Partial<{ n: string; l: string }>) => {
    const stats = value.workforce.stats.map((s, j) => (j === i ? { ...s, ...patch } : s));
    onChange({ ...value, workforce: { ...value.workforce, stats } });
  };

  const setWorkforceTab = (i: number, patch: Partial<WorkforceTab>) => {
    const tabs = value.workforce.tabs.map((t, j) => (j === i ? { ...t, ...patch } : t));
    onChange({ ...value, workforce: { ...value.workforce, tabs } });
  };

  const setMgmtPerson = (i: number, patch: Partial<ManagementPerson>) => {
    const people = value.workforce.management.people.map((p, j) => (j === i ? { ...p, ...patch } : p));
    onChange({
      ...value,
      workforce: { ...value.workforce, management: { ...value.workforce.management, people } },
    });
  };

  const setUspCol = (i: number, patch: Partial<UspColumn>) => {
    const columns = value.usp.columns.map((c, j) => (j === i ? { ...c, ...patch } : c));
    onChange({ ...value, usp: { ...value.usp, columns } });
  };

  const setPillar = (i: number, patch: Partial<ValuePillar>) => {
    const pillars = value.values.pillars.map((p, j) => (j === i ? { ...p, ...patch } : p));
    onChange({ ...value, values: { ...value.values, pillars } });
  };

  const setMetric = (i: number, patch: Partial<Metric>) => {
    const metrics = value.values.missionCard.metrics.map((m, j) => (j === i ? { ...m, ...patch } : m));
    onChange({
      ...value,
      values: {
        ...value.values,
        missionCard: { ...value.values.missionCard, metrics },
      },
    });
  };

  const bundledKeyOptions = ABOUT_BUNDLED_IMAGE_KEYS;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-3">
        {TABS.map((t, i) => (
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

      {tab === 0 ? (
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
            <h3 className="mb-4 font-semibold">Stats strip (floating card)</h3>
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
        </div>
      ) : null}

      {tab === 1 ? (
        <div className="space-y-6">
          <section className={sectionClass}>
            <h3 className="mb-4 font-semibold">Mission (left column)</h3>
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
              <div>
                <label className={labelClass}>CTA label</label>
                <input className={inputClass} value={value.mission.ctaLabel} onChange={(e) => setMission({ ctaLabel: e.target.value })} />
              </div>
              <div>
                <label className={labelClass}>CTA href</label>
                <input className={inputClass} value={value.mission.ctaHref} onChange={(e) => setMission({ ctaHref: e.target.value })} />
              </div>
            </div>
          </section>

          <section className={sectionClass}>
            <h3 className="mb-4 font-semibold">Mission cards (scroll list)</h3>
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
      ) : null}

      {tab === 2 ? (
        <section className={sectionClass}>
          <h3 className="mb-4 font-semibold">Leadership</h3>
          <div className="mb-4 space-y-3">
            <div>
              <label className={labelClass}>Section pill</label>
              <input className={inputClass} value={value.leadership.pill} onChange={(e) => setLeadership({ pill: e.target.value })} />
            </div>
            <div>
              <label className={labelClass}>Title</label>
              <input className={inputClass} value={value.leadership.title} onChange={(e) => setLeadership({ title: e.target.value })} />
            </div>
            <div>
              <label className={labelClass}>Subtitle</label>
              <textarea className={inputClass} rows={2} value={value.leadership.subtitle} onChange={(e) => setLeadership({ subtitle: e.target.value })} />
            </div>
          </div>

          <div className="mb-6 rounded-lg border border-gray-200 bg-gray-50 p-4">
            <h4 className="mb-2 text-sm font-semibold text-gray-900">Meet the Leadership — team picks (marketing site)</h4>
            <p className="mb-3 text-xs text-gray-600">
              Choose three <strong>published</strong> team members (left → right). Name, role, photo, and description come from Admin → Team. Bio falls back to
              the CMS card below if the team member has no description. Leave any slot empty to show all three CMS cards instead.
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              {([0, 1, 2] as const).map((slot) => (
                <div key={slot}>
                  <label className={labelClass}>Profile {slot + 1}</label>
                  <select
                    className={inputClass}
                    value={(value.leadership.featuredTeamMemberIds ?? ["", "", ""])[slot]}
                    onChange={(e) => setFeaturedTeamMemberId(slot, e.target.value)}
                  >
                    <option value="">— CMS card {slot + 1} only —</option>
                    {teamPickList.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>

          <p className="mb-3 text-xs text-gray-600">
            CMS cards below: used when team picks are incomplete, or as fallback text/image when a picked member has no description or photo URL.
          </p>
          <div className="space-y-6">
            {value.leadership.members.map((m, i) => (
              <div key={i} className="rounded-lg border border-gray-200 p-4">
                <p className="mb-3 text-sm font-semibold text-gray-800">Leader {i + 1}</p>
                <div className="space-y-2">
                  <div>
                    <label className={labelClass}>Name</label>
                    <input className={inputClass} value={m.name} onChange={(e) => setLeader(i, { name: e.target.value })} />
                  </div>
                  <div>
                    <label className={labelClass}>Role</label>
                    <input className={inputClass} value={m.role} onChange={(e) => setLeader(i, { role: e.target.value })} />
                  </div>
                  <div>
                    <label className={labelClass}>Bio</label>
                    <textarea className={inputClass} rows={4} value={m.bio} onChange={(e) => setLeader(i, { bio: e.target.value })} />
                  </div>
                  <div>
                    <label className={labelClass}>Bundled image key</label>
                    <select
                      className={inputClass}
                      value={m.imageKey}
                      onChange={(e) => setLeader(i, { imageKey: e.target.value })}
                    >
                      <option value="">— none —</option>
                      {bundledKeyOptions.map((k) => (
                        <option key={k} value={k}>
                          {k}
                        </option>
                      ))}
                    </select>
                  </div>
                  <SiteImageUrlField label="Image URL (optional override)" value={m.imageUrl} onChange={(v) => setLeader(i, { imageUrl: v })} />
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {tab === 3 ? (
        <div className="space-y-6">
          <section className={sectionClass}>
            <h3 className="mb-4 font-semibold">Workforce — header</h3>
            <div className="space-y-3">
              <input className={inputClass} value={value.workforce.pill} onChange={(e) => setWorkforce({ pill: e.target.value })} placeholder="Pill" />
              <input className={inputClass} value={value.workforce.title} onChange={(e) => setWorkforce({ title: e.target.value })} placeholder="Title" />
              <textarea className={inputClass} rows={3} value={value.workforce.intro} onChange={(e) => setWorkforce({ intro: e.target.value })} placeholder="Intro" />
              <div>
                <label className={labelClass}>Default member bio (API)</label>
                <p className="mb-1 text-xs text-gray-500">
                  Shown when a published team member has no Admin description. Use name-specific text under Management team below when possible.
                </p>
                <textarea
                  className={inputClass}
                  rows={2}
                  value={value.workforce.defaultMemberBio}
                  onChange={(e) => setWorkforce({ defaultMemberBio: e.target.value })}
                />
              </div>
            </div>
          </section>

          <section className={sectionClass}>
            <h3 className="mb-4 font-semibold">Workforce — stat bar (animated)</h3>
            <div className="space-y-3">
              {value.workforce.stats.map((s, i) => (
                <div key={i} className="grid gap-2 sm:grid-cols-2">
                  <input className={inputClass} value={s.n} onChange={(e) => setWorkforceStat(i, { n: e.target.value })} placeholder="Value" />
                  <input className={inputClass} value={s.l} onChange={(e) => setWorkforceStat(i, { l: e.target.value })} placeholder="Label" />
                </div>
              ))}
            </div>
          </section>

          <section className={sectionClass}>
            <h3 className="mb-4 font-semibold">Department tabs (fallback / legacy)</h3>
            <p className="mb-3 text-xs text-gray-600">
              When the marketing site has no published team from the API, the About page shows the Management team block only (no pills). With API data, department pills are generated from member departments.
            </p>
            <div className="space-y-3">
              {value.workforce.tabs.map((t, i) => (
                <div key={i} className="grid gap-2 rounded border border-gray-100 p-2 sm:grid-cols-3">
                  <input className={inputClass} value={t.label} onChange={(e) => setWorkforceTab(i, { label: e.target.value })} />
                  <input
                    className={inputClass}
                    type="number"
                    value={t.widthPx}
                    onChange={(e) => setWorkforceTab(i, { widthPx: Number(e.target.value) })}
                    placeholder="Width px"
                  />
                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input type="checkbox" checked={t.active} onChange={(e) => setWorkforceTab(i, { active: e.target.checked })} />
                    Active (dark) style
                  </label>
                </div>
              ))}
            </div>
          </section>

          <section className={sectionClass}>
            <h3 className="mb-4 font-semibold">Management team</h3>
            <div className="mb-3 space-y-2">
              <input
                className={inputClass}
                value={value.workforce.management.title}
                onChange={(e) =>
                  setWorkforce({ management: { ...value.workforce.management, title: e.target.value } })
                }
                placeholder="Section title"
              />
              <input
                className={inputClass}
                value={value.workforce.management.memberCountLabel}
                onChange={(e) =>
                  setWorkforce({ management: { ...value.workforce.management, memberCountLabel: e.target.value } })
                }
                placeholder="e.g. 5 members"
              />
            </div>
            {value.workforce.management.people.map((p, i) => (
              <div key={i} className="mb-4 rounded-lg border border-gray-100 p-3">
                <p className="mb-2 text-sm font-medium">Person {i + 1}</p>
                <input className={inputClass} value={p.name} onChange={(e) => setMgmtPerson(i, { name: e.target.value })} placeholder="Name" />
                <input className={`${inputClass} mt-2`} value={p.role} onChange={(e) => setMgmtPerson(i, { role: e.target.value })} placeholder="Role" />
                <label className={`${labelClass} mt-2`}>Placeholder bio (when API description empty, matched by name)</label>
                <textarea
                  className={inputClass}
                  rows={2}
                  value={p.bio ?? ""}
                  onChange={(e) => setMgmtPerson(i, { bio: e.target.value })}
                  placeholder="Optional CMS fallback bio"
                />
                <label className={`${labelClass} mt-2`}>Bundled image key</label>
                <select className={inputClass} value={p.imageKey} onChange={(e) => setMgmtPerson(i, { imageKey: e.target.value })}>
                  <option value="">— none —</option>
                  {bundledKeyOptions.map((k) => (
                    <option key={k} value={k}>
                      {k}
                    </option>
                  ))}
                </select>
                <div className="mt-2">
                  <SiteImageUrlField label="Image URL (optional)" value={p.imageUrl} onChange={(v) => setMgmtPerson(i, { imageUrl: v })} />
                </div>
              </div>
            ))}
          </section>
        </div>
      ) : null}

      {tab === 4 ? (
        <section className={sectionClass}>
          <h3 className="mb-4 font-semibold">Unique selling points</h3>
          <div className="mb-4 space-y-2">
            <input className={inputClass} value={value.usp.pill} onChange={(e) => setUsp({ pill: e.target.value })} placeholder="Pill" />
            <input className={inputClass} value={value.usp.title} onChange={(e) => setUsp({ title: e.target.value })} placeholder="Title" />
            <textarea className={inputClass} rows={2} value={value.usp.subtitle} onChange={(e) => setUsp({ subtitle: e.target.value })} placeholder="Subtitle" />
          </div>
          {value.usp.columns.map((col, i) => (
            <div key={i} className="mb-4 space-y-2 rounded-lg border border-gray-100 p-3">
              <p className="text-sm font-semibold">Column {i + 1}</p>
              <input className={inputClass} value={col.title} onChange={(e) => setUspCol(i, { title: e.target.value })} />
              <textarea className={inputClass} rows={5} value={col.body} onChange={(e) => setUspCol(i, { body: e.target.value })} />
            </div>
          ))}
        </section>
      ) : null}

      {tab === 5 ? (
        <div className="space-y-6">
          <section className={sectionClass}>
            <h3 className="mb-4 font-semibold">Values — left column</h3>
            <div className="space-y-2">
              <input className={inputClass} value={value.values.pill} onChange={(e) => setValues({ pill: e.target.value })} />
              <input className={inputClass} value={value.values.title} onChange={(e) => setValues({ title: e.target.value })} />
              <input className={inputClass} value={value.values.introLeadBold} onChange={(e) => setValues({ introLeadBold: e.target.value })} placeholder="Bold lead (e.g. At TechBubble,)" />
              <textarea className={inputClass} rows={3} value={value.values.introRest} onChange={(e) => setValues({ introRest: e.target.value })} placeholder="Rest of intro paragraph" />
            </div>
            <div className="mt-4 space-y-3">
              {value.values.pillars.map((p, i) => (
                <div key={i} className="rounded border border-gray-100 p-2">
                  <input className={inputClass} value={p.title} onChange={(e) => setPillar(i, { title: e.target.value })} placeholder="Title" />
                  <input className={`${inputClass} mt-2`} value={p.subtitle} onChange={(e) => setPillar(i, { subtitle: e.target.value })} placeholder="Subtitle" />
                </div>
              ))}
            </div>
          </section>

          <section className={sectionClass}>
            <h3 className="mb-4 font-semibold">Values — mission card (right)</h3>
            <input
              className={inputClass}
              value={value.values.missionCard.title}
              onChange={(e) =>
                setValues({ missionCard: { ...value.values.missionCard, title: e.target.value } })
              }
            />
            <textarea
              className={`${inputClass} mt-2`}
              rows={4}
              value={value.values.missionCard.body}
              onChange={(e) =>
                setValues({ missionCard: { ...value.values.missionCard, body: e.target.value } })
              }
            />
            <p className="mt-3 text-sm font-medium text-gray-700">Metrics (animated)</p>
            {value.values.missionCard.metrics.map((m, i) => (
              <div key={i} className="mt-2 grid gap-2 sm:grid-cols-2">
                <input className={inputClass} value={m.n} onChange={(e) => setMetric(i, { n: e.target.value })} />
                <input className={inputClass} value={m.l} onChange={(e) => setMetric(i, { l: e.target.value })} />
              </div>
            ))}
          </section>

          <section className={sectionClass}>
            <h3 className="mb-4 font-semibold">Footer CTA (above global footer)</h3>
            <div className="space-y-2">
              <input className={inputClass} value={value.closingCta.title} onChange={(e) => setClosing({ title: e.target.value })} />
              <textarea className={inputClass} rows={2} value={value.closingCta.description} onChange={(e) => setClosing({ description: e.target.value })} />
              <input className={inputClass} value={value.closingCta.primaryLabel} onChange={(e) => setClosing({ primaryLabel: e.target.value })} />
              <input className={inputClass} value={value.closingCta.primaryHref} onChange={(e) => setClosing({ primaryHref: e.target.value })} />
              <input className={inputClass} value={value.closingCta.secondaryLabel} onChange={(e) => setClosing({ secondaryLabel: e.target.value })} />
              <input className={inputClass} value={value.closingCta.secondaryHref} onChange={(e) => setClosing({ secondaryHref: e.target.value })} />
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}
