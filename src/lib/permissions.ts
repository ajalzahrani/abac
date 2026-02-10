// src/lib/permissions.ts
import "server-only";
import { checkABACAccess } from "./abac";
import { SubjectAttributes } from "./abac-types";

/**
 * ABAC access check - checks access based on attributes
 * This function is server-only and should not be used in client components.
 * Use the API route /api/abac/check instead for client-side checks.
 * @param subject - User/subject attributes
 * @param resource - Resource attributes
 * @param action - Action being performed (e.g., "view:document", "delete:document")
 * @param environment - Optional environment attributes
 */
export async function checkABACPermission(
  subject: SubjectAttributes,
  resource: { type: string; [key: string]: any },
  action: string,
  environment?: { [key: string]: any },
): Promise<boolean> {
  return checkABACAccess(subject, resource, action, environment);
}

// Re-export client-safe function for backward compatibility
export { getUserSubjectAttributes } from "./permissions-client";
