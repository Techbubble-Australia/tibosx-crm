/** Normalize POST /api/upload/image JSON from Express or any BFF wrapper. */
export function readUploadImageUrlFromJson(json: unknown): string {
  if (!json || typeof json !== "object") return "";
  const root = json as Record<string, unknown>;
  if (typeof root.url === "string" && root.url.trim()) {
    return root.url.trim();
  }
  const d = root.data;
  if (d && typeof d === "object") {
    const layer = d as Record<string, unknown>;
    if (typeof layer.url === "string" && layer.url.trim()) {
      return layer.url.trim();
    }
    const nested = layer.data;
    if (nested && typeof nested === "object") {
      const n = nested as Record<string, unknown>;
      if (typeof n.url === "string" && n.url.trim()) {
        return n.url.trim();
      }
    }
  }
  return "";
}
