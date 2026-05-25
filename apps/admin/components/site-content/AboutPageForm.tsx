"use client";

import { useEffect, useMemo, useState } from "react";
import { AdminImageField } from "@/components/AdminImageField";
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
type WorkforceTab = { department: string; active: boolean };

type AdminTeamListRow = {
  id: string;
  department?: string;
  published?: boolean;
};
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

export function AboutPageForm({
  value,
  onChange,
}: {
  value: AboutPagePayload;
  onChange: (next: AboutPagePayload) => void;
}) {
  const [tab, setTab] = useState(0);
  const [teamRows, setTeamRows] = useState<AdminTeamListRow[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await adminFetch("/api/admin/team/admin/all");
        const data = (await res.json()) as { data?: AdminTeamListRow[] };
        if (!cancelled && Array.isArray(data.data)) setTeamRows(data.data);
      } catch (e) {
        console.error("AboutPageForm: failed to load team for department counts", e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const { publishedDeptCountsByLower, publishedDepartmentSuggestions } = useMemo(() => {
    const byLower = new Map<string, number>();
    const suggest = new Set<string>();
    for (const row of teamRows) {
      if (!row.published) continue;
      const raw = String(row.department ?? "").trim();
      const d = raw || "Team";
      const k = d.toLowerCase();
      byLower.set(k, (byLower.get(k) ?? 0) + 1);
      if (raw) suggest.add(raw);
    }
    return {
      publishedDeptCountsByLower: byLower,
      publishedDepartmentSuggestions: [...suggest].sort((a, b) => a.localeCompare(b)),
    };
  }, [teamRows]);

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

  const setWorkforceStat = (i: number, patch: Partial<{ n: string; l: string }>) => {
    const stats = value.workforce.stats.map((s, j) => (j === i ? { ...s, ...patch } : s));
    onChange({ ...value, workforce: { ...value.workforce, stats } });
  };

  const setWorkforceTab = (i: number, patch: Partial<WorkforceTab>) => {
    const tabs = value.workforce.tabs.map((t, j) => (j === i ? { ...t, ...patch } : t));
    onChange({ ...value, workforce: { ...value.workforce, tabs } });
  };

  const addWorkforceTab = () => {
    onChange({
      ...value,
      workforce: {
        ...value.workforce,
        tabs: [...value.workforce.tabs, { department: "", active: false }],
      },
    });
  };

  const removeWorkforceTab = (i: number) => {
    onChange({
      ...value,
      workforce: {
        ...value.workforce,
        tabs: value.workforce.tabs.filter((_, j) => j !== i),
      },
    });
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
          <p className="mb-4 text-sm text-gray-600">
            The three cards under <strong>Meet the Leadership</strong> on the marketing site come from <strong>Admin → Team</strong>:
            publish members and set leadership slots <strong>1</strong>, <strong>2</strong>, and <strong>3</strong>. Copy below only changes the section heading.
          </p>
          <div className="space-y-3">
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
            <h3 className="mb-2 font-semibold text-gray-900 dark:text-zinc-100">Department tabs (workforce pills)</h3>
            <p className="mb-4 text-xs leading-relaxed text-gray-600 dark:text-zinc-400">
              Each row should match <strong>Admin → Team</strong> → member <strong>Department</strong> (case-insensitive exact match, or
              close spelling for minor typos). The marketing site only lists departments that have published members, but the{" "}
              <strong>pill title</strong> uses the text you enter here when it maps to that department. Turn on <strong>Active</strong>{" "}
              to pin matching departments earlier; inactive rows are ignored. Unmatched active rows do not create a pill.
              Remaining departments follow alphabetically.
            </p>
            <datalist id="about-workforce-department-suggestions">
              {publishedDepartmentSuggestions.map((d) => (
                <option key={d} value={d} />
              ))}
            </datalist>
            <div className="space-y-4">
              {value.workforce.tabs.length === 0 ? (
                <p className="rounded-lg border border-dashed border-gray-200 bg-gray-50/80 px-4 py-6 text-center text-sm text-gray-600 dark:border-zinc-600 dark:bg-zinc-900/40 dark:text-zinc-400">
                  No rows yet — the site lists every published department in alphabetical order. Use{" "}
                  <span className="font-medium">Add department tab</span> to control order and which departments are pinned first.
                </p>
              ) : null}
              {value.workforce.tabs.map((t, i) => {
                const dTrim = t.department.trim();
                const count = dTrim ? (publishedDeptCountsByLower.get(dTrim.toLowerCase()) ?? 0) : 0;
                const preview = dTrim ? `${dTrim} (${count})` : "—";
                return (
                  <div
                    key={i}
                    className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-zinc-600 dark:bg-zinc-900/50"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between lg:gap-6">
                      <div className="min-w-0 flex-1 space-y-2">
                        <label className={labelClass}>Department (exact match)</label>
                        <input
                          className={`${inputClass} w-full`}
                          list="about-workforce-department-suggestions"
                          value={t.department}
                          onChange={(e) => setWorkforceTab(i, { department: e.target.value })}
                          placeholder="e.g. Management Team"
                        />
                        <p className="text-xs text-gray-500 dark:text-zinc-400">
                          Site pill: <span className="font-medium text-gray-800 dark:text-zinc-200">{preview}</span>
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-4 border-t border-gray-100 pt-4 dark:border-zinc-700 lg:border-t-0 lg:pt-0">
                        <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-gray-800 dark:text-zinc-200">
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-500 dark:border-zinc-500 dark:bg-zinc-800"
                            checked={t.active}
                            onChange={(e) => setWorkforceTab(i, { active: e.target.checked })}
                          />
                          Active
                        </label>
                        <span className="text-sm tabular-nums text-gray-600 dark:text-zinc-400">
                          Published: <strong className="text-gray-900 dark:text-zinc-100">{count}</strong>
                        </span>
                        <button
                          type="button"
                          className="rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-50 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-950/50 lg:ml-2"
                          onClick={() => removeWorkforceTab(i)}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <button
              type="button"
              className="mt-4 inline-flex w-full items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50/50 px-4 py-3 text-sm font-medium text-gray-800 transition-colors hover:border-gray-400 hover:bg-gray-100 dark:border-zinc-600 dark:bg-zinc-900/30 dark:text-zinc-200 dark:hover:border-zinc-500 dark:hover:bg-zinc-800/50 sm:w-auto"
              onClick={addWorkforceTab}
            >
              + Add department tab
            </button>
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
                <AdminImageField
                  name={`about-mgmt-image-${i}`}
                  label="Image URL (optional)"
                  value={p.imageUrl}
                  onValueChange={(v) => setMgmtPerson(i, { imageUrl: v })}
                  className={inputClass}
                  labelClassName={labelClass}
                  helpText="Paste a URL or upload. If set, this overrides the bundled image key."
                />
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
