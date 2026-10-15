import type { AuthUser } from "../middleware/auth.js";
import { generateToken } from "../middleware/auth.js";
import { prisma } from "@techbubble/database";

export function parseAdditionalRoles(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((r): r is string => typeof r === "string" && r.trim().length > 0);
}

export function sessionAuthUser(user: {
  id: string;
  email: string;
  role: string;
  additionalRoles?: unknown;
}): AuthUser {
  const additionalRoles = parseAdditionalRoles(user.additionalRoles);
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    ...(additionalRoles.length ? { additionalRoles } : {}),
  };
}

export async function createFullSessionTokenForUserId(userId: string): Promise<string | null> {
  const user = await prisma.adminUser.findUnique({
    where: { id: userId },
    select: { id: true, email: true, role: true, additionalRoles: true, active: true },
  });
  if (!user || user.active === false) return null;
  return generateToken(sessionAuthUser(user));
}
