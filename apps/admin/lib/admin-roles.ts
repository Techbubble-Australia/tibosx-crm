export const ADMIN_ROLES = [
  "admin",
  "recruiter_admin",
  "recruiter",
  "sales",
  "website",
  "project_manager",
  "project_member",
  "customer_support",
  "client",
] as const;

export type AdminRole = (typeof ADMIN_ROLES)[number];

export type TbModule = "recruitment" | "website" | "sales" | "users" | "project_management" | "workspace";

export type RolePermission = {
  id: string;
  label: string;
  admin: boolean;
  recruiter_admin: boolean;
  recruiter: boolean;
  sales: boolean;
  website: boolean;
  project_manager: boolean;
  project_member: boolean;
  customer_support: boolean;
  client: boolean;
};

export const ROLE_META: Record<AdminRole, { label: string; description: string }> = {
  admin: {
    label: "Administrator",
    description: "Full access to all modules and user management.",
  },
  recruiter_admin: {
    label: "Recruiter admin",
    description: "Full add/edit/delete/read access to the Recruitment module only.",
  },
  recruiter: {
    label: "Recruiter",
    description: "Access to the Recruitment module (profiles, career applications, dashboard).",
  },
  sales: {
    label: "Sales",
    description: "Access to the Sales module (clients, opportunities, and contacts).",
  },
  website: {
    label: "Website",
    description: "Access to the Website module (content, jobs, team members, taxonomy).",
  },
  project_manager: {
    label: "Project manager",
    description: "Manage projects and approve timesheets for assigned projects.",
  },
  project_member: {
    label: "Project member",
    description: "Submit and manage own timesheets for assigned active projects.",
  },
  customer_support: {
    label: "Customer support",
    description: "Workspace module — support tickets and client case management.",
  },
  client: {
    label: "Client",
    description: "Support portal access for end clients (no TBOS modules).",
  },
};

const MODULE_ROLE_MAP: Record<TbModule, readonly AdminRole[]> = {
  recruitment: ["admin", "recruiter_admin", "recruiter"],
  website: ["admin", "website"],
  sales: ["admin", "sales"],
  users: ["admin"],
  project_management: ["admin", "project_manager", "project_member"],
  workspace: ["admin", "customer_support"],
};

const denyAllExceptSecurity: Record<AdminRole, boolean> = {
  admin: true,
  recruiter_admin: true,
  recruiter: true,
  sales: true,
  website: true,
  project_manager: true,
  project_member: true,
  customer_support: true,
  client: false,
};

export const ROLE_PERMISSIONS: RolePermission[] = [
  {
    id: "recruitment",
    label: "Recruitment module (dashboard, profiles, job listings)",
    admin: true,
    recruiter_admin: true,
    recruiter: true,
    sales: false,
    website: false,
    project_manager: false,
    project_member: false,
    customer_support: false,
    client: false,
  },
  {
    id: "website",
    label: "Website module (pages, jobs, case studies, team, taxonomy)",
    admin: true,
    recruiter_admin: false,
    recruiter: false,
    sales: false,
    website: true,
    project_manager: false,
    project_member: false,
    customer_support: false,
    client: false,
  },
  {
    id: "sales",
    label: "Sales module (clients and contacts)",
    admin: true,
    recruiter_admin: false,
    recruiter: false,
    sales: true,
    website: false,
    project_manager: false,
    project_member: false,
    customer_support: false,
    client: false,
  },
  {
    id: "project_management",
    label: "Project Management module (projects, timesheets)",
    admin: true,
    recruiter_admin: false,
    recruiter: false,
    sales: false,
    website: false,
    project_manager: true,
    project_member: true,
    customer_support: false,
    client: false,
  },
  {
    id: "workspace",
    label: "Workspace module (support tickets)",
    admin: true,
    recruiter_admin: false,
    recruiter: false,
    sales: false,
    website: false,
    project_manager: false,
    project_member: false,
    customer_support: true,
    client: false,
  },
  {
    id: "users",
    label: "Manage TBOS users and roles",
    admin: true,
    recruiter_admin: false,
    recruiter: false,
    sales: false,
    website: false,
    project_manager: false,
    project_member: false,
    customer_support: false,
    client: false,
  },
  {
    id: "support_portal",
    label: "Support portal (client ticketing)",
    admin: true,
    recruiter_admin: false,
    recruiter: false,
    sales: true,
    website: false,
    project_manager: false,
    project_member: false,
    customer_support: true,
    client: true,
  },
  {
    id: "security",
    label: "Configure own MFA (Security settings)",
    admin: true,
    recruiter_admin: true,
    recruiter: true,
    sales: true,
    website: true,
    project_manager: true,
    project_member: true,
    customer_support: true,
    client: true,
  },
];

