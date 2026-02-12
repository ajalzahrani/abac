// Attribute and resource options for policy creation
// Used in dropdowns when creating/editing policies

export const ATTRIBUTE_OPTIONS = [
  // User/Subject attributes
  { value: "user.id", label: "User ID" },
  { value: "user.email", label: "User Email" },
  { value: "user.name", label: "User Name" },
  { value: "user.role", label: "User Role" },
  { value: "user.departmentId", label: "User Department ID" },
  { value: "user.department", label: "User Department" },
  { value: "user.jobTitle", label: "User Job Title" },
  { value: "user.jobTitleId", label: "User Job Title ID" },
  // Resource attributes
  { value: "resource.id", label: "Resource ID" },
  { value: "resource.type", label: "Resource Type" },
  { value: "resource.status", label: "Resource Status" },
  { value: "resource.createdBy", label: "Resource Created By" },
  { value: "resource.expirationDate", label: "Resource Expiration Date" },
  { value: "resource.departmentId", label: "Resource Department ID" },
  { value: "resource.categoryId", label: "Resource Category ID" },
  { value: "resource.category", label: "Resource Category" },
  // Environment attributes
  { value: "environment.time", label: "Environment Time" },
  { value: "environment.ip", label: "Environment IP" },
] as const;

export const RESOURCE_TYPE_OPTIONS = [
  { value: "document", label: "Document" },
  { value: "compliance-document", label: "Compliance Document" },
  { value: "user", label: "User" },
  { value: "role", label: "Role" },
  { value: "department", label: "Department" },
  { value: "dashboard", label: "Dashboard" },
  { value: "document-config", label: "Document Config" },
  { value: "management", label: "Management" },
  { value: "admin-dashboard", label: "Admin Dashboard" },
  { value: "user-profile", label: "User Profile" },
  { value: "category", label: "Category" },
  { value: "jobtitle", label: "Job Title" },
  { value: "report", label: "Report" },
  { value: "policy", label: "Policy" },
] as const;

export const ACTION_OPTIONS = [
  // Document actions
  { value: "view:document", label: "View Document" },
  { value: "edit:document", label: "Edit Document" },
  { value: "delete:document", label: "Delete Document" },
  { value: "approve:document", label: "Approve Document" },
  { value: "reject:document", label: "Reject Document" },
  // Compliance document
  { value: "view:compliance-document", label: "View Compliance Document" },
  { value: "edit:compliance-document", label: "Edit Compliance Document" },
  { value: "delete:compliance-document", label: "Delete Compliance Document" },
  {
    value: "approve:compliance-document",
    label: "Approve Compliance Document",
  },
  // System actions
  { value: "view:dashboard", label: "View Dashboard" },
  { value: "view:document-config", label: "View Document Config" },
  { value: "view:management", label: "View Management" },
  { value: "view:users", label: "View Users" },
  { value: "view:roles", label: "View Roles" },
  { value: "view:departments", label: "View Departments" },
  { value: "view:admin-dashboard", label: "View Admin Dashboard" },
  { value: "view:user-profile", label: "View User Profile" },
  { value: "view:policies", label: "View Policies" },
  { value: "create:policy", label: "Create Policy" },
  { value: "edit:policy", label: "Edit Policy" },
  { value: "delete:policy", label: "Delete Policy" },
] as const;

export const VALUE_REFERENCE_OPTIONS = [
  { value: "user.id", label: "User ID" },
  { value: "user.role", label: "User Role" },
  { value: "user.departmentId", label: "User Department ID" },
  { value: "resource.createdBy", label: "Resource Created By" },
  { value: "resource.departmentId", label: "Resource Department ID" },
  { value: "resource.status", label: "Resource Status" },
] as const;
