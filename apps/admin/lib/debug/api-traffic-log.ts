export type RecentApiTrafficEntry = {
  id: string;
  endpoint: string;
  method: string;
  status: number | null;
  latencyMs: number;
  payloadCaptured: unknown;
  capturedAt: number;
};

export type TrafficInferenceReason = "element_text" | "list_context" | "recent_request";

export type TrafficInferenceResult = {
  entry: RecentApiTrafficEntry;
  reason: TrafficInferenceReason;
};

const MAX_ENTRIES = 40;
const MAX_JSON_CHARS = 80_000;

const SKIP_URL_PARTS = [
  "/api/auth/session",
  "/api/auth/me",
  "/api/upload/",
  "/api/admin/debug-capture-tickets",
];

let entries: RecentApiTrafficEntry[] = [];

function isDevClientLoggingEnabled(): boolean {
  if (typeof window === "undefined") return false;
  const env = (process.env.NEXT_PUBLIC_TBOS_ENV ?? "").trim().toLowerCase();
  return env !== "production";
}

function shouldSkipUrl(url: string): boolean {
  const path = url.replace(/^https?:\/\/[^/]+/i, "");
  return SKIP_URL_PARTS.some((part) => path.includes(part));
}

function truncatePayload(value: unknown): unknown {
  const raw = JSON.stringify(value ?? null);
  if (raw.length <= MAX_JSON_CHARS) return value;
  return { _truncated: true, preview: raw.slice(0, MAX_JSON_CHARS) };
}

function looksLikeListPayload(payload: unknown): boolean {
  if (Array.isArray(payload)) return true;
  if (!payload || typeof payload !== "object") return false;
  const obj = payload as Record<string, unknown>;
  if (Array.isArray(obj.data)) return true;
  if (Array.isArray(obj.items)) return true;
  if (Array.isArray(obj.results)) return true;
  if (obj.data && typeof obj.data === "object" && !Array.isArray(obj.data)) {
    const inner = obj.data as Record<string, unknown>;
    if (Array.isArray(inner.items)) return true;
    if (Array.isArray(inner.rows)) return true;
  }
  return false;
}

function normalizeEndpoint(url: string): string {
  try {
    if (url.startsWith("http://") || url.startsWith("https://")) {
      const u = new URL(url);
      return `${u.pathname}${u.search}`;
    }
  } catch {
    /* fall through */
  }
  return url.startsWith("/") ? url : `/${url}`;
}

function payloadHaystack(payload: unknown): string {
  try {
    return JSON.stringify(payload ?? null).toLowerCase();
  } catch {
    return "";
  }
}

function isInListUi(el: Element): boolean {
  return Boolean(
    el.closest(
      'table, [role="table"], [role="grid"], tbody, thead, tr, [role="row"], ul, ol, [role="list"], [data-api-endpoint]',
    ),
  );
}

/** Text / ids from the clicked element and nearby labels — used to match API JSON. */
function collectMatchTokens(el: Element): string[] {
  const seen = new Set<string>();
  const tokens: string[] = [];
  const push = (raw: string | null | undefined, minLen = 3) => {
    const t = (raw ?? "").replace(/\s+/g, " ").trim();
    if (!t || t.length < minLen || t.length > 200 || seen.has(t)) return;
    seen.add(t);
    tokens.push(t);
  };

  push(el.getAttribute("data-id"), 1);
  push(el.getAttribute("id"), 1);
  push(el.getAttribute("value"), 1);
  push(el.getAttribute("aria-label"));
  push(el.getAttribute("title"));
  push(el.getAttribute("alt"));

  if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
    push(el.value);
  }
  if (el instanceof HTMLSelectElement && el.selectedOptions[0]) {
    push(el.selectedOptions[0].textContent);
    push(el.value, 1);
  }
  if (el instanceof HTMLAnchorElement) {
    push(el.textContent);
    push(el.pathname + el.search, 1);
  }

  const ownText = (el as HTMLElement).innerText?.replace(/\s+/g, " ").trim() ?? "";
  if (ownText.length <= 400) {
    push(ownText);
  } else {
    push(ownText.slice(0, 160));
  }

  for (const word of ownText.split(/\s+/).filter((w) => w.length >= 4).slice(0, 10)) {
    push(word);
  }

  let parent: Element | null = el.parentElement;
  for (let depth = 0; parent && depth < 8; depth++, parent = parent.parentElement) {
    const header = parent.querySelector(
      ":scope > h1, :scope > h2, :scope > h3, :scope > h4, :scope > legend, :scope > label",
    );
    if (header) push(header.textContent);
    if (parent instanceof HTMLElement && parent.dataset) {
      for (const [key, val] of Object.entries(parent.dataset)) {
        if (key.toLowerCase().includes("id") && val) push(val, 1);
      }
    }
  }

  return tokens;
}

