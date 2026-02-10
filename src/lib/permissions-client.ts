// src/lib/permissions-client.ts
// Client-safe permission utilities (no server-only imports)

import { SubjectAttributes } from "./abac-types";

/**
 * Helper to convert session user to subject attributes
 * This function is safe to use in client components
 */
export function getUserSubjectAttributes(user: {
  id: string;
  roleId?: string;
  role?: string;
  departmentId?: string;
  department?: string;
  jobTitleId?: string;
  jobTitle?: string;
  [key: string]: any;
}): SubjectAttributes {
  const {
    id,
    email,
    name,
    roleId,
    role,
    departmentId,
    department,
    jobTitleId,
    jobTitle,
    ...rest
  } = user;
  return {
    id,
    email,
    name,
    roleId,
    role,
    departmentId,
    department,
    jobTitleId,
    jobTitle,
    ...rest,
  };
}
