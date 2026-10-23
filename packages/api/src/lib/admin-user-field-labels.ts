export const ADMIN_USER_FIELD_LABELS: Record<string, string> = {
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
  mappedClientContactId: "Mapped contact",
  requireProfileAfterFirstLogin: "User to add details after first login",
  profileKycStatus: "Profile KYC status",
  profileDetailsCompletedAt: "Profile completed at",
};

export function adminUserFieldLabel(fieldName: string | null | undefined): string | null {
  if (!fieldName) return null;
  return ADMIN_USER_FIELD_LABELS[fieldName] ?? fieldName;
}
