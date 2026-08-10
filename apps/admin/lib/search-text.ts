export function buildSearchHaystack(parts: (string | null | undefined | number | boolean)[]): string {
  return parts
    .map((part) => (part == null ? "" : String(part)))
    .join(" ")
    .toLowerCase();
}

export function matchesSearch(haystack: string, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return haystack.toLowerCase().includes(q);
}
