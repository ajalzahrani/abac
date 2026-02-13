import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { checkABACAccess, checkABACAccessWithResource } from "./abac";
import { getUserSubjectAttributes } from "./permissions";

/**
 * ABAC server-side access check
 * @param action - Action being performed (e.g., "view:document", "delete:document")
 * @param resourceType - Type of resource (e.g., "document", "user")
 * @param resourceId - Optional resource ID (will fetch resource from DB if provided)
 * @param resource - Optional resource attributes (if resourceId not provided)
 * @param redirectToUnauthorized - Whether to redirect to unauthorized page (default: true)
 */
export async function checkServerABACAccess(
  action: string,
  resourceType: string,
  resourceId?: string,
  resource?: { [key: string]: any },
  redirectToUnauthorized: boolean = true,
) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const subject = getUserSubjectAttributes(user);

  let hasAccess = false;

  if (resourceId) {
    // Fetch resource from database
    hasAccess = await checkABACAccessWithResource(
      subject,
      resourceType,
      resourceId,
      action,
    );
  } else if (resource) {
    // Use provided resource attributes
    hasAccess = await checkABACAccess(
      subject,
      { ...resource, type: resourceType },
      action,
    );
  } else {
    // Generic resource check (no specific resource)
    hasAccess = await checkABACAccess(subject, { type: resourceType }, action);
  }

  if (!hasAccess) {
    if (redirectToUnauthorized) {
      redirect("/unauthorized");
    }
    return false;
  }

  return true;
}
