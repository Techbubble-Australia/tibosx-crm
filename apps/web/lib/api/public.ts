import { getServerApiBaseUrl } from "@/lib/server-api";
import { resolveMediaUrl, resolveOptionalMediaUrl } from "@/lib/media-url";
import type { CaseStudyApiRecord } from "@/lib/case-study-mapper";

async function apiGet<T>(path: string): Promise<T | null> {
  try {
    const base = getServerApiBaseUrl().replace(/\/$/, "");
    const url = `${base}${path.startsWith("/") ? path : `/${path}`}`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) {
      if (process.env.NODE_ENV === "development") {
        console.warn(`[web apiGet] ${res.status} ${url}`);
      }
      return null;
    }
    return (await res.json()) as T;
  } catch (e) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[web apiGet] fetch failed:", path, e);
    }
    return null;
  }
}

export type CaseStudyListApiRow = {
  slug: string;
  title: string;
  subtitle: string;
  category: string;
  featuredImage: string;
  featured?: boolean;
  heroStat1Value: string;
  heroStat1Label: string;
  heroStat2Value: string;
  heroStat2Label: string;
  createdAt: string;
};

export async function getPublishedCaseStudies(limit = 50): Promise<CaseStudyListApiRow[]> {
  const json = await apiGet<{ data: CaseStudyListApiRow[] }>(
    `/api/case-studies?limit=${limit}&page=1`,
  );
  return json?.data ?? [];
}

export async function getCaseStudyBySlug(
  slug: string,
  previewToken?: string,
): Promise<CaseStudyApiRecord | null> {
  const q =
    previewToken && previewToken.length > 0
      ? `?preview=${encodeURIComponent(previewToken)}`
      : "";
  const json = await apiGet<{ data: CaseStudyApiRecord }>(
    `/api/case-studies/slug/${encodeURIComponent(slug)}${q}`,
  );
  return json?.data ?? null;
}

export type JobApiRow = {
  slug: string;
  title: string;
  location: string;
  country: string;
  flag: string;
  type: string;
  workMode: string;
  department: string;
};

export type JobDetailApiRow = JobApiRow & {
  description: string;
};

export async function getPublishedJobs(): Promise<JobApiRow[]> {
  const json = await apiGet<{ data: JobApiRow[] }>("/api/jobs");
  return json?.data ?? [];
}

export async function getPublishedJobBySlug(slug: string): Promise<JobDetailApiRow | null> {
  const json = await apiGet<{ data: JobDetailApiRow }>(`/api/jobs/${encodeURIComponent(slug)}`);
  return json?.data ?? null;
}

export type TestimonialApiRow = {
  quote: string;
  authorName: string;
  authorTitle: string;
  authorCompany: string;
  authorInitials: string;
  authorImageUrl: string;
};

export async function getTestimonials(): Promise<TestimonialApiRow[]> {
  const json = await apiGet<{ data: TestimonialApiRow[] }>("/api/testimonials");
  const rows = json?.data ?? [];
  return rows.map((row) => ({
    ...row,
    authorImageUrl: resolveOptionalMediaUrl(row.authorImageUrl),
  }));
}

export type FaqPublicRow = {
  question: string;
  answer: string;
};

export async function getPublishedFaqs(category?: string): Promise<FaqPublicRow[]> {
  const query = category ? `?category=${encodeURIComponent(category)}` : "";
  const json = await apiGet<{ data: { question: string; answer: string }[] }>(`/api/faqs${query}`);
  if (!json?.data) return [];
  return json.data.map((row) => ({ question: row.question, answer: row.answer }));
}

export type TeamMemberPublicRow = {
  id: string;
  name: string;
  role: string;
  department: string;
  description: string;
  imageUrl: string;
  order: number;
};

export async function getPublishedTeam(department?: string): Promise<TeamMemberPublicRow[]> {
  const query = department ? `?department=${encodeURIComponent(department)}` : "";
  const json = await apiGet<{
    data: {
      id: string;
      name: string;
      role: string;
      department: string;
      description?: string;
      imageUrl: string;
      order: number;
    }[];
  }>(`/api/team${query}`);
  const rows = json?.data ?? [];
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    role: row.role,
    department: row.department,
    description: row.description ?? "",
    order: row.order ?? 0,
    imageUrl: resolveOptionalMediaUrl(row.imageUrl),
  }));
}

/** Published members with Meet the Leadership slots 1–3 (ordered). */
export async function getPublishedLeadershipLineup(): Promise<TeamMemberPublicRow[]> {
  const json = await apiGet<{
    data: {
      id: string;
      name: string;
      role: string;
      department: string;
      description?: string;
      imageUrl: string;
      order: number;
    }[];
  }>("/api/team/leadership");
  const rows = json?.data ?? [];
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    role: row.role,
    department: row.department,
    description: row.description ?? "",
    order: row.order ?? 0,
    imageUrl: resolveOptionalMediaUrl(row.imageUrl),
  }));
}
