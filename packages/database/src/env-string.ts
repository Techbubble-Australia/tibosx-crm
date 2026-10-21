/** Trim env values; strip one pair of surrounding quotes (common in Railway raw editor). */
export function readEnvString(key: string, fallback: string): string {
  let value = process.env[key] ?? fallback;
  value = value.trim();
  if (
    (value.startsWith('"') && value.endsWith('"') && value.length >= 2) ||
    (value.startsWith("'") && value.endsWith("'") && value.length >= 2)
  ) {
    value = value.slice(1, -1).trim();
  }
  return value;
}
