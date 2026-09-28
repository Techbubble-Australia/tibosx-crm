export const CREDENTIAL_VARIABLE_TYPES = ["text", "select"] as const;
export type CredentialVariableType = (typeof CREDENTIAL_VARIABLE_TYPES)[number];

export type CredentialTemplateVariable = {
  key: string;
  label: string;
  type: CredentialVariableType;
  options: string[];
  required: boolean;
};

const SIMPLE_KEY_PATTERN = /^[A-Za-z][A-Za-z0-9_]*$/;
const BRACED_PLACEHOLDER = /\{([^{}[\]]{1,300})\}/g;
const MALFORMED_OPEN_BRACE = /\{([^{}[\]]{1,300})\]/g;
const MALFORMED_OPEN_BRACKET = /\[([^{\[\]]{1,300})\}/g;

function htmlToPlaceholderScanText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<\/td>/gi, " ")
    .replace(/<\/tr>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

export function labelToVariableKey(label: string): string {
  const trimmed = label.trim();
  if (!trimmed) return "field";
  if (SIMPLE_KEY_PATTERN.test(trimmed)) return trimmed;
  const slug = trimmed
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 80);
  return slug || "field";
}

function collectPlaceholderLabels(text: string): string[] {
  const labels: string[] = [];
  const seen = new Set<string>();

  function add(raw: string | undefined) {
    if (!raw) return;
    const label = raw.replace(/\s+/g, " ").trim();
    if (!label) return;
    const dedupeKey = label.toLowerCase();
    if (seen.has(dedupeKey)) return;
    seen.add(dedupeKey);
    labels.push(label);
  }

  for (const match of text.matchAll(BRACED_PLACEHOLDER)) add(match[1]);
  for (const match of text.matchAll(MALFORMED_OPEN_BRACE)) add(match[1]);
  for (const match of text.matchAll(MALFORMED_OPEN_BRACKET)) add(match[1]);

  return labels;
}

export function extractVariableKeysFromHtml(html: string): string[] {
  const labels = collectPlaceholderLabels(htmlToPlaceholderScanText(html));
  return labels.map(labelToVariableKey);
}

export function extractVariablesFromHtml(html: string): CredentialTemplateVariable[] {
  const labels = collectPlaceholderLabels(htmlToPlaceholderScanText(html));
  const usedKeys = new Set<string>();

  return labels.map((label) => {
    let key = labelToVariableKey(label);
    const base = key;
    let suffix = 2;
    while (usedKeys.has(key.toLowerCase())) {
      key = `${base}_${suffix}`;
      suffix += 1;
    }
    usedKeys.add(key.toLowerCase());
    return {
      key,
      label,
      type: "text",
      options: [],
      required: true,
    };
  });
}

export function mergeVariablesFromHtml(
  html: string,
  existing: CredentialTemplateVariable[] = [],
): CredentialTemplateVariable[] {
  const parsed = extractVariablesFromHtml(html);
  const byKey = new Map(existing.map((row) => [row.key.toLowerCase(), row]));
  return parsed.map((row) => {
    const prev = byKey.get(row.key.toLowerCase());
    return {
      key: row.key,
      label: prev?.label ?? row.label,
      type: prev?.type ?? row.type,
      options: prev?.options ?? row.options,
      required: prev?.required ?? row.required,
    };
  });
}

export function normalizeTemplatePlaceholders(
  html: string,
  variables: CredentialTemplateVariable[],
): string {
  let next = html;
  for (const variable of variables) {
    const label = variable.label.trim();
    if (!label || label === variable.key) continue;
    next = next.replace(new RegExp(`\\{${escapeRegExp(label)}\\}`, "gi"), `{${variable.key}}`);
    next = next.replace(new RegExp(`\\{${escapeRegExp(label)}\\]`, "gi"), `{${variable.key}}`);
    next = next.replace(new RegExp(`\\[${escapeRegExp(label)}\\}`, "gi"), `{${variable.key}}`);
  }
  return next;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
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
