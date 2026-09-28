export const ADMIN_ROLES = [
  "admin",
  "recruiter_admin",
  "recruiter",
  "sales",
  "website",
  "project_manager",
  "project_member",
] as const;

export type AdminRole = (typeof ADMIN_ROLES)[number];

export type TbModule = "recruitment" | "website" | "sales" | "users" | "project_management";

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
};

const MODULE_ROLE_MAP: Record<TbModule, readonly AdminRole[]> = {
  recruitment: ["admin", "recruiter_admin", "recruiter"],
  website: ["admin", "website"],
  sales: ["admin", "sales"],
  users: ["admin"],
  project_management: ["admin", "project_manager", "project_member"],
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

export function canManageProjects(role: string): boolean {
  return role === "admin" || role === "project_manager";
}

export function isProjectMember(role: string): boolean {
  return role === "project_member";
}

export function roleLabel(role: string): string {
  if (isAdminRole(role)) {
    return ROLE_META[role].label;
  }
  return role;
}

export function defaultLandingPath(role: string): string {
  if (canAccessRecruitment(role)) return "/database/dashboard";
  if (canAccessProjectManagement(role)) {
    return canManageProjects(role) ? "/projects" : "/agreement";
  }
  if (canAccessWebsite(role)) return "/pages";
  if (canAccessSales(role)) return "/clients/active";
  return "/settings/security";
}
