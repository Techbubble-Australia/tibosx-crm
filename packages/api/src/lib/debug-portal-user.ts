import { prisma } from "@techbubble/database";
import { effectiveRoleList } from "./admin-roles.js";

export type DebugPortalUser = {
  id: string;
  email: string;
  name: string;
  role: string;
  isAdmin: boolean;
};

/** Any active TBOS account: internal users and customer (client portal) users. */
export async function resolveDebugPortalUser(id: string): Promise<DebugPortalUser | null> {
  const admin = await prisma.adminUser.findUnique({
    where: { id },
    select: { id: true, email: true, name: true, role: true, active: true, additionalRoles: true },
  });
  if (admin) {
    if (admin.active === false) return null;
    return {
      id: admin.id,
      email: admin.email,
      name: admin.name ?? "",
      role: admin.role,
      isAdmin: effectiveRoleList(admin.role, admin.additionalRoles).includes("admin"),
    };
  }

  const customer = await prisma.customerUser.findUnique({
    where: { id },
    select: { id: true, email: true, name: true, active: true },
  });
  if (!customer || customer.active === false) return null;
  return { id: customer.id, email: customer.email, name: customer.name ?? "", role: "client", isAdmin: false };
}

export const MAX_TICKET_SCREENSHOTS = 20;

/** Every screenshot on a ticket, including tickets saved before multiple screenshots existed. */
export function ticketScreenshotUrls(row: {
  screenshotUrl: string | null;
  screenshotUrls?: string[] | null;
  fullPayload?: unknown;
}): string[] {
  const urls = (row.screenshotUrls ?? []).filter((url) => typeof url === "string" && url.trim());
  if (urls.length) return urls;
  if (row.screenshotUrl?.trim()) return [row.screenshotUrl];
  const payload = row.fullPayload;
  if (payload && typeof payload === "object" && !Array.isArray(payload)) {
    const legacy = (payload as Record<string, unknown>).screenshotUrl;
    if (typeof legacy === "string" && legacy.trim()) return [legacy];
  }
  return [];
}

/** Normalises the create payload: `screenshotUrls` plus the older single `screenshotUrl`. */
export function screenshotFieldsFromInput(input: {
  screenshotUrl?: string | null;
  screenshotUrls?: string[];
}): { screenshotUrl: string | null; screenshotUrls: string[] } {
  const urls = [
    ...(input.screenshotUrls ?? []),
    ...(input.screenshotUrl ? [input.screenshotUrl] : []),
  ]
    .map((url) => url.trim())
    .filter(Boolean);
  const unique = [...new Set(urls)].slice(0, MAX_TICKET_SCREENSHOTS);
  return { screenshotUrl: unique[0] ?? null, screenshotUrls: unique };
}
