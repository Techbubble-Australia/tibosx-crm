/** Common dial codes for contact phone fields (ISO region + E.164 prefix). */
export const PHONE_COUNTRY_CODES: { code: string; dialCode: string; label: string }[] = [
  { code: "AU", dialCode: "+61", label: "Australia (+61)" },
  { code: "NZ", dialCode: "+64", label: "New Zealand (+64)" },
  { code: "US", dialCode: "+1", label: "United States (+1)" },
  { code: "GB", dialCode: "+44", label: "United Kingdom (+44)" },
  { code: "IN", dialCode: "+91", label: "India (+91)" },
  { code: "SG", dialCode: "+65", label: "Singapore (+65)" },
  { code: "PH", dialCode: "+63", label: "Philippines (+63)" },
  { code: "MY", dialCode: "+60", label: "Malaysia (+60)" },
  { code: "ID", dialCode: "+62", label: "Indonesia (+62)" },
  { code: "JP", dialCode: "+81", label: "Japan (+81)" },
  { code: "CN", dialCode: "+86", label: "China (+86)" },
  { code: "HK", dialCode: "+852", label: "Hong Kong (+852)" },
  { code: "DE", dialCode: "+49", label: "Germany (+49)" },
  { code: "FR", dialCode: "+33", label: "France (+33)" },
  { code: "NL", dialCode: "+31", label: "Netherlands (+31)" },
  { code: "IE", dialCode: "+353", label: "Ireland (+353)" },
  { code: "CA", dialCode: "+1", label: "Canada (+1)" },
];

export function formatClientPhone(dialCode: string, number: string): string {
  const code = dialCode.trim();
  const digits = number.trim();
  if (!digits) return code;
  if (digits.startsWith("+")) return digits;
  return `${code} ${digits}`;
}
