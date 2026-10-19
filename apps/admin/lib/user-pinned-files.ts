import type { UserFileRow } from "@/components/users/AdminUserFilesField";

export function buildPinnedUserFiles(row: {
  agreementDocumentUrl?: string | null;
  idProofUrl?: string | null;
  addressProofUrl?: string | null;
}): UserFileRow[] {
  const pinned: UserFileRow[] = [];
  if (row.agreementDocumentUrl?.trim()) {
    pinned.push({ name: "Signed contract / agreement", url: row.agreementDocumentUrl.trim() });
  }
  if (row.idProofUrl?.trim()) {
    pinned.push({ name: "ID proof", url: row.idProofUrl.trim() });
  }
  if (row.addressProofUrl?.trim()) {
    pinned.push({ name: "Address proof", url: row.addressProofUrl.trim() });
  }
  return pinned;
}
