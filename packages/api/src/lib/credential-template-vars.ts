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
const BRACED_PLACEHOLDER = /\{([^{}]{1,500})\}/g;
const MALFORMED_OPEN_BRACE = /\{([^{}]{1,500})\]/g;
const MALFORMED_OPEN_BRACKET = /\[([^{\[\]]{1,500})\}/g;

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

function stripInlineTags(html: string): string {
  return html.replace(/<[^>]+>/g, "");
}

/** Strip inline HTML tags that Word places inside placeholder braces. */
export function cleanPlaceholdersInHtml(html: string): string {
  let next = html;

  next = next.replace(/\{([^{}]*)\}/g, (_, inner: string) => {
    const cleaned = inner.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
    return cleaned ? `{${cleaned}}` : "{}";
  });

  next = next.replace(/\{([^{}]*)\]/g, (_, inner: string) => {
    const cleaned = inner.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
    return cleaned ? `{${cleaned}]` : "{}";
  });

  next = next.replace(/\[([^{\[\]]*)\}/g, (_, inner: string) => {
    const cleaned = inner.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
    return cleaned ? `[${cleaned}}` : "{}";
  });

  return next;
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
  let scanText = text;

  function add(raw: string | undefined) {
    if (!raw) return;
    const label = raw.replace(/\s+/g, " ").trim();
    if (!label) return;
    const dedupeKey = label.toLowerCase();
    if (seen.has(dedupeKey)) return;
    seen.add(dedupeKey);
    labels.push(label);
  }

  for (const match of text.matchAll(BRACED_PLACEHOLDER)) {
    add(match[1]);
    scanText = scanText.replace(match[0], " ");
  }
  for (const match of scanText.matchAll(MALFORMED_OPEN_BRACE)) add(match[1]);
  for (const match of scanText.matchAll(MALFORMED_OPEN_BRACKET)) add(match[1]);

  return dedupeSubstringLabels(labels);
}

function dedupeSubstringLabels(labels: string[]): string[] {
  return labels.filter((label, index) => {
    const lower = label.toLowerCase();
    return !labels.some((other, otherIndex) => {
      if (index === otherIndex) return false;
      const otherLower = other.toLowerCase();
      return otherLower.includes(lower) && other.length > label.length;
    });
  });
}

function collectPlaceholderLabelsFromHtml(html: string): string[] {
  const labels: string[] = [];
  const seen = new Set<string>();

  function merge(next: string[]) {
    for (const label of next) {
      const dedupeKey = label.toLowerCase();
      if (seen.has(dedupeKey)) continue;
      seen.add(dedupeKey);
      labels.push(label);
    }
  }

  merge(collectPlaceholderLabels(html));
  merge(collectPlaceholderLabels(stripInlineTags(html)));
  merge(collectPlaceholderLabels(htmlToPlaceholderScanText(html)));

  return dedupeSubstringLabels(labels);
}

export function extractVariableKeysFromHtml(html: string): string[] {
  const labels = collectPlaceholderLabelsFromHtml(html);
  return labels.map(labelToVariableKey);
}

export function extractVariablesFromHtml(html: string): CredentialTemplateVariable[] {
  const labels = collectPlaceholderLabelsFromHtml(cleanPlaceholdersInHtml(html));
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
  const parsed = extractVariablesFromHtml(cleanPlaceholdersInHtml(html));
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

function placeholderPatternsForLabel(label: string): string[] {
  const trimmed = label.trim();
  if (!trimmed) return [];
  const patterns = new Set<string>();
  patterns.add(`{${trimmed}}`);
  patterns.add(`{${trimmed}]`);
  patterns.add(`[${trimmed}}`);
  return [...patterns];
}

export function normalizeTemplatePlaceholders(
  html: string,
  variables: CredentialTemplateVariable[],
): string {
  let next = cleanPlaceholdersInHtml(html);
  const sorted = [...variables].sort((a, b) => b.label.trim().length - a.label.trim().length);

  for (const variable of sorted) {
    const label = variable.label.trim();
    if (!label || label === variable.key) continue;
    for (const pattern of placeholderPatternsForLabel(label)) {
      next = next.replace(new RegExp(escapeRegExp(pattern), "gi"), `{${variable.key}}`);
    }
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
