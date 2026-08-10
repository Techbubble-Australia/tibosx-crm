export const ADMIN_ROLES = ["admin", "editor", "viewer"] as const;

export type AdminRole = (typeof ADMIN_ROLES)[number];

export type RolePermission = {
  id: string;
  label: string;
  admin: boolean;
  editor: boolean;
  viewer: boolean;
};

export const ROLE_META: Record<
  AdminRole,
  { label: string; description: string }
> = {
  admin: {
    label: "Administrator",
    description: "Full access including user accounts, clients, and all content.",
  },
  editor: {
    label: "Editor",
    description: "Create and edit jobs, pages, case studies, and taxonomy settings.",
  },
  viewer: {
    label: "Viewer",
    description: "Read-only access. Cannot create, edit, or delete content.",
  },
};

export const ROLE_PERMISSIONS: RolePermission[] = [
  { id: "content", label: "Manage website content (jobs, pages, case studies, etc.)", admin: true, editor: true, viewer: false },
  { id: "taxonomy", label: "Manage categories, technologies, and departments", admin: true, editor: true, viewer: false },
  { id: "team", label: "Manage team members", admin: true, editor: true, viewer: false },
  { id: "applications", label: "View career applications and contact submissions", admin: true, editor: true, viewer: true },
  { id: "clients", label: "Manage clients (internal job assignments)", admin: true, editor: false, viewer: false },
  { id: "users", label: "Manage admin users and roles", admin: true, editor: false, viewer: false },
  { id: "security", label: "Configure own MFA (Security settings)", admin: true, editor: true, viewer: true },
];

export function isAdminRole(value: string): value is AdminRole {
  return (ADMIN_ROLES as readonly string[]).includes(value);
}

export function canMutateContent(role: string): boolean {
  return role === "admin" || role === "editor";
}

export function canManageUsers(role: string): boolean {
  return role === "admin";
}

export function canManageClients(role: string): boolean {
  return role === "admin";
}

export function roleLabel(role: string): string {
  if (isAdminRole(role)) {
    return ROLE_META[role].label;
  }
  return role;
}
