const ADMIN_USER_FIELD_LABELS: Record<string, string> = {
  name: "Name",
  phone: "Phone",
  email: "Email",
  addressLine1: "Address line 1",
  addressLine2: "Address line 2",
  city: "City",
  state: "State",
  postcode: "Postcode",
  country: "Country",
  bankDetails: "Bank details",
  emergencyContacts: "Emergency contacts",
  profilePhotoUrl: "Profile photo",
  idProofUrl: "ID proof",
  addressProofUrl: "Address proof",
  userFiles: "Files",
  role: "Role",
  active: "Active",
};

export type AdminUserActivityRow = {
  action: string;
  fieldName?: string | null;
  fieldLabel?: string | null;
};

function humanizeFieldName(fieldName: string): string {
  if (ADMIN_USER_FIELD_LABELS[fieldName]) return ADMIN_USER_FIELD_LABELS[fieldName];
  const spaced = fieldName.replace(/([A-Z])/g, " $1").replace(/_/g, " ").trim();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

export function formatAdminUserActivityTitle(row: AdminUserActivityRow): string {
  const label =
    row.fieldLabel?.trim() ||
    (row.fieldName ? humanizeFieldName(row.fieldName) : null);
  if (label) return `${label} updated`;
  return row.action.replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
