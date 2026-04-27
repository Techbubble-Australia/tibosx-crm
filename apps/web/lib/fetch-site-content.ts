import { getServerApiBaseUrl } from "@/lib/server-api";

export async function fetchSiteContentPayload<T>(key: string): Promise<T | null> {
  try {
    const res = await fetch(`${getServerApiBaseUrl()}/api/site-content/${key}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { data?: { payload?: T } };
    return json.data?.payload ?? null;
  } catch {
    return null;
  }
}
