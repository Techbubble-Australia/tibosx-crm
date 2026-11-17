export const DASHBOARD_BASE_CURRENCIES = ["AUD", "USD", "INR"] as const;
export type DashboardBaseCurrency = (typeof DASHBOARD_BASE_CURRENCIES)[number];

/** Currencies we convert when building project estimates/actuals in AUD. */
export const PROJECT_COST_CURRENCIES = [
  "AUD",
  "USD",
  "GBP",
  "EUR",
  "INR",
  "PHP",
  "AED",
  "NZD",
  "SGD",
  "CAD",
] as const;

/** 1 AUD = X target (fallback when live APIs are unavailable). */
const FALLBACK_RATES_FROM_AUD: Record<string, number> = {
  AUD: 1,
  USD: 0.65,
  GBP: 0.5,
  EUR: 0.6,
  /** Approximate market rate; live APIs override this when available. */
  INR: 63,
  PHP: 38,
  AED: 2.4,
  NZD: 1.1,
  SGD: 0.88,
  CAD: 0.9,
};

/** Frankfurter (ECB) set — does not include INR/PHP/AED. */
const FRANKFURTER_TARGETS = ["USD", "GBP", "EUR", "NZD", "SGD", "CAD"] as const;

/** Currencies fetched from open.er-api.com because Frankfurter/ECB does not publish them. */
const OPEN_ER_TARGETS = ["INR", "PHP", "AED"] as const;

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
    return { [base]: 1, ...FALLBACK_RATES_FROM_AUD };
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
  if (cache && cache.base === normalized && Date.now() - cache.fetchedAt < CACHE_TTL_MS) {
    return cache.rates;
  }

  const fallback = fallbackRatesForBase(normalized);
  if (normalized !== "AUD" && !DASHBOARD_BASE_CURRENCIES.includes(normalized as DashboardBaseCurrency)) {
    cache = { base: normalized, rates: fallback, fetchedAt: Date.now() };
    return fallback;
  }

  const targets =
    normalized === "AUD"
      ? FRANKFURTER_TARGETS.join(",")
      : DASHBOARD_BASE_CURRENCIES.filter((code) => code !== normalized)
          .concat(FRANKFURTER_TARGETS.filter((c) => c !== normalized) as unknown as DashboardBaseCurrency[])
          .filter((code, i, all) => all.indexOf(code) === i)
          .join(",");

  try {
    const [frankfurterRes, openErRes] = await Promise.all([
      fetch(`https://api.frankfurter.app/latest?from=${normalized}&to=${targets}`),
      // open.er-api.com covers INR/PHP/AED which ECB/Frankfurter omit.
      fetch(`https://open.er-api.com/v6/latest/${normalized}`),
    ]);

    const rates: Record<string, number> = { ...fallback, [normalized]: 1 };

    if (frankfurterRes.ok) {
      const data = (await frankfurterRes.json()) as { rates?: Record<string, number> };
      Object.assign(rates, data.rates ?? {});
    }

    if (openErRes.ok) {
      const data = (await openErRes.json()) as { result?: string; rates?: Record<string, number> };
      if (data.result === "success" && data.rates) {
        for (const code of OPEN_ER_TARGETS) {
          const value = data.rates[code];
          if (typeof value === "number" && value > 0) rates[code] = value;
        }
      }
    }

    cache = { base: normalized, rates, fetchedAt: Date.now() };
    return rates;
  } catch {
    cache = { base: normalized, rates: fallback, fetchedAt: Date.now() };
    return fallback;
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

/** Convert a member salary/rate amount into AUD using live rates when available. */
export async function convertAmountToAud(amount: number, fromCurrency: string): Promise<number> {
  const from = (fromCurrency || "AUD").toUpperCase();
  if (from === "AUD") return amount;
  const rates = await getExchangeRatesFromBase("AUD");
  return convertCurrency(amount, from, "AUD", "AUD", rates);
}

export async function convertAmountsToAud(
  amounts: Array<{ amount: number; currency: string }>,
): Promise<number[]> {
  const rates = await getExchangeRatesFromBase("AUD");
  return amounts.map(({ amount, currency }) =>
    convertCurrency(amount, currency || "AUD", "AUD", "AUD", rates),
  );
}
