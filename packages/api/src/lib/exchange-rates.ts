export const DASHBOARD_BASE_CURRENCIES = ["AUD", "USD", "INR"] as const;
export type DashboardBaseCurrency = (typeof DASHBOARD_BASE_CURRENCIES)[number];

/** 1 AUD = X target (fallback when API unavailable). */
const FALLBACK_RATES_FROM_AUD: Record<string, number> = {
  AUD: 1,
  USD: 0.65,
  INR: 54,
};

type RateCache = {
  base: string;
  rates: Record<string, number>;
  fetchedAt: number;
};

let cache: RateCache | null = null;
const CACHE_TTL_MS = 60 * 60 * 1000;

function fallbackRatesForBase(base: string): Record<string, number> {
  if (base === "AUD") return { ...FALLBACK_RATES_FROM_AUD };
  const audRates = FALLBACK_RATES_FROM_AUD;
  if (!audRates[base]) {
    return { [base]: 1, AUD: 1, USD: audRates.USD ?? 0.65, INR: audRates.INR ?? 54 };
  }
  const basePerAud = audRates[base];
  const rates: Record<string, number> = { [base]: 1 };
  for (const [code, audRate] of Object.entries(audRates)) {
    if (code === base) continue;
    rates[code] = audRate / basePerAud;
  }
  return rates;
}

export async function getExchangeRatesFromBase(base: string): Promise<Record<string, number>> {
  const normalized = base.toUpperCase();
  if (!DASHBOARD_BASE_CURRENCIES.includes(normalized as DashboardBaseCurrency)) {
    return fallbackRatesForBase("AUD");
  }

  if (cache && cache.base === normalized && Date.now() - cache.fetchedAt < CACHE_TTL_MS) {
    return cache.rates;
  }

  const targets = DASHBOARD_BASE_CURRENCIES.filter((code) => code !== normalized).join(",");
  try {
    const res = await fetch(`https://api.frankfurter.app/latest?from=${normalized}&to=${targets}`);
    if (!res.ok) throw new Error("Rate fetch failed");
    const data = (await res.json()) as { rates?: Record<string, number> };
    const rates: Record<string, number> = { [normalized]: 1, ...(data.rates ?? {}) };
    cache = { base: normalized, rates, fetchedAt: Date.now() };
    return rates;
  } catch {
    return fallbackRatesForBase(normalized);
  }
}

/** `rates[code]` = amount of `code` per 1 unit of `base`. */
export function convertCurrency(
  amount: number,
  from: string,
  to: string,
  base: string,
  rates: Record<string, number>,
): number {
  const fromCode = from.toUpperCase();
  const toCode = to.toUpperCase();
  const baseCode = base.toUpperCase();
  if (fromCode === toCode) return amount;

  const inBase = fromCode === baseCode ? amount : amount / (rates[fromCode] ?? 1);
  return toCode === baseCode ? inBase : inBase * (rates[toCode] ?? 1);
}
