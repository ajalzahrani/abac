import { PrismaClient } from "../generated/prisma/client";
import "dotenv/config";

const prisma = new PrismaClient();

async function main() {
  // Delete all existing policies
  await prisma.policy.deleteMany({});
  await prisma.policyRule.deleteMany({});
  await prisma.policyAssignment.deleteMany({});
  console.log("Deleted all existing policies");

  // Create initial policies
  console.log("Creating low policies");
  await prisma.policy.create({
    data: {
      name: "View Dashboard",
      description: "View the dashboard",
      effect: "ALLOW",
      action: "view:dashboard",
      resourceType: "dashboard",
      priority: 100,
      isActive: true,
      rules: {
        create: [],
      },
    },
  });

  await prisma.policy.create({
    data: {
      name: "View Documents Configuration",
      description: "View the documents configuration",
      effect: "ALLOW",
      action: "view:document-config",
      resourceType: "document-config",
      priority: 100,
      isActive: true,
      rules: {
        create: [
          {
            attribute: "user.role",
            operator: "in",
            value: ["ADMIN", "AUDITOR"],
            order: 0,
          },
        ],
      },
    },
  });

  await prisma.policy.create({
    data: {
      name: "View System Management",
      description: "View the system management",
      effect: "ALLOW",
      action: "view:management",
      resourceType: "management",
      priority: 100,
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

  await prisma.policy.create({
    data: {
      name: "View Policies",
      description: "View and manage ABAC policies",
      effect: "ALLOW",
      action: "view:policies",
      resourceType: "policy",
      priority: 100,
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

  await prisma.policy.create({
    data: {
      name: "View Users",
      description: "View the users",
      effect: "ALLOW",
      action: "view:users",
      resourceType: "user",
      priority: 100,
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

  await prisma.policy.create({
    data: {
      name: "View Documents Menu",
      description: "View the documents menu",
      effect: "ALLOW",
      action: "view:document",
      resourceType: "document",
      priority: 100,
      isActive: true,
      rules: {
        create: [
          {
            attribute: "user.role",
            operator: "in",
            value: ["ADMIN", "AUDITOR"],
            order: 0,
          },
        ],
      },
    },
  });

  await prisma.policy.create({
    data: {
      name: "View Compliance Documents",
      description: "View the compliance documents",
      effect: "ALLOW",
      action: "view:compliance-document",
      resourceType: "compliance-document",
      priority: 100,
      isActive: true,
      rules: {
        create: [
          {
            attribute: "user.role",
            operator: "equals",
            value: "ADMIN",
            order: 0,
          },
          {
            attribute: "user.jobTitle",
            operator: "in",
            value: ["Doctor", "Nurse", "Technician"],
            logicalOperator: "OR",
            order: 1,
          },
        ],
      },
    },
  });

  // Single policy with grouped conditions: ADMIN OR (own document AND status in [DRAFT, REJECTED])
  // Uses groupIndex for mixed logic: (rule OR rule) AND rule patterns
  await prisma.policy.create({
    data: {
      name: "Delete Compliance Documents",
      description:
        "Admins can delete any compliance document; users can delete their own if status is DRAFT or REJECTED",
      effect: "ALLOW",
      action: "delete:compliance-document",
      resourceType: "compliance-document",
      priority: 100,
      isActive: true,
      rules: {
        create: [
          {
            attribute: "user.role",
            operator: "equals",
            value: "ADMIN",
            order: 0,
            groupIndex: 1, // Group 1: ADMIN (evaluated first)
            logicalOperator: "OR", // Combine with group 2: ADMIN OR (group 2)
          },
          {
            attribute: "user.id",
            operator: "equals",
            value: "resource.createdBy",
            order: 1,
            groupIndex: 2, // Group 2: own document AND status ok
          },
          {
            attribute: "resource.status",
            operator: "in",
            value: ["DRAFT", "REJECTED"],
            logicalOperator: "AND",
            order: 2,
            groupIndex: 2,
            groupCombineOperator: "OR", // Group 2 OR Group 3
          },
          {
            attribute: "user.role",
            operator: "equals",
            value: "AUDITOR",
            order: 3,
            groupIndex: 3, // Group 3: AUDITOR AND status != APPROVED
            logicalOperator: "AND",
          },
          {
            attribute: "resource.status",
            operator: "notEquals",
            value: "APPROVED",
            logicalOperator: "AND",
            order: 4,
            groupIndex: 3,
          },
        ],
      },
    },
  });

  await prisma.policy.create({
    data: {
      name: "Approve Compliance Documents",
      description: "Approve the compliance documents",
      effect: "ALLOW",
      action: "approve:compliance-document",
      resourceType: "compliance-document",
      priority: 100,
      isActive: true,
      rules: {
        create: [
          {
            attribute: "user.role",
            operator: "in",
            value: ["ADMIN", "AUDITOR"],
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

  await prisma.policy.create({
    data: {
      name: "Edit Compliance Documents",
      description: "Edit the compliance documents",
      effect: "ALLOW",
      action: "edit:compliance-document",
      resourceType: "compliance-document",
      priority: 100,
      isActive: true,
      rules: {
        create: [
          {
            attribute: "user.role",
            operator: "in",
            value: ["ADMIN", "AUDITOR"],
            order: 0,
            groupIndex: 1,
            groupCombineOperator: "OR", // Group 1 OR Group 2
          },
          {
            attribute: "resource.status",
            operator: "in",
            value: ["DRAFT", "REJECTED"],
            logicalOperator: "AND",
            order: 1,
            groupIndex: 2,
          },
          {
            attribute: "user.id",
            operator: "equals",
            value: "resource.createdBy",
            order: 2,
            groupIndex: 2,
            groupCombineOperator: "OR", // Group 2 OR Group 3
          },
          {
            attribute: "resource.expirationDate",
            operator: "lessThanOrEqual",
            value: new Date(),
            order: 3,
            groupIndex: 3,
            logicalOperator: "AND",
          },
          {
            attribute: "user.id",
            operator: "equals",
            value: "resource.createdBy",
            order: 4,
            groupIndex: 3,
            logicalOperator: "AND",
          },
          {
            attribute: "resource.status",
            operator: "equals",
            value: "APPROVED",
            order: 5,
            groupIndex: 3,
            logicalOperator: "AND",
          },
        ],
      },
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
