import { getServerApiBaseUrl } from "@/lib/server-api";
import { sanitizeMuleSoftInValue } from "@/lib/sanitize-mulesoft";

export async function fetchSiteContentPayload<T>(key: string): Promise<T | null> {
  try {
    const res = await fetch(`${getServerApiBaseUrl()}/api/site-content/${key}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { data?: { payload?: T } };
    const payload = json.data?.payload;
    if (payload == null) return null;
    return sanitizeMuleSoftInValue(payload) as T;
  } catch {
    return null;
  }
}
