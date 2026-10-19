import type { UserFileRow } from "@/components/users/AdminUserFilesField";

/** Identity / compliance files only — signed agreements live in the Agreements table. */
export function buildPinnedUserFiles(row: {
  idProofUrl?: string | null;
  addressProofUrl?: string | null;
}): UserFileRow[] {
  const pinned: UserFileRow[] = [];
  if (row.idProofUrl?.trim()) {
    pinned.push({ name: "ID proof", url: row.idProofUrl.trim() });
  }
  if (row.addressProofUrl?.trim()) {
    pinned.push({ name: "Address proof", url: row.addressProofUrl.trim() });
  }
  return pinned;
}
