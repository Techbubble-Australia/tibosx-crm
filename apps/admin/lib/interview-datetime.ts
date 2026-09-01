/** Australian Eastern — Sydney, Melbourne, and Canberra share this IANA zone. */
export const DEFAULT_INTERVIEW_TIMEZONE = "Australia/Sydney";

export const INTERVIEW_TIMEZONE_OPTIONS = [
  { value: "Australia/Sydney", label: "Australia/Sydney (Melbourne, Canberra)" },
  { value: "Australia/Brisbane", label: "Australia/Brisbane" },
  { value: "Australia/Adelaide", label: "Australia/Adelaide" },
  { value: "Australia/Perth", label: "Australia/Perth" },
  { value: "Australia/Darwin", label: "Australia/Darwin" },
] as const;

function getPart(parts: Intl.DateTimeFormatPart[], type: Intl.DateTimeFormatPartTypes): string {
  return parts.find((part) => part.type === type)?.value ?? "";
}

function parseLocalDatetime(localValue: string): {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
} | null {
  const [datePart, timePart] = localValue.split("T");
  if (!datePart || !timePart) return null;

  const dateBits = datePart.split("-");
  const timeBits = timePart.split(":");
  if (dateBits.length < 3 || timeBits.length < 2) return null;

  const year = Number(dateBits[0]);
  const month = Number(dateBits[1]);
  const day = Number(dateBits[2]);
  const hour = Number(timeBits[0]);
  const minute = Number(timeBits[1]);

  if ([year, month, day, hour, minute].some((n) => Number.isNaN(n))) return null;

  return { year, month, day, hour, minute };
}

/** Wall-clock `datetime-local` value in a given IANA timezone → UTC ISO string. */
export function wallTimeInZoneToIso(localValue: string, timeZone: string): string {
  if (!localValue.trim()) return "";
  const parsed = parseLocalDatetime(localValue);
  if (!parsed) return "";

  const { year, month, day, hour, minute } = parsed;

  let candidate = new Date(Date.UTC(year, month - 1, day, hour, minute));
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).formatToParts(candidate);

    const zy = Number(getPart(parts, "year"));
    const zm = Number(getPart(parts, "month"));
    const zd = Number(getPart(parts, "day"));
    const zh = Number(getPart(parts, "hour"));
    const zmin = Number(getPart(parts, "minute"));

    if (zy === year && zm === month && zd === day && zh === hour && zmin === minute) {
      return candidate.toISOString();
    }

    const diffMinutes =
      (year - zy) * 525_600 +
      (month - zm) * 43_200 +
      (day - zd) * 1_440 +
      (hour - zh) * 60 +
      (minute - zmin);
    candidate = new Date(candidate.getTime() + diffMinutes * 60_000);
  }

  return candidate.toISOString();
}

/** UTC ISO string → `datetime-local` value in a given IANA timezone. */
export function isoToWallTimeInZone(iso: string | null | undefined, timeZone: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";

  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(d);

  return `${getPart(parts, "year")}-${getPart(parts, "month")}-${getPart(parts, "day")}T${getPart(parts, "hour")}:${getPart(parts, "minute")}`;
}

export function formatInterviewDateTime(
  iso: string | null | undefined,
  timeZone: string = DEFAULT_INTERVIEW_TIMEZONE,
): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;

  return new Intl.DateTimeFormat("en-AU", {
    timeZone,
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(d);
}
