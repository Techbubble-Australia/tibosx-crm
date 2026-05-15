/**
 * Parses homepage-style stat strings (e.g. "150+", "98%", "6") for count-up animation.
 * Compound values like "24/7" are returned with target 0 so the raw string is shown (no count-up).
 */
export function parseStatValue(raw: string): { target: number; suffix: string } {
  const trimmed = raw.trim();
  if (/^\d+\/\d+$/.test(trimmed)) {
    return { target: 0, suffix: "" };
  }
  const match = trimmed.match(/^(\d+)(.*)$/);
  if (!match) {
    return { target: 0, suffix: "" };
  }
  return { target: Number(match[1]), suffix: match[2] ?? "" };
}
