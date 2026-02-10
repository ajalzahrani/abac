// src/config/nav.config.ts

export type NavItem = {
  label: string;
  href?: string; // Optional if item has children
  icon?: React.ReactNode;
  // ABAC
  requiredAction: string; // e.g., "view:documents", "manage:users" (required)
  resourceType: string; // e.g., "document", "user" (required)
  children?: NavItem[]; // 👈 Support nested items
};

export const NAV_ITEMS: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    requiredAction: "view:dashboard",
    resourceType: "dashboard",
  },
  {
    label: "Compliance Documents",
    href: "/user-documents",
    requiredAction: "view:compliance-document",
    resourceType: "compliance-document",
  },
  {
    label: "Profile",
    href: "/user-profile",
    requiredAction: "view:user-profile",
    resourceType: "user-profile",
  },
  {
    label: "Document Config",
    href: "/documents-config",
    requiredAction: "view:document-config",
    resourceType: "document-config",
  },
  {
    label: "Admin Dashboard",
    href: "/admin-dashboard",
    requiredAction: "view:admin-dashboard",
    resourceType: "admin-dashboard",
  },
  {
    label: "Documents",
    href: "/documents",
    requiredAction: "view:document",
    resourceType: "document",
  },
  {
    label: "Others",
    requiredAction: "view:other",
    resourceType: "other",
    children: [
      {
        label: "Certificates",
        href: "/categories",
        requiredAction: "view:certificate",
        resourceType: "category",
      },
      {
        label: "Job Titles",
        href: "/jobtitles",
        requiredAction: "view:job-title",
        resourceType: "jobtitle",
      },
      {
        label: "Reports",
        href: "/reports",
        requiredAction: "view:report",
        resourceType: "report",
      },
    ],
  },
  {
    label: "Management",
    requiredAction: "view:management",
    resourceType: "management",
    children: [
      {
        label: "Users",
        href: "/users",
        requiredAction: "view:users",
        resourceType: "user",
      },
      {
        label: "Roles",
        href: "/roles",
        requiredAction: "view:roles",
        resourceType: "role",
      },
      // {
      //   label: "Permissions",
      //   href: "/permissions",
      //   requiredAction: "view:permissions",
      //   resourceType: "permission",
      // },
      {
        label: "Departments",
        href: "/departments",
        requiredAction: "view:departments",
        resourceType: "department",
      },
    ],
  },

  // Add more items here...
];
