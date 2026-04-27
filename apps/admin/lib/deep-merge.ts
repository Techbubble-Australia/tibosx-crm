/** Shallow-friendly merge: nested plain objects merge recursively; arrays and scalars from patch replace. */

export function deepMerge<T extends Record<string, unknown>>(base: T, patch: unknown): T {
  if (!patch || typeof patch !== "object" || Array.isArray(patch)) {
    return base;
  }
  const p = patch as Record<string, unknown>;
  const out: Record<string, unknown> = { ...base };
  for (const key of Object.keys(p)) {
    const bv = out[key];
    const pv = p[key];
    if (
      pv &&
      typeof pv === "object" &&
      !Array.isArray(pv) &&
      bv &&
      typeof bv === "object" &&
      !Array.isArray(bv)
    ) {
      out[key] = deepMerge(bv as Record<string, unknown>, pv);
    } else {
      out[key] = pv;
    }
  }
  return out as T;
}
