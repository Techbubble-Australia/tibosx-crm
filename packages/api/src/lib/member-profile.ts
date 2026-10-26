export type BankDetails = {
  bankName?: string;
  accountName?: string;
  accountNumber?: string;
  country?: string;
  swiftCode?: string;
  bsb?: string;
  notes?: string;
};

export type UserFileRow = {
  id: string;
  name: string;
  url: string;
  uploadedAt: string;
};

export function parseBankDetails(value: unknown): BankDetails | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  return {
    bankName: typeof row.bankName === "string" ? row.bankName : "",
    accountName: typeof row.accountName === "string" ? row.accountName : "",
    accountNumber: typeof row.accountNumber === "string" ? row.accountNumber : "",
    country: typeof row.country === "string" ? row.country : "",
    swiftCode: typeof row.swiftCode === "string" ? row.swiftCode : "",
    bsb: typeof row.bsb === "string" ? row.bsb : "",
    notes: typeof row.notes === "string" ? row.notes : "",
  };
}

function countryValueComplete(country: string | undefined): boolean {
  const c = country?.trim() ?? "";
  if (!c || c === "Other") return false;
  return true;
}

export function bankDetailsComplete(value: unknown): boolean {
  const bank = parseBankDetails(value);
  if (!bank) return false;
  return Boolean(
    bank.bankName?.trim() &&
      bank.accountName?.trim() &&
      bank.accountNumber?.trim() &&
      countryValueComplete(bank.country) &&
      bank.bsb?.trim(),
  );
}

export function addressComplete(user: {
  addressLine1?: string | null;
  city?: string | null;
  state?: string | null;
  postcode?: string | null;
  country?: string | null;
}): boolean {
  return Boolean(
    user.addressLine1?.trim() &&
      user.city?.trim() &&
      user.state?.trim() &&
      user.postcode?.trim() &&
      countryValueComplete(user.country ?? undefined),
  );
}

function emergencyContactRowComplete(row: unknown): boolean {
  if (!row || typeof row !== "object") return false;
  const contact = row as Record<string, unknown>;
  return Boolean(
    typeof contact.name === "string" &&
      contact.name.trim() &&
      typeof contact.email === "string" &&
      contact.email.trim() &&
      typeof contact.phone === "string" &&
      contact.phone.trim(),
  );
}

export function emergencyContactsComplete(value: unknown): boolean {
  if (!Array.isArray(value) || !value.length) return false;
  return value.some(emergencyContactRowComplete);
}

/** Project member / internal user profile KYC: bank, address, and at least one emergency contact. */
export function memberProfileDetailsComplete(user: {
  addressLine1?: string | null;
  city?: string | null;
  state?: string | null;
  postcode?: string | null;
  country?: string | null;
  bankDetails?: unknown;
  emergencyContacts?: unknown;
}): boolean {
  return (
    addressComplete(user) &&
    bankDetailsComplete(user.bankDetails) &&
    emergencyContactsComplete(user.emergencyContacts)
  );
}
