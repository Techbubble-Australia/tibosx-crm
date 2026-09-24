export const CREDENTIAL_VARIABLE_TYPES = ["text", "select"] as const;
export type CredentialVariableType = (typeof CREDENTIAL_VARIABLE_TYPES)[number];

export type CredentialTemplateVariable = {
  key: string;
  label: string;
  type: CredentialVariableType;
  options: string[];
  required: boolean;
};

const VARIABLE_PATTERN = /\{([A-Za-z][A-Za-z0-9_]*)\}/g;

export function extractVariableKeysFromHtml(html: string): string[] {
  const keys = new Set<string>();
  for (const match of html.matchAll(VARIABLE_PATTERN)) {
    const key = match[1];
    if (key) keys.add(key);
  }
  return [...keys];
}

export function mergeVariablesFromHtml(
  html: string,
  existing: CredentialTemplateVariable[] = [],
): CredentialTemplateVariable[] {
  const keys = extractVariableKeysFromHtml(html);
  const byKey = new Map(existing.map((row) => [row.key, row]));
  return keys.map((key) => {
    const prev = byKey.get(key);
    return {
      key,
      label: prev?.label ?? key,
      type: prev?.type ?? "text",
      options: prev?.options ?? [],
      required: prev?.required ?? true,
    };
  });
}

export function defaultCredentialValuesForProfile(profile: {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  currency: string;
}): Record<string, string> {
  return {
    Name: `${profile.firstName} ${profile.lastName}`.trim(),
    Email: profile.email,
    Phone: profile.phone,
    Currency: profile.currency,
    Address: "",
    Frequency: "",
    Rate: "",
  };
}
