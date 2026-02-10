// scripts/test-abac-policies.ts
// Test script to verify ABAC policies are working correctly

import "dotenv/config";
import { prisma } from "../src/lib/prisma";
import { checkABACAccess } from "../src/lib/abac";
import { getUserSubjectAttributes } from "../src/lib/permissions";

async function testPolicies() {
  console.log("Testing ABAC Policies...\n");

  // Test database connection first
  try {
    await prisma.$connect();
    console.log("✓ Database connection successful\n");
  } catch (error: any) {
    console.error("✗ Database connection failed!");
    if (error.message?.includes("Can't reach database server")) {
      console.error(
        "\nPlease make sure your PostgreSQL database is running and accessible.",
      );
      console.error(
        `Database URL: ${process.env.DATABASE_URL?.replace(/:[^:@]+@/, ":****@") || "Not set"}`,
      );
    } else {
      console.error(`Error: ${error.message}`);
    }
    process.exit(1);
  }

  // Get a test user (or use the first user)
  const user = await prisma.user.findFirst({
    include: {
      role: true,
      department: true,
      person: {
        include: {
          jobTitle: true,
        },
      },
    },
  });

  if (!user) {
    console.error("No users found in database!");
    return;
  }

  console.log(`Testing with user: ${user.name} (${user.email})`);
  console.log(`Role: ${user.role?.name}`);
  console.log(`Department: ${user.department?.name || "None"}`);
  console.log(`Job Title: ${user.person?.[0]?.jobTitle?.nameEn || "None"}\n`);

  const subject = getUserSubjectAttributes({
    id: user.id,
    email: user.email,
    name: user.name,
    roleId: user.roleId,
    role: user.role?.name,
    departmentId: user.departmentId || undefined,
    department: user.department?.name,
    jobTitleId: user.person?.[0]?.jobTitleId,
    jobTitle: user.person?.[0]?.jobTitle?.nameEn,
  });

  // Test navbar actions
  const navbarTests = [
    { action: "view:documents", resourceType: "document" },
    { action: "view:profiles", resourceType: "profile" },
    { action: "view:document-configs", resourceType: "document-config" },
    { action: "view:admin-dashboards", resourceType: "admin-dashboard" },
    { action: "view:management", resourceType: "management" },
    { action: "view:categories", resourceType: "category" },
    { action: "view:jobtitles", resourceType: "jobtitle" },
    { action: "view:reports", resourceType: "report" },
    { action: "view:users", resourceType: "user" },
    { action: "view:roles", resourceType: "role" },
    { action: "view:permissions", resourceType: "permission" },
    { action: "view:departments", resourceType: "department" },
  ];

  console.log("Testing Navbar Access:\n");
  for (const test of navbarTests) {
    try {
      const allowed = await checkABACAccess(
        subject,
        { type: test.resourceType },
        test.action,
      );
      console.log(
        `  ${test.action} (${test.resourceType}): ${allowed ? "✅ ALLOWED" : "❌ DENIED"}`,
      );
    } catch (error) {
      console.error(`  ${test.action}: ERROR - ${error}`);
    }
  }

  // Check what policies exist
  console.log("\n\nChecking Policies in Database:\n");
  const allPolicies = await prisma.policy.findMany({
    where: { isActive: true },
    include: {
      rules: true,
      assignments: true,
    },
    orderBy: { priority: "asc" },
  });

  console.log(`Found ${allPolicies.length} active policies:\n`);
  allPolicies.forEach((policy) => {
    console.log(`  Policy: ${policy.name}`);
    console.log(
      `    Action: ${policy.action}, ResourceType: ${policy.resourceType}`,
    );
    console.log(`    Effect: ${policy.effect}, Priority: ${policy.priority}`);
    console.log(
      `    Rules: ${policy.rules.length}, Assignments: ${policy.assignments.length}`,
    );
    if (policy.rules.length > 0) {
      policy.rules.forEach((rule) => {
        console.log(
          `      - ${rule.attribute} ${rule.operator} ${JSON.stringify(rule.value)}`,
        );
      });
    }
    console.log("");
  });

  // Disconnect from database
  await prisma.$disconnect();
}

testPolicies()
  .catch((error) => {
    console.error("\n✗ Test failed with error:");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
