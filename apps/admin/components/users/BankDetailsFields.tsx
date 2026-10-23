"use client";

import { COUNTRY_OPTIONS } from "@/lib/country-options";
import { COUNTRY_OTHER, mergeCountryValue, splitCountryValue } from "@/lib/country-form";

export type BankDetailsFormValue = {
  bankName: string;
  accountName: string;
  accountNumber: string;
  country: string;
  countrySelect: string;
  countryOther: string;
  swiftCode: string;
  bsb: string;
  notes: string;
  taxNumber: string;
};

const inputClass =
  "w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-black dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100";

export function bankDetailsFromApi(value: unknown): BankDetailsFormValue {
  const row =
    value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  const storedCountry = typeof row.country === "string" ? row.country : "";
  const { select, other } = splitCountryValue(storedCountry);
  return {
    bankName: typeof row.bankName === "string" ? row.bankName : "",
    accountName: typeof row.accountName === "string" ? row.accountName : "",
    accountNumber: typeof row.accountNumber === "string" ? row.accountNumber : "",
    country: storedCountry,
    countrySelect: select,
    countryOther: other,
    swiftCode: typeof row.swiftCode === "string" ? row.swiftCode : "",
    bsb: typeof row.bsb === "string" ? row.bsb : "",
    notes: typeof row.notes === "string" ? row.notes : "",
    taxNumber: "",
  };
}

export function bankDetailsFromUser(user: {
  bankDetails?: unknown;
  taxNumber?: string | null;
}): BankDetailsFormValue {
  const base = bankDetailsFromApi(user.bankDetails);
  return {
    ...base,
    taxNumber: typeof user.taxNumber === "string" ? user.taxNumber : "",
  };
}

export function bankDetailsToApi(value: BankDetailsFormValue): Record<string, string> | null {
  const country = mergeCountryValue(value.countrySelect, value.countryOther);
  const bankName = value.bankName.trim();
  const accountName = value.accountName.trim();
  const accountNumber = value.accountNumber.trim();
  const bsb = value.bsb.trim();
  if (!bankName && !accountName && !accountNumber && !country && !bsb) {
    return null;
  }
  return {
    bankName,
    accountName,
    accountNumber,
    country,
    swiftCode: value.swiftCode.trim() || undefined,
    bsb,
    notes: value.notes.trim() || undefined,
  } as Record<string, string>;
}

type Props = {
  value: BankDetailsFormValue;
  onChange: (next: BankDetailsFormValue) => void;
  readOnly?: boolean;
  showTaxNumber?: boolean;
};

export function BankDetailsFields({ value, onChange, readOnly, showTaxNumber }: Props) {
  function patch(p: Partial<BankDetailsFormValue>) {
    onChange({ ...value, ...p });
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div>
        <label className="mb-1 block text-sm font-medium">Bank name</label>
        <input
          className={readOnly ? `${inputClass} bg-gray-50 dark:bg-gray-950` : inputClass}
          value={value.bankName}
          readOnly={readOnly}
          onChange={(e) => patch({ bankName: e.target.value })}
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Account name</label>
        <input
          className={readOnly ? `${inputClass} bg-gray-50 dark:bg-gray-950` : inputClass}
          value={value.accountName}
          readOnly={readOnly}
          onChange={(e) => patch({ accountName: e.target.value })}
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Account number</label>
        <input
          className={readOnly ? `${inputClass} bg-gray-50 dark:bg-gray-950` : inputClass}
          value={value.accountNumber}
          readOnly={readOnly}
          onChange={(e) => patch({ accountNumber: e.target.value })}
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Bank country</label>
        <select
          className={readOnly ? `${inputClass} bg-gray-50 dark:bg-gray-950` : inputClass}
          value={value.countrySelect}
          disabled={readOnly}
          onChange={(e) => patch({ countrySelect: e.target.value })}
        >
          <option value="">Select country…</option>
          {COUNTRY_OPTIONS.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        {value.countrySelect === COUNTRY_OTHER ? (
          <input
            className={`${inputClass} mt-2`}
            placeholder="Enter country name *"
            value={value.countryOther}
            readOnly={readOnly}
            required
            onChange={(e) => patch({ countryOther: e.target.value })}
          />
        ) : null}
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">SWIFT / BIC</label>
        <input
          className={readOnly ? `${inputClass} bg-gray-50 dark:bg-gray-950` : inputClass}
          value={value.swiftCode}
          readOnly={readOnly}
          onChange={(e) => patch({ swiftCode: e.target.value })}
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">BSB / Routing / IFSC</label>
        <input
          className={readOnly ? `${inputClass} bg-gray-50 dark:bg-gray-950` : inputClass}
          value={value.bsb}
          readOnly={readOnly}
          onChange={(e) => patch({ bsb: e.target.value })}
        />
      </div>
      {showTaxNumber ? (
        <div className="sm:col-span-2">
          <label className="mb-1 block text-sm font-medium">Tax number *</label>
          <input
            className={readOnly ? `${inputClass} bg-gray-50 dark:bg-gray-950` : inputClass}
            value={value.taxNumber}
            readOnly={readOnly}
            required={!readOnly}
            onChange={(e) => patch({ taxNumber: e.target.value })}
          />
        </div>
      ) : null}
      <div className="sm:col-span-2">
        <label className="mb-1 block text-sm font-medium">
          Other details, including superannuation and other payroll compliance requirements.
        </label>
        <textarea
          className={readOnly ? `${inputClass} bg-gray-50 dark:bg-gray-950` : inputClass}
          rows={2}
          value={value.notes}
          readOnly={readOnly}
          onChange={(e) => patch({ notes: e.target.value })}
        />
      </div>
    </div>
  );
}
