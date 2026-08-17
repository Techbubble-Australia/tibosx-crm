export function normalizeProfileEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function normalizeProfilePhone(phone: string): string {
  return phone.replace(/\D/g, "");
}

export type ProfileDuplicateMeta = {
  isDuplicate: boolean;
  duplicateCount: number;
  duplicateMatchReason: string | null;
};

type IdentifiableProfile = {
  id: string;
  email: string;
  phone: string;
};

export function computeProfileDuplicateMeta(rows: IdentifiableProfile[]): Map<string, ProfileDuplicateMeta> {
  const emailToIds = new Map<string, string[]>();
  const phoneToIds = new Map<string, string[]>();

  for (const row of rows) {
    const emailKey = normalizeProfileEmail(row.email);
    if (emailKey) {
      const list = emailToIds.get(emailKey) ?? [];
      list.push(row.id);
      emailToIds.set(emailKey, list);
    }

    const phoneKey = normalizeProfilePhone(row.phone);
    if (phoneKey.length >= 8) {
      const list = phoneToIds.get(phoneKey) ?? [];
      list.push(row.id);
      phoneToIds.set(phoneKey, list);
    }
  }

  const result = new Map<string, ProfileDuplicateMeta>();
  for (const row of rows) {
    const emailKey = normalizeProfileEmail(row.email);
    const phoneKey = normalizeProfilePhone(row.phone);
    const emailGroup = emailToIds.get(emailKey) ?? [];
    const phoneGroup = phoneKey.length >= 8 ? (phoneToIds.get(phoneKey) ?? []) : [];

    const duplicateIds = new Set(
      [...emailGroup, ...phoneGroup].filter((id) => id !== row.id),
    );

    const reasons: string[] = [];
    if (emailGroup.length > 1) {
      reasons.push("email");
    }
    if (phoneGroup.length > 1) {
      reasons.push("phone");
    }

    result.set(row.id, {
      isDuplicate: duplicateIds.size > 0,
      duplicateCount: duplicateIds.size,
      duplicateMatchReason: reasons.length > 0 ? reasons.join(", ") : null,
    });
  }

  return result;
}
