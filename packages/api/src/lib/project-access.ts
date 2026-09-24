import type { AuthRequest } from "../middleware/auth";

export function isProjectManagerRole(role: string): boolean {
  return role === "admin" || role === "project_manager";
}

export function isProjectMemberRole(role: string): boolean {
  return role === "project_member";
}

export function canManageProjects(role: string): boolean {
  return isProjectManagerRole(role);
}

export function canManageAllTimesheets(role: string): boolean {
  return isProjectManagerRole(role);
}

export function getActorId(req: AuthRequest): string {
  return req.user?.id ?? "";
}
