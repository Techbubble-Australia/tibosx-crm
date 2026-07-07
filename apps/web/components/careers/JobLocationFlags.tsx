import type { JobLocationEntry } from "@/lib/api/public";
import { resolveCountryCode, SUPPORTED_FLAG_CODES } from "@/lib/resolve-country-code";
import { CountryFlag } from "@/components/ui/CountryFlag";

type Props = {
  locations: JobLocationEntry[];
  flagHeight?: number;
  className?: string;
};

function resolveEntryCode(entry: JobLocationEntry): string {
  const raw = entry.countryCode?.trim().toLowerCase() ?? "";
  if (/^[a-z]{2}$/.test(raw)) return raw;
  return resolveCountryCode(entry.flag, entry.country, entry.label);
}

export function JobLocationFlags({ locations, flagHeight = 20, className }: Props) {
  const codes: string[] = [];
  const emojiFallbacks: string[] = [];

  for (const entry of locations) {
    const code = resolveEntryCode(entry);
    if (code && SUPPORTED_FLAG_CODES.has(code) && !codes.includes(code)) {
      codes.push(code);
      continue;
    }
    const emoji = entry.flag?.trim();
    if (emoji && !emojiFallbacks.includes(emoji)) {
      emojiFallbacks.push(emoji);
    }
  }

  if (codes.length === 0 && emojiFallbacks.length === 0) return null;

  return (
    <span className={`inline-flex flex-wrap items-center gap-1.5 ${className ?? ""}`}>
      {codes.map((code) => (
        <CountryFlag key={code} code={code} height={flagHeight} decorative className="inline-flex" />
      ))}
      {emojiFallbacks.map((emoji) => (
        <span key={emoji} className="text-base leading-none" aria-hidden>
          {emoji}
        </span>
      ))}
    </span>
  );
}
