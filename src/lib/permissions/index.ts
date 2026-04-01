// Role hierarchy: admin > approver > editor > viewer
export type AppRole = "admin" | "approver" | "editor" | "viewer";

const ROLE_RANK: Record<AppRole, number> = {
  admin: 4,
  approver: 3,
  editor: 2,
  viewer: 1,
};

export function hasRole(userRole: AppRole | undefined, required: AppRole): boolean {
  if (!userRole) return false;
  return ROLE_RANK[userRole] >= ROLE_RANK[required];
}

export function canView(role: AppRole | undefined): boolean {
  return hasRole(role, "viewer");
}

export function canEdit(role: AppRole | undefined): boolean {
  return hasRole(role, "editor");
}

export function canApprove(role: AppRole | undefined): boolean {
  return hasRole(role, "approver");
}

export function canAdmin(role: AppRole | undefined): boolean {
  return hasRole(role, "admin");
}
