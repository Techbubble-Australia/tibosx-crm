"use client";

import { useEffect, useMemo, useState } from "react";
import { getSortedCountryOptions, resolveCountryCodeFromJob } from "@/lib/country-flags";

type Props = {
  defaultFlag?: string;
  defaultCountry?: string;
  selectClassName?: string;
  labelClassName?: string;
};

export function CountryFlagPicker({
  defaultFlag = "",
  defaultCountry = "",
  selectClassName = "w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-black",
  labelClassName = "mb-1 block text-sm font-medium text-gray-900",
}: Props) {
  const options = useMemo(() => getSortedCountryOptions(), []);
  const [code, setCode] = useState(() => resolveCountryCodeFromJob(defaultFlag, defaultCountry));

  useEffect(() => {
    setCode(resolveCountryCodeFromJob(defaultFlag, defaultCountry));
  }, [defaultFlag, defaultCountry]);

  const selected = options.find((o) => o.code === code);
  const countryValue = selected?.name ?? "";
  const flagValue = selected?.flag ?? "";

  return (
    <div>
      <label className={labelClassName}>Country &amp; flag <span className="text-red-500">*</span></label>
      <p className="mb-2 text-xs text-gray-500">
        Data from <span className="font-mono">i18n-iso-countries</span>; flag is the standard regional-indicator emoji for the ISO code.
      </p>
      <select
        required
        value={code}
        onChange={(e) => setCode(e.target.value)}
        className={selectClassName}
        aria-label="Country and flag"
      >
        <option value="">Select country…</option>
        {options.map((o) => (
          <option key={o.code} value={o.code}>
            {o.flag} {o.name}
          </option>
        ))}
      </select>
      <input type="hidden" name="country" value={countryValue} readOnly />
      <input type="hidden" name="flag" value={flagValue} readOnly />
    </div>
  );
}
