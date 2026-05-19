/**
 * Parse a "one item per line" textarea for controlled React state.
 * Does **not** drop blank lines — so Enter creates a real newline instead of the
 * previous `filter(Boolean)` bug that stripped trailing empty lines on every keystroke.
 */
export function multilineToLines(raw: string): string[] {
  return raw.split(/\r?\n/).map((line) => line.trim());
}

/**
 * Before persisting JSON: remove blank entries from homogeneous `string[]` trees only
 * (arrays where every element is a string). Other arrays are walked recursively.
 */
export function compactNestedStringArrays<T>(value: T): T {
  const walk = (v: unknown): unknown => {
    if (Array.isArray(v)) {
      if (v.length > 0 && v.every((x) => typeof x === "string")) {
        return (v as string[]).map((s) => s.trim()).filter((s) => s.length > 0);
      }
      return v.map(walk);
    }
    if (v !== null && typeof v === "object") {
      return Object.fromEntries(Object.entries(v as Record<string, unknown>).map(([k, x]) => [k, walk(x)]));
    }
    return v;
  };
  return walk(value) as T;
}
