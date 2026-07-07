import type { JobLocationEntry } from "@/lib/api/public";
import { CountryFlag } from "@/components/ui/CountryFlag";

type Props = {
  locations: JobLocationEntry[];
  flagHeight?: number;
  className?: string;
};

export function JobLocationFlags({ locations, flagHeight = 20, className }: Props) {
  const codes = locations
    .map((e) => e.countryCode.trim().toLowerCase())
    .filter((c) => /^[a-z]{2}$/.test(c));

  const unique = [...new Set(codes)];
  if (unique.length === 0) return null;

  return (
    <span className={className}>
      {unique.map((code) => (
        <CountryFlag
          key={code}
          code={code}
          height={flagHeight}
          decorative
          className="mr-1.5 inline-flex"
        />
      ))}
    </span>
  );
}
