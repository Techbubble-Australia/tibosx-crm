import { prisma } from "@techbubble/database";
import { z } from "zod";
import {
  defaultCredentialValuesForAdminUser,
  defaultCredentialValuesForProfile,
  type CredentialTemplateVariable,
} from "./credential-template-vars";

export const assignCredentialTemplateSchema = z.object({
  templateId: z.string().min(1),
  values: z.record(z.string(), z.string()),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

export type AssignCredentialTemplateInput = z.infer<typeof assignCredentialTemplateSchema>;

function formatCredentialDate(value: Date): string {
  return value.toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" });
}

export async function loadCredentialTemplateForAssign(templateId: string) {
  const template = await prisma.credentialTemplate.findUnique({ where: { id: templateId } });
  if (!template) return { error: "Template not found" as const };
  return { template };
}

export function validateCredentialTemplateAssignInput(
  template: {
    addStartDate: boolean;
    requireStartDate: boolean;
    addEndDate: boolean;
    requireEndDate: boolean;
    variables: unknown;
  },
  input: AssignCredentialTemplateInput,
): string | null {
  if (template.addStartDate && template.requireStartDate && !input.startDate) {
    return "Start date is required for this template";
  }
  if (template.addEndDate && template.requireEndDate && !input.endDate) {
    return "End date is required for this template";
  }
  if (input.startDate && input.endDate && input.endDate < input.startDate) {
    return "End date must be on or after start date";
  }
  const variables = Array.isArray(template.variables)
    ? (template.variables as CredentialTemplateVariable[])
    : [];
  for (const variable of variables) {
    if (variable.required && !input.values[variable.key]?.trim()) {
      return `${variable.label} is required`;
    }
    const value = input.values[variable.key];
    if (variable.type === "select" && value && !variable.options.includes(value)) {
      return `Invalid value for ${variable.label}`;
    }
  }
  return null;
}

export function mergeCredentialTemplateValues(
  defaults: Record<string, string>,
  email: string,
  input: AssignCredentialTemplateInput,
): Record<string, string> {
  const dateValues: Record<string, string> = {};
  if (input.startDate) {
    const formatted = formatCredentialDate(input.startDate);
    dateValues.start_date = formatted;
    dateValues.startDate = formatted;
    dateValues.Start_Date = formatted;
  }
  if (input.endDate) {
    const formatted = formatCredentialDate(input.endDate);
    dateValues.end_date = formatted;
    dateValues.endDate = formatted;
    dateValues.End_Date = formatted;
  }
  const normalizedEmail = email.trim().toLowerCase();
  return {
    ...defaults,
    ...dateValues,
    ...input.values,
    email: normalizedEmail,
    Email: normalizedEmail,
  };
}

export async function assignCredentialTemplateToAdminUser(
  adminUserId: string,
  input: AssignCredentialTemplateInput,
): Promise<{ error?: string }> {
  const user = await prisma.adminUser.findUnique({
    where: { id: adminUserId },
    select: { id: true, email: true, name: true, phone: true, role: true, additionalRoles: true },
  });
  if (!user) return { error: "User not found" };
  if (user.role === "client") return { error: "Cannot assign templates to client users" };

  const loaded = await loadCredentialTemplateForAssign(input.templateId);
  if ("error" in loaded) return { error: loaded.error };
  const template = loaded.template;

  const validationError = validateCredentialTemplateAssignInput(template, input);
  if (validationError) return { error: validationError };

  const existing = await prisma.adminUserCredentialAssignment.findUnique({
    where: { adminUserId },
    select: { agreementSignedAt: true },
  });
  if (existing?.agreementSignedAt) {
    return { error: "Template has already been signed" };
  }

  const defaults = defaultCredentialValuesForAdminUser(user);
  const mergedValues = mergeCredentialTemplateValues(defaults, user.email, input);

  await prisma.adminUserCredentialAssignment.upsert({
    where: { adminUserId },
    create: {
      adminUserId,
      credentialTemplateId: template.id,
      credentialData: mergedValues,
      agreementSignedAt: null,
      signatureDataUrl: null,
    },
    update: {
      credentialTemplateId: template.id,
      credentialData: mergedValues,
      agreementSignedAt: null,
      signatureDataUrl: null,
    },
  });

  return {};
}

export async function credentialDefaultsForAdminUser(adminUserId: string): Promise<Record<string, string>> {
  const user = await prisma.adminUser.findUnique({
    where: { id: adminUserId },
    select: {
      email: true,
      name: true,
      phone: true,
      mappedProfileId: true,
    },
  });
  if (!user) return {};

  if (user.mappedProfileId) {
    const profile = await prisma.candidateProfile.findUnique({
      where: { id: user.mappedProfileId },
      select: {
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        currency: true,
        city: true,
        country: true,
        expectedRate: true,
        mode: true,
      },
    });
    if (profile) return defaultCredentialValuesForProfile(profile);
  }

  return defaultCredentialValuesForAdminUser({
    email: user.email,
    name: user.name,
    phone: user.phone,
  });
}

export { defaultCredentialValuesForProfile };
