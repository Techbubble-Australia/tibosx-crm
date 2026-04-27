import countries from "i18n-iso-countries";
import enLocale from "i18n-iso-countries/langs/en.json";

countries.registerLocale(enLocale);

export type CountryOption = { code: string; name: string; flag: string };

/** Regional-indicator flag emoji from ISO 3166-1 alpha-2 (e.g. `AU` → 🇦🇺). */
export function iso3166Alpha2ToFlagEmoji(code: string): string {
  const cc = code.toUpperCase();
  if (!/^[A-Z]{2}$/.test(cc)) return "";
  const base = 0x1f1e6;
  const cp = [cc.charCodeAt(0) - 0x41 + base, cc.charCodeAt(1) - 0x41 + base];
  return String.fromCodePoint(...cp);
}

let cachedOptions: CountryOption[] | null = null;

export function getSortedCountryOptions(): CountryOption[] {
  if (cachedOptions) return cachedOptions;
  const names = countries.getNames("en", { select: "official" }) as Record<string, string>;
  cachedOptions = Object.entries(names)
    .map(([code, name]) => ({
      code,
      name,
      flag: iso3166Alpha2ToFlagEmoji(code),
    }))
    .filter((o) => o.flag.length > 0)
    .sort((a, b) => a.name.localeCompare(b.name));
  return cachedOptions;
}

/** Match existing job row to an ISO code for the admin select (flag emoji or country name). */
export function resolveCountryCodeFromJob(flag: string, countryName: string): string {
  const opts = getSortedCountryOptions();
  const f = (flag || "").trim();
  const n = (countryName || "").trim();
  if (f) {
    const byFlag = opts.find((o) => o.flag === f);
    if (byFlag) return byFlag.code;
  }
  if (n) {
    const byName = opts.find((o) => o.name === n);
    if (byName) return byName.code;
    const byNameLoose = opts.find((o) => o.name.toLowerCase() === n.toLowerCase());
    if (byNameLoose) return byNameLoose.code;
  }
  return "";
}
