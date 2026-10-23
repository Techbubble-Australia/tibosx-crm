/** Contract fileUrls may be legacy strings or { name, url } objects in JSON. */
export function normalizeContractFileUrls(fileUrls: unknown): string[] {
  if (typeof fileUrls === "string" && fileUrls.trim()) {
    return [fileUrls.trim()];
  }
  if (!Array.isArray(fileUrls)) {
    if (fileUrls && typeof fileUrls === "object") {
      const values = Object.values(fileUrls as Record<string, unknown>);
      return normalizeContractFileUrls(values);
    }
    return [];
  }
  const out: string[] = [];
  for (const entry of fileUrls) {
    if (typeof entry === "string" && entry.trim()) {
      out.push(entry.trim());
      continue;
    }
    if (entry && typeof entry === "object") {
      const obj = entry as Record<string, unknown>;
      for (const key of ["url", "href", "path", "fileUrl", "key"] as const) {
        const value = obj[key];
        if (typeof value === "string" && value.trim()) {
          out.push(value.trim());
          break;
        }
      }
    }
  }
  return out;
}
