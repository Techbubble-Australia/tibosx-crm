/** ISO 3166-1 alpha-2 codes for SVG flags in `/public/flags/{code}.svg`. */
export const SUPPORTED_FLAG_CODES = new Set(["au", "us", "in", "ph", "gb", "ae"]);

const EMOJI_TO_CODE: Record<string, string> = {
  "🇦🇺": "au",
  "🇺🇸": "us",
  "🇮🇳": "in",
  "🇵🇭": "ph",
  "🇬🇧": "gb",
  "🇦🇪": "ae",
};

const NAME_TO_CODE: Record<string, string> = {
  australia: "au",
  usa: "us",
  us: "us",
  "united states": "us",
  "united states of america": "us",
  india: "in",
  philippines: "ph",
  "united kingdom": "gb",
  uk: "gb",
  "great britain": "gb",
  england: "gb",
  uae: "ae",
  "united arab emirates": "ae",
};

/** City/region hints when legacy rows only store a place name. */
const PLACE_TO_CODE: Record<string, string> = {
  sydney: "au",
  brisbane: "au",
  melbourne: "au",
  perth: "au",
  adelaide: "au",
  canberra: "au",
  "north sydney": "au",
  mumbai: "in",
  bangalore: "in",
  bengaluru: "in",
  hyderabad: "in",
  chennai: "in",
  delhi: "in",
  manila: "ph",
  london: "gb",
  dubai: "ae",
  "new york": "us",
};

function normalizeKey(value: string): string {
  return value.trim().toLowerCase();
}

/**
 * Resolve a lowercase ISO alpha-2 code from flag emoji, country name, or place label.
 */
export function resolveCountryCode(flag: string, countryOrPlace: string, placeLabel?: string): string {
  const f = flag.trim();
  if (f && EMOJI_TO_CODE[f]) return EMOJI_TO_CODE[f];

  const candidates = [countryOrPlace, placeLabel ?? ""].map(normalizeKey).filter(Boolean);
  for (const key of candidates) {
    if (NAME_TO_CODE[key]) return NAME_TO_CODE[key];
    if (/^[a-z]{2}$/.test(key) && SUPPORTED_FLAG_CODES.has(key)) return key;
    if (PLACE_TO_CODE[key]) return PLACE_TO_CODE[key];
    for (const part of key.split(/\s*(?:,|&|·|\/|\band\b)\s*/i)) {
      const p = part.trim();
      if (NAME_TO_CODE[p]) return NAME_TO_CODE[p];
      if (PLACE_TO_CODE[p]) return PLACE_TO_CODE[p];
    }
  }

  return "";
}
