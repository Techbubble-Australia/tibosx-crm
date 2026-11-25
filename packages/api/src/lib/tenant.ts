import { prisma } from "@techbubble/database";

export const TECHBUBBLE_TENANT_ID = "tenant_techbubble";
export const TECHBUBBLE_TENANT_SLUG = "techbubble";

export const TENANT_MODULES = [
  "sales_crm",
  "recruitment",
  "customer_support",
  "projects",
] as const;

export type TenantModuleKey = (typeof TENANT_MODULES)[number];

export type TenantContext = {
  tenantId: string;
  tenantSlug: string;
  tenantName: string;
  isPlatformAdmin: boolean;
  membershipRole: string | null;
  modules: Record<TenantModuleKey, boolean>;
  /** Active support view-as session id when platform admin is viewing another tenant. */
  supportSessionId?: string;
};

const DEFAULT_MODULES: Record<TenantModuleKey, boolean> = {
  sales_crm: true,
  recruitment: true,
  customer_support: true,
  projects: true,
};

export async function ensureTechBubbleTenant(): Promise<string> {
  const existing = await prisma.tenant.findUnique({ where: { slug: TECHBUBBLE_TENANT_SLUG } });
  if (existing) return existing.id;

  await prisma.plan.upsert({
    where: { slug: "growth" },
    create: {
      id: "plan_growth_v1",
      name: "Growth",
      slug: "growth",
      description: "Default CRM growth plan",
    },
    update: {},
  });

  const tenant = await prisma.tenant.create({
    data: {
      id: TECHBUBBLE_TENANT_ID,
      name: "TechBubble",
      slug: TECHBUBBLE_TENANT_SLUG,
      region: "au",
      planId: "plan_growth_v1",
      modules: {
        create: TENANT_MODULES.map((module) => ({ module, enabled: true })),
      },
    },
  });
  return tenant.id;
}

export async function resolveTenantContext(opts: {
  userId: string;
  viewAsTenantId?: string | null;
}): Promise<TenantContext> {
  const user = await prisma.adminUser.findUnique({
    where: { id: opts.userId },
    select: { id: true, isPlatformAdmin: true, role: true },
  });
  if (!user) {
    throw new Error("USER_NOT_FOUND");
  }

  const isPlatformAdmin = Boolean(user.isPlatformAdmin) || user.role === "admin";

  let tenantId = TECHBUBBLE_TENANT_ID;
  let supportSessionId: string | undefined;

  if (opts.viewAsTenantId && isPlatformAdmin) {
    const session = await prisma.supportAccessSession.findFirst({
      where: {
        tenantId: opts.viewAsTenantId,
        adminUserId: opts.userId,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });
    if (session) {
      tenantId = session.tenantId;
      supportSessionId = session.id;
    } else if (opts.viewAsTenantId) {
      // Allow platform admins to set view-as without a formal session for console browse,
      // but prefer membership / TechBubble when no explicit header.
      const target = await prisma.tenant.findUnique({ where: { id: opts.viewAsTenantId } });
      if (target) tenantId = target.id;
    }
  } else {
    const membership = await prisma.tenantMembership.findFirst({
      where: { adminUserId: opts.userId },
      orderBy: { createdAt: "asc" },
    });
    if (membership) {
      tenantId = membership.tenantId;
    } else {
      tenantId = await ensureTechBubbleTenant();
      if (isPlatformAdmin) {
        await prisma.tenantMembership.upsert({
          where: {
            tenantId_adminUserId: { tenantId, adminUserId: opts.userId },
          },
          create: { tenantId, adminUserId: opts.userId, role: "owner" },
          update: {},
        });
      }
    }
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: { modules: true },
  });
  if (!tenant) {
    throw new Error("TENANT_NOT_FOUND");
  }

  const membership = await prisma.tenantMembership.findUnique({
    where: {
      tenantId_adminUserId: { tenantId: tenant.id, adminUserId: opts.userId },
    },
  });

  const modules: Record<TenantModuleKey, boolean> = { ...DEFAULT_MODULES };
  for (const key of TENANT_MODULES) {
    const row = tenant.modules.find((m) => m.module === key);
    modules[key] = row ? row.enabled : DEFAULT_MODULES[key];
  }

  return {
    tenantId: tenant.id,
    tenantSlug: tenant.slug,
    tenantName: tenant.name,
    isPlatformAdmin,
    membershipRole: membership?.role ?? (isPlatformAdmin ? "owner" : null),
    modules,
    ...(supportSessionId ? { supportSessionId } : {}),
  };
}

export function tenantWhere(tenantId: string): { tenantId: string } {
  return { tenantId };
}
