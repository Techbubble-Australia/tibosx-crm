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

export function bankDetailsComplete(value: unknown): boolean {
  const bank = parseBankDetails(value);
  if (!bank) return false;
  return Boolean(
    bank.bankName?.trim() &&
      bank.accountName?.trim() &&
      bank.accountNumber?.trim() &&
      bank.country?.trim() &&
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
      user.country?.trim(),
  );
}

export function emergencyContactsComplete(value: unknown): boolean {
  if (!Array.isArray(value) || !value.length) return false;
  return value.every((row) => {
    if (!row || typeof row !== "object") return false;
    const contact = row as Record<string, unknown>;
    return (
      typeof contact.name === "string" &&
      contact.name.trim() &&
      typeof contact.email === "string" &&
      contact.email.trim() &&
      typeof contact.phone === "string" &&
      contact.phone.trim()
    );
  });
}
