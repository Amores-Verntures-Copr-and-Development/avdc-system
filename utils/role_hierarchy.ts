export const ROLE_HIERARCHY: Record<string, string[]> = {
  admin: ["employee", "purchaser", "supervisor", "accounting", "hr", "staff"],
  employee: ["purchaser", "supervisor", "accounting", "hr", "staff"],
  purchaser: [],
  supervisor: [],
  accounting: [],
  hr: [],
  staff: [],
};

export function getEffectiveRoles(role: string): string[] {
  return [role, ...(ROLE_HIERARCHY[role] || [])];
}
