"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import {
  PolicyFormValues,
  policySchema,
  PolicyRuleFormValues,
} from "./policies.validation";

export async function getPolicies() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return { success: false, error: "Not authenticated" };
  }

  try {
    const policies = await prisma.policy.findMany({
      orderBy: [{ priority: "asc" }, { name: "asc" }],
      include: {
        rules: {
          orderBy: { order: "asc" },
        },
      },
    });

    return {
      success: true,
      policies,
    };
  } catch (error) {
    console.error("Error fetching policies:", error);
    return { success: false, error: "Failed to fetch policies" };
  }
}

export async function getPolicyById(policyId: string) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return { success: false, error: "Not authenticated" };
  }

  try {
    const policy = await prisma.policy.findUnique({
      where: { id: policyId },
      include: {
        rules: {
          orderBy: [{ groupIndex: "asc" }, { order: "asc" }],
        },
      },
    });

    if (!policy) {
      return { success: false, error: "Policy not found" };
    }

    return {
      success: true,
      policy,
    };
  } catch (error) {
    console.error("Error fetching policy:", error);
    return { success: false, error: "Failed to fetch policy" };
  }
}

function mapRuleToPrisma(
  rule: PolicyRuleFormValues,
  index: number
) {
  return {
    attribute: rule.attribute,
    operator: rule.operator as "equals" | "notEquals" | "in" | "notIn" | "contains" | "notContains" | "greaterThan" | "lessThan" | "greaterThanOrEqual" | "lessThanOrEqual" | "exists" | "notExists" | "regex",
    value: rule.value ?? null,
    logicalOperator: (rule.logicalOperator ?? "AND") as "AND" | "OR",
    order: rule.order ?? index,
    groupIndex: rule.groupIndex ?? null,
    groupCombineOperator: (rule.groupCombineOperator ?? null) as "AND" | "OR" | null,
  };
}

export async function createPolicy(data: PolicyFormValues) {
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== "ADMIN") {
    return { success: false, error: "Not authorized" };
  }

  try {
    const validatedData = policySchema.parse(data);

    const existingPolicy = await prisma.policy.findUnique({
      where: { name: validatedData.name },
    });

    if (existingPolicy) {
      return { success: false, error: "Policy name already exists" };
    }

    const rulesCreate = (validatedData.rules ?? []).map((r, i) =>
      mapRuleToPrisma(r, i)
    );
    const policy = await prisma.policy.create({
      data: {
        name: validatedData.name,
        description: validatedData.description ?? null,
        effect: validatedData.effect,
        action: validatedData.action,
        resourceType: validatedData.resourceType,
        priority: validatedData.priority,
        isActive: validatedData.isActive,
        rules: { create: rulesCreate as never },
      },
      include: { rules: true },
    });

    revalidatePath("/policies");
    return { success: true, policy };
  } catch (error) {
    console.error("Error creating policy:", error);
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: "Validation failed",
        issues: error.errors,
      };
    }
    return { success: false, error: "Failed to create policy" };
  }
}

export async function updatePolicy(policyId: string, data: PolicyFormValues) {
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== "ADMIN") {
    return { success: false, error: "Not authorized" };
  }

  try {
    const validatedData = policySchema.parse(data);

    const existingPolicy = await prisma.policy.findFirst({
      where: {
        name: validatedData.name,
        NOT: { id: policyId },
      },
    });

    if (existingPolicy) {
      return { success: false, error: "Policy name already in use" };
    }

    const rulesCreate = (validatedData.rules ?? []).map((r, i) =>
      mapRuleToPrisma(r, i)
    );
    await prisma.$transaction(async (tx) => {
      await tx.policyRule.deleteMany({ where: { policyId } });
      await tx.policy.update({
        where: { id: policyId },
        data: {
          name: validatedData.name,
          description: validatedData.description ?? null,
          effect: validatedData.effect,
          action: validatedData.action,
          resourceType: validatedData.resourceType,
          priority: validatedData.priority,
          isActive: validatedData.isActive,
          rules: { create: rulesCreate as never },
        },
      });
    });

    revalidatePath("/policies");
    revalidatePath(`/policies/${policyId}`);
    return { success: true };
  } catch (error) {
    console.error("Error updating policy:", error);
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0];
      const msg = firstError ? `${firstError.path.join(".")}: ${firstError.message}` : "Validation failed";
      return { success: false, error: msg };
    }
    return { success: false, error: "Failed to update policy" };
  }
}

export async function deletePolicy(policyId: string) {
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== "ADMIN") {
    return { success: false, error: "Not authorized" };
  }

  try {
    const policy = await prisma.policy.findUnique({
      where: { id: policyId },
    });

    if (!policy) {
      return { success: false, error: "Policy not found" };
    }

    await prisma.policy.delete({
      where: { id: policyId },
    });

    revalidatePath("/policies");
    return { success: true };
  } catch (error) {
    console.error("Error deleting policy:", error);
    return { success: false, error: "Failed to delete policy" };
  }
}

export async function togglePolicyActive(policyId: string, isActive: boolean) {
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== "ADMIN") {
    return { success: false, error: "Not authorized" };
  }

  try {
    await prisma.policy.update({
      where: { id: policyId },
      data: { isActive },
    });

    revalidatePath("/policies");
    revalidatePath(`/policies/${policyId}`);
    return { success: true };
  } catch (error) {
    console.error("Error toggling policy:", error);
    return { success: false, error: "Failed to update policy status" };
  }
}
