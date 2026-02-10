// scripts/create-initial-policies.ts
import { prisma } from "../src/lib/prisma";

export async function createInitialPolicies() {
  console.log("Creating initial policies...");

  // Delete all existing policies
  await prisma.policy.deleteMany({});
  await prisma.policyRule.deleteMany({});
  await prisma.policyAssignment.deleteMany({});
  console.log("Deleted all existing policies");

  // ============================================
  // ADMIN CATCH-ALL POLICIES (Highest Priority)
  // ============================================
  // These policies allow ADMIN users to access everything
  // They are evaluated first due to low priority numbers
  
  const adminNavbarActions = [
    { action: "view:document-configs", resourceType: "document-config" },
    { action: "view:admin-dashboards", resourceType: "admin-dashboard" },
    { action: "view:management", resourceType: "management" },
    { action: "view:users", resourceType: "user" },
    { action: "view:roles", resourceType: "role" },
    { action: "view:permissions", resourceType: "permission" },
    { action: "view:departments", resourceType: "department" },
  ];

  for (const { action, resourceType } of adminNavbarActions) {
    await prisma.policy.create({
      data: {
        name: `Admin ${action}`,
        description: `Admin users can ${action}`,
        effect: "ALLOW",
        action: action,
        resourceType: resourceType,
        priority: 5, // High priority (evaluated early)
        isActive: true,
        rules: {
          create: [
            {
              attribute: "user.role",
              operator: "equals",
              value: "ADMIN",
              order: 0,
            },
          ],
        },
      },
    });
  }

  // Example: Allow users to view documents in their department
  await prisma.policy.create({
    data: {
      name: "View Department Documents",
      description: "Users can view documents in their department",
      effect: "ALLOW",
      action: "view:document",
      resourceType: "document",
      priority: 100,
      isActive: true,
      rules: {
        create: [
          {
            attribute: "user.departmentId",
            operator: "equals",
            value: "resource.departmentId",
            order: 0,
          },
        ],
      },
    },
  });

  // Example: Allow document creators to edit their own draft documents
  await prisma.policy.create({
    data: {
      name: "Edit Own Draft Documents",
      description: "Users can edit documents they created if status is DRAFT",
      effect: "ALLOW",
      action: "edit:document",
      resourceType: "document",
      priority: 50,
      isActive: true,
      rules: {
        create: [
          {
            attribute: "user.id",
            operator: "equals",
            value: "resource.createdBy",
            order: 0,
          },
          {
            attribute: "resource.status",
            operator: "equals",
            value: "DRAFT",
            logicalOperator: "AND",
            order: 1,
          },
        ],
      },
    },
  });

  // Navbar Policies - Allow users to view navigation items based on their attributes
  // View Documents - Allow all authenticated users to view documents menu
  // Note: For navbar items, we check generic access without a specific resource
  // Since all authenticated users should see this, we'll create a policy with no rules (always allow)
  await prisma.policy.create({
    data: {
      name: "View Documents Menu",
      description:
        "All authenticated users can see the Documents menu item in navbar",
      effect: "ALLOW",
      action: "view:documents",
      resourceType: "document",
      priority: 100,
      isActive: true,
      // No rules = always allow for authenticated users
    },
  });

  // View User Documents (Compliance Documents) - Same as above
  await prisma.policy.create({
    data: {
      name: "View Compliance Documents Menu",
      description:
        "All authenticated users can see the Compliance Documents menu item",
      effect: "ALLOW",
      action: "view:documents",
      resourceType: "document",
      priority: 100,
      isActive: true,
    },
  });

  // View Profile - All users can see their profile
  await prisma.policy.create({
    data: {
      name: "View Profile Menu",
      description: "All authenticated users can see their profile menu",
      effect: "ALLOW",
      action: "view:profiles",
      resourceType: "profile",
      priority: 100,
      isActive: true,
    },
  });

  // View Document Config - Only for admins or specific roles
  await prisma.policy.create({
    data: {
      name: "View Document Config Menu",
      description: "Admins can see Document Config menu",
      effect: "ALLOW",
      action: "view:document-configs",
      resourceType: "document-config",
      priority: 50,
      isActive: true,
      rules: {
        create: [
          {
            attribute: "user.role",
            operator: "in",
            value: ["ADMIN", "MANAGER"],
            order: 0,
          },
        ],
      },
    },
  });

  // View Admin Dashboard
  await prisma.policy.create({
    data: {
      name: "View Admin Dashboard Menu",
      description: "Admins can see Admin Dashboard menu",
      effect: "ALLOW",
      action: "view:admin-dashboards",
      resourceType: "admin-dashboard",
      priority: 50,
      isActive: true,
      rules: {
        create: [
          {
            attribute: "user.role",
            operator: "equals",
            value: "ADMIN",
            order: 0,
          },
        ],
      },
    },
  });

  // View Management Menu
  await prisma.policy.create({
    data: {
      name: "View Management Menu",
      description: "Admins and managers can see Management menu",
      effect: "ALLOW",
      action: "view:management",
      resourceType: "management",
      priority: 50,
      isActive: true,
      rules: {
        create: [
          {
            attribute: "user.role",
            operator: "in",
            value: ["ADMIN", "MANAGER"],
            order: 0,
          },
        ],
      },
    },
  });

  // View Categories - All authenticated users
  await prisma.policy.create({
    data: {
      name: "View Categories Menu",
      description: "All authenticated users can see Categories menu",
      effect: "ALLOW",
      action: "view:categories",
      resourceType: "category",
      priority: 100,
      isActive: true,
    },
  });

  // View Job Titles - All authenticated users
  await prisma.policy.create({
    data: {
      name: "View Job Titles Menu",
      description: "All authenticated users can see Job Titles menu",
      effect: "ALLOW",
      action: "view:jobtitles",
      resourceType: "jobtitle",
      priority: 100,
      isActive: true,
    },
  });

  // View Reports - All authenticated users
  await prisma.policy.create({
    data: {
      name: "View Reports Menu",
      description: "All authenticated users can see Reports menu",
      effect: "ALLOW",
      action: "view:reports",
      resourceType: "report",
      priority: 100,
      isActive: true,
    },
  });

  // View Users (Management)
  await prisma.policy.create({
    data: {
      name: "View Users Menu",
      description: "Admins can see Users menu",
      effect: "ALLOW",
      action: "view:users",
      resourceType: "user",
      priority: 50,
      isActive: true,
      rules: {
        create: [
          {
            attribute: "user.role",
            operator: "equals",
            value: "ADMIN",
            order: 0,
          },
        ],
      },
    },
  });

  // View Roles (Management)
  await prisma.policy.create({
    data: {
      name: "View Roles Menu",
      description: "Admins can see Roles menu",
      effect: "ALLOW",
      action: "view:roles",
      resourceType: "role",
      priority: 50,
      isActive: true,
      rules: {
        create: [
          {
            attribute: "user.role",
            operator: "equals",
            value: "ADMIN",
            order: 0,
          },
        ],
      },
    },
  });

  // View Permissions (Management)
  await prisma.policy.create({
    data: {
      name: "View Permissions Menu",
      description: "Admins can see Permissions menu",
      effect: "ALLOW",
      action: "view:permissions",
      resourceType: "permission",
      priority: 50,
      isActive: true,
      rules: {
        create: [
          {
            attribute: "user.role",
            operator: "equals",
            value: "ADMIN",
            order: 0,
          },
        ],
      },
    },
  });

  // View Departments (Management)
  await prisma.policy.create({
    data: {
      name: "View Departments Menu",
      description: "Admins and managers can see Departments menu",
      effect: "ALLOW",
      action: "view:departments",
      resourceType: "department",
      priority: 50,
      isActive: true,
      rules: {
        create: [
          {
            attribute: "user.role",
            operator: "in",
            value: ["ADMIN", "MANAGER"],
            order: 0,
          },
        ],
      },
    },
  });

  console.log("Initial policies created!");
}