function scoreEntry(
  entry: RecentApiTrafficEntry,
  tokens: string[],
  inListUi: boolean,
  recencyIndex: number,
): number {
  let score = Math.max(0, 12 - recencyIndex);
  const hay = payloadHaystack(entry.payloadCaptured);

  for (const token of tokens) {
    const needle = token.toLowerCase();
    if (needle.length < 2) continue;
    if (hay.includes(needle)) {
      score += Math.min(needle.length, 36);
      if (needle.length >= 8) score += 8;
    }
  }

  if (inListUi && looksLikeListPayload(entry.payloadCaptured)) {
    score += 10;
  }

  if (entry.method === "GET") score += 4;

  const size = hay.length;
  if (size > 40 && size < 500_000) score += 2;

  return score;
}

function successfulEntries(): RecentApiTrafficEntry[] {
  return entries.filter((e) => e.status !== null && e.status >= 200 && e.status < 300);
}

/**
 * Match clicked UI to a recent `adminFetch` response (any element, not only tables).
 */
export function inferApiPrerequisiteFromTraffic(el: Element): TrafficInferenceResult | null {
  const recent = successfulEntries();
  if (!recent.length) return null;

  const tokens = collectMatchTokens(el);
  const inListUi = isInListUi(el);

  let best: { entry: RecentApiTrafficEntry; score: number; index: number } | null = null;
  for (let index = 0; index < recent.length; index++) {
    const entry = recent[index]!;
    const score = scoreEntry(entry, tokens, inListUi, index);
    if (!best || score > best.score) {
      best = { entry, score, index };
    }
  }

  if (!best) return null;

  const hasTextMatch =
    tokens.length > 0 &&
    tokens.some((token) => {
      const needle = token.toLowerCase();
      return needle.length >= 3 && payloadHaystack(best!.entry.payloadCaptured).includes(needle);
    });

  if (hasTextMatch && best.score >= 10) {
    return { entry: best.entry, reason: "element_text" };
  }

  if (inListUi && looksLikeListPayload(best.entry.payloadCaptured) && best.index <= 5) {
    return { entry: best.entry, reason: "list_context" };
  }

  const recentGet = recent.find((e) => e.method === "GET");
  if (recentGet && best.score >= 6) {
    return { entry: best.entry, reason: "recent_request" };
  }

  if (hasTextMatch) {
    return { entry: best.entry, reason: "element_text" };
  }

  if (best.score >= 14 && best.index <= 8) {
    return { entry: best.entry, reason: "recent_request" };
  }

  return null;
}

export function pushRecentApiTraffic(entry: Omit<RecentApiTrafficEntry, "id" | "capturedAt">): void {
  if (!isDevClientLoggingEnabled()) return;
  if (shouldSkipUrl(entry.endpoint)) return;

  entries.unshift({
    ...entry,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    capturedAt: Date.now(),
    payloadCaptured: truncatePayload(entry.payloadCaptured),
  });
  if (entries.length > MAX_ENTRIES) {
    entries = entries.slice(0, MAX_ENTRIES);
  }
}

export function getRecentApiTraffic(): RecentApiTrafficEntry[] {
  return entries;
}

export async function recordAdminFetchResponse(
  url: string,
  method: string,
  status: number,
  latencyMs: number,
  response: Response,
): Promise<void> {
  if (!isDevClientLoggingEnabled() || shouldSkipUrl(url)) return;
  try {
    const text = await response.clone().text();
    let payloadCaptured: unknown;
    try {
      payloadCaptured = text ? JSON.parse(text) : null;
    } catch {
      payloadCaptured = { rawText: text.slice(0, 4000), parseError: true };
    }
    pushRecentApiTraffic({
      endpoint: normalizeEndpoint(url),
      method: method.toUpperCase(),
      status,
      latencyMs,
      payloadCaptured,
    });
  } catch {
    /* ignore logging failures */
  }
}