export function isAdminRole(value: string): value is AdminRole {
  return (ADMIN_ROLES as readonly string[]).includes(value);
}

/** Primary role plus any additional roles assigned on the user record. */
export function getEffectiveRoles(primary: string, additional?: string[] | null): AdminRole[] {
  const seen = new Set<AdminRole>();
  const add = (value: string) => {
    if (isAdminRole(value)) seen.add(value);
  };
  add(primary);
  for (const value of additional ?? []) add(value);
  return [...seen];
}

export function anyEffectiveRole(
  primary: string,
  additional: string[] | null | undefined,
  allowed: readonly string[],
): boolean {
  return getEffectiveRoles(primary, additional).some((r) => allowed.includes(r));
}

export function canAccessModule(role: string, module: TbModule): boolean {
  if (!isAdminRole(role)) return false;
  if (role === "client") return false;
  return MODULE_ROLE_MAP[module].includes(role);
}

export function canAccessModuleWithRoles(
  primary: string,
  additional: string[] | null | undefined,
  module: TbModule,
): boolean {
  return getEffectiveRoles(primary, additional).some((r) => canAccessModule(r, module));
}

export function canAccessTbosModules(role: string): boolean {
  if (!isAdminRole(role)) return false;
  return denyAllExceptSecurity[role];
}

export function canMutateContent(role: string): boolean {
  return isAdminRole(role) && role !== "client";
}

export function canManageUsers(role: string): boolean {
  return canAccessModule(role, "users");
}

export function canManageClients(role: string): boolean {
  return canAccessModule(role, "sales");
}

export function canManageJobs(role: string): boolean {
  return role === "admin" || role === "website" || role === "recruiter_admin";
}

export function canViewJobs(role: string): boolean {
  return canManageJobs(role) || role === "recruiter" || role === "recruiter_admin";
}

export function canEditProfiles(role: string): boolean {
  return canAccessRecruitment(role);
}

export function canDeleteProfiles(role: string): boolean {
  return role === "admin" || role === "recruiter_admin";
}

export function canManageProfileOwnership(role: string): boolean {
  return role === "admin" || role === "recruiter_admin";
}

export function canAccessRecruitment(role: string): boolean {
  return canAccessModule(role, "recruitment");
}

export function canAccessWebsite(role: string): boolean {
  return canAccessModule(role, "website");
}

export function canAccessSales(role: string): boolean {
  return canAccessModule(role, "sales");
}

export function canAccessProjectManagement(role: string): boolean {
  return canAccessModule(role, "project_management");
}

export function canAccessWorkspace(role: string): boolean {
  return canAccessModule(role, "workspace");
}

export function canManageProjects(role: string): boolean {
  return role === "admin" || role === "project_manager";
}

export function isProjectMember(role: string): boolean {
  return role === "project_member";
}

export function isEffectiveProjectMember(primary: string, additional?: string[] | null): boolean {
  return anyEffectiveRole(primary, additional, ["project_member"]);
}

export function roleLabel(role: string): string {
  if (isAdminRole(role)) {
    return ROLE_META[role].label;
  }
  return role;
}

export function formatRolesLabel(primary: string, additional?: string[] | null): string {
  const labels = getEffectiveRoles(primary, additional).map((r) => roleLabel(r));
  return labels.length ? labels.join(", ") : roleLabel(primary);
}

/** Post-login landing route (relative TBOS path or absolute support portal URL for clients). */
export function defaultLandingPath(role: string): string {
  if (role === "client") {
    const base = (process.env.NEXT_PUBLIC_TICKETING_PORTAL_URL || "http://localhost:3004").replace(
      /\/$/,
      "",
    );
    return `${base.replace(/\/login$/i, "")}/login`;
  }
  if (role === "customer_support") return "/support-tickets";
  if (role === "admin" || role === "sales") return "/sales/dashboard";
  if (role === "recruiter_admin" || role === "recruiter") return "/database/dashboard";
  if (role === "website") return "/pages";
  if (role === "project_manager" || role === "project_member") return "/projects";
  return "/sales/dashboard";
}

export function isExternalLandingPath(path: string): boolean {
  return /^https?:\/\//i.test(path);
}
