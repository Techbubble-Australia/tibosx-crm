export const ADMIN_ROLES = ["admin", "recruiter", "sales", "website"] as const;

export type AdminRole = (typeof ADMIN_ROLES)[number];

export type TbModule = "recruitment" | "website" | "sales" | "users";

export type RolePermission = {
  id: string;
  label: string;
  admin: boolean;
  recruiter: boolean;
  sales: boolean;
  website: boolean;
};

export const ROLE_META: Record<AdminRole, { label: string; description: string }> = {
  admin: {
    label: "Administrator",
    description: "Full access to Recruitment, Website, Sales, and user management.",
  },
  recruiter: {
    label: "Recruiter",
    description: "Access to the Recruitment module (profiles, career applications, dashboard).",
  },
  sales: {
    label: "Sales",
    description: "Access to the Sales module (clients and contacts).",
  },
  website: {
    label: "Website",
    description: "Access to the Website module (content, jobs, team members, taxonomy).",
  },
};

const MODULE_ROLE_MAP: Record<TbModule, readonly AdminRole[]> = {
  recruitment: ["admin", "recruiter"],
  website: ["admin", "website"],
  sales: ["admin", "sales"],
  users: ["admin"],
};

export const ROLE_PERMISSIONS: RolePermission[] = [
  {
    id: "recruitment",
    label: "Recruitment module (dashboard, profiles, job listings)",
    admin: true,
    recruiter: true,
    sales: false,
    website: false,
  },
  {
    id: "website",
    label: "Website module (pages, jobs, case studies, team, taxonomy)",
    admin: true,
    recruiter: false,
    sales: false,
    website: true,
  },
  {
    id: "sales",
    label: "Sales module (clients and contacts)",
    admin: true,
    recruiter: false,
    sales: true,
    website: false,
  },
  {
    id: "users",
    label: "Manage TBOS users and roles",
    admin: true,
    recruiter: false,
    sales: false,
    website: false,
  },
  {
    id: "security",
    label: "Configure own MFA (Security settings)",
    admin: true,
    recruiter: true,
    sales: true,
    website: true,
  },
];

export function isAdminRole(value: string): value is AdminRole {
  return (ADMIN_ROLES as readonly string[]).includes(value);
}

export function canAccessModule(role: string, module: TbModule): boolean {
  if (!isAdminRole(role)) return false;
  return MODULE_ROLE_MAP[module].includes(role);
}

export function canMutateContent(role: string): boolean {
  return isAdminRole(role);
}

export function canManageUsers(role: string): boolean {
  return canAccessModule(role, "users");
}

export function canManageClients(role: string): boolean {
  return canAccessModule(role, "sales");
}

export function canManageJobs(role: string): boolean {
  return role === "admin" || role === "website";
}

export function canViewJobs(role: string): boolean {
  return canManageJobs(role) || role === "recruiter";
}

export function canEditProfiles(role: string): boolean {
  return canAccessRecruitment(role);
}

export function canDeleteProfiles(role: string): boolean {
  return role === "admin";
}

export function canManageProfileOwnership(role: string): boolean {
  return role === "admin";
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

export function roleLabel(role: string): string {
  if (isAdminRole(role)) {
    return ROLE_META[role].label;
  }
  return role;
}

export function defaultLandingPath(role: string): string {
  if (canAccessRecruitment(role)) return "/database/dashboard";
  if (canAccessWebsite(role)) return "/pages";
  if (canAccessSales(role)) return "/clients";
  return "/settings/security";
}
