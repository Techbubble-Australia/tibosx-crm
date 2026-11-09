"use client";

import { useEffect, useState } from "react";

type Props = {
  value: number | string | null | undefined;
  /** Called on every edit with the parsed amount (null when empty). */
  onChange?: (value: number | null) => void;
  /** Called when the field loses focus with the final amount. */
  onCommit?: (value: number | null) => void;
  className?: string;
  readOnly?: boolean;
  disabled?: boolean;
  placeholder?: string;
  "aria-label"?: string;
};

function toNumber(value: Props["value"]): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = typeof value === "number" ? value : Number(String(value).replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
}

/** 1234567.5 → "1,234,567.50" */
export function formatAmount(value: number | null): string {
  if (value === null) return "";
  return value.toLocaleString("en-AU", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** Money field: shows thousands separators (1,234,567.89) and accepts plain digits while typing. */
export function CurrencyInput({
  value,
  onChange,
  onCommit,
  className,
  readOnly,
  disabled,
  placeholder = "0.00",
  "aria-label": ariaLabel,
}: Props) {
  const [focused, setFocused] = useState(false);
  const [draft, setDraft] = useState(() => formatAmount(toNumber(value)));

  useEffect(() => {
    if (!focused) setDraft(formatAmount(toNumber(value)));
  }, [value, focused]);

  return (
    <input
      type="text"
      inputMode="decimal"
      className={className}
      value={draft}
      readOnly={readOnly}
      disabled={disabled}
      placeholder={placeholder}
      aria-label={ariaLabel}
      onFocus={() => {
        setFocused(true);
        const n = toNumber(value);
        if (!readOnly) setDraft(n === null ? "" : String(n));
      }}
      onChange={(e) => {
        const cleaned = e.target.value.replace(/[^0-9.]/g, "").replace(/(\..*)\./g, "$1");
        setDraft(cleaned);
        onChange?.(cleaned === "" || cleaned === "." ? null : Number(cleaned));
      }}
      onBlur={() => {
        setFocused(false);
        const n = draft === "" || draft === "." ? null : Number(draft.replace(/,/g, ""));
        const next = n !== null && Number.isFinite(n) ? Math.max(0, n) : null;
        setDraft(formatAmount(next));
        onCommit?.(next);
      }}
    />
  );
}
