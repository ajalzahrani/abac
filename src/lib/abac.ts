// src/lib/abac.ts
// Attribute-Based Access Control (ABAC) Evaluation Engine

import "server-only";
import { prisma } from "./prisma";
import type {
  SubjectAttributes,
  ResourceAttributes,
  EnvironmentAttributes,
} from "./abac-types";

enum PolicyEffect {
  ALLOW,
  DENY,
}
enum PolicyRuleOperator {
  equals,
  notEquals,
  in,
  notIn,
  contains,
  notContains,
  greaterThan,
  lessThan,
  greaterThanOrEqual,
  lessThanOrEqual,
  exists,
  notExists,
  regex,
}
enum LogicalOperator {
  AND,
  OR,
}

// Re-export types from abac-types for backward compatibility
export type {
  SubjectAttributes,
  ResourceAttributes,
  EnvironmentAttributes,
} from "./abac-types";

export interface AccessRequest {
  subject: SubjectAttributes;
  resource: ResourceAttributes;
  action: string;
  environment?: EnvironmentAttributes;
}

interface PolicyRule {
  id: string;
  attribute: string;
  operator: PolicyRuleOperator | string; // Can be enum or string from Prisma
  value: any;
  logicalOperator: LogicalOperator | string | null; // Can be enum or string from Prisma
  order: number;
  groupIndex?: number | null; // Rules with same groupIndex form a group. Enables (A OR B) AND C patterns.
  groupCombineOperator?: LogicalOperator | string | null; // How group combines with next group (last rule only). Overrides logicalOperator for group-to-group.
}

interface Policy {
  id: string;
  name: string;
  effect: PolicyEffect | string; // Can be enum or string from Prisma
  action: string;
  resourceType: string;
  priority: number;
  isActive: boolean;
  rules: PolicyRule[];
}

/**
 * Get attribute value from subject, resource, or environment
 */
function getAttributeValue(
  attributePath: string,
  subject: SubjectAttributes,
  resource: ResourceAttributes,
  environment?: EnvironmentAttributes,
): any {
  const [source, ...path] = attributePath.split(".");

  let sourceObj: any;
  switch (source) {
    case "user":
    case "subject":
      sourceObj = subject;
      break;
    case "resource":
      sourceObj = resource;
      break;
    case "environment":
    case "env":
      sourceObj = environment || {};
      break;
    default:
      // Try to find in subject first, then resource, then environment
      if (subject[source] !== undefined) {
        sourceObj = subject;
        return getNestedValue([source, ...path], sourceObj);
      }
      if (resource[source] !== undefined) {
        sourceObj = resource;
        return getNestedValue([source, ...path], sourceObj);
      }
      if (environment && environment[source] !== undefined) {
        sourceObj = environment;
        return getNestedValue([source, ...path], sourceObj);
      }
      return undefined;
  }

  return getNestedValue(path, sourceObj);
}

/**
 * Get nested value from object using path array
 */
function getNestedValue(path: string[], obj: any): any {
  if (path.length === 0) return obj;
  if (obj === null || obj === undefined) return undefined;

  const [first, ...rest] = path;
  return getNestedValue(rest, obj[first]);
}

/**
 * Evaluate a single rule against the access request
 */
function evaluateRule(
  rule: PolicyRule,
  subject: SubjectAttributes,
  resource: ResourceAttributes,
  environment?: EnvironmentAttributes,
): boolean {
  const attributeValue = getAttributeValue(
    rule.attribute,
    subject,
    resource,
    environment,
  );
  
  // Check if ruleValue is an attribute path (e.g., "resource.createdBy", "user.departmentId")
  // If it starts with known prefixes, resolve it as an attribute reference
  let ruleValue = rule.value;
  if (
    typeof ruleValue === "string" &&
    (ruleValue.startsWith("user.") ||
      ruleValue.startsWith("subject.") ||
      ruleValue.startsWith("resource.") ||
      ruleValue.startsWith("environment.") ||
      ruleValue.startsWith("env."))
  ) {
    ruleValue = getAttributeValue(ruleValue, subject, resource, environment);
  }

  // Debug logging for attribute comparisons
  if (process.env.NODE_ENV === "development") {
    console.log(
      `[ABAC Debug] Evaluating rule: ${rule.attribute} ${rule.operator} ${JSON.stringify(rule.value)}`,
    );
    if (typeof rule.value === "string" && rule.value.includes(".")) {
      console.log(
        `[ABAC Debug] Resolved rule value from attribute path: ${rule.value} -> ${ruleValue}`,
      );
    }
    console.log(
      `[ABAC Debug] Attribute value: ${attributeValue} (type: ${typeof attributeValue})`,
    );
    console.log(
      `[ABAC Debug] Rule value: ${ruleValue} (type: ${typeof ruleValue})`,
    );
  }

  // Convert operator to string for comparison (Prisma returns strings)
  const operatorStr =
    typeof rule.operator === "string"
      ? rule.operator
      : PolicyRuleOperator[rule.operator] || String(rule.operator);

  switch (operatorStr) {
    case "equals":
      // Normalize comparison - handle both string and number comparisons
      const normalizedAttr =
        attributeValue !== undefined && attributeValue !== null
          ? String(attributeValue).toUpperCase().trim()
          : "";
      const normalizedRule =
        ruleValue !== undefined && ruleValue !== null
          ? String(ruleValue).toUpperCase().trim()
          : "";
      const exactMatch =
        attributeValue === ruleValue || attributeValue === String(ruleValue);
      const normalizedMatch = normalizedAttr === normalizedRule;
      const result = exactMatch || normalizedMatch;

      if (
        process.env.NODE_ENV === "development" &&
        rule.attribute === "user.role"
      ) {
        console.log(
          `[ABAC Debug] Exact match: ${exactMatch}, Normalized match: ${normalizedMatch}, Result: ${result}`,
        );
      }

      return result;

    case "notEquals":
      return (
        attributeValue !== ruleValue && attributeValue !== String(ruleValue)
      );

    case "in":
      if (!Array.isArray(ruleValue)) return false;
      return (
        ruleValue.includes(attributeValue) ||
        ruleValue.map(String).includes(String(attributeValue))
      );

    case "notIn":
      if (!Array.isArray(ruleValue)) return true;
      return (
        !ruleValue.includes(attributeValue) &&
        !ruleValue.map(String).includes(String(attributeValue))
      );

    case "contains":
      if (typeof attributeValue === "string" && typeof ruleValue === "string") {
        return attributeValue.includes(ruleValue);
      }
      if (Array.isArray(attributeValue)) {
        return (
          attributeValue.includes(ruleValue) ||
          attributeValue.map(String).includes(String(ruleValue))
        );
      }
      return false;

    case "notContains":
      if (typeof attributeValue === "string" && typeof ruleValue === "string") {
        return !attributeValue.includes(ruleValue);
      }
      if (Array.isArray(attributeValue)) {
        return (
          !attributeValue.includes(ruleValue) &&
          !attributeValue.map(String).includes(String(ruleValue))
        );
      }
      return true;

    case "greaterThan":
    case "lessThan":
    case "greaterThanOrEqual":
    case "lessThanOrEqual": {
      const a = attributeValue;
      const b = ruleValue;
      const aDate = a instanceof Date ? a : new Date(a);
      const bDate = b instanceof Date ? b : new Date(b);
      const useDateComparison =
        !isNaN(aDate.getTime()) || !isNaN(bDate.getTime());
      const aNum = useDateComparison ? aDate.getTime() : Number(a);
      const bNum = useDateComparison ? bDate.getTime() : Number(b);
      if (operatorStr === "greaterThan") return aNum > bNum;
      if (operatorStr === "lessThan") return aNum < bNum;
      if (operatorStr === "greaterThanOrEqual") return aNum >= bNum;
      return aNum <= bNum;
    }

    case "exists":
      return attributeValue !== undefined && attributeValue !== null;

    case "notExists":
      return attributeValue === undefined || attributeValue === null;

    case "regex":
      if (typeof attributeValue !== "string" || typeof ruleValue !== "string") {
        return false;
      }
      try {
        const regex = new RegExp(ruleValue);
        return regex.test(attributeValue);
      } catch {
        return false;
      }

    default:
      return false;
  }
}

/**
 * Get logical operator as string from a rule
 */
function getLogicalOperatorStr(rule: PolicyRule): string {
  const op = rule.logicalOperator;
  if (op === null || op === undefined) return "AND";
  return typeof op === "string"
    ? op
    : LogicalOperator[op] || String(op);
}

/**
 * Evaluate a flat list of rules (no grouping) - left to right with logical operators
 */
function evaluateRulesFlat(
  rules: PolicyRule[],
  subject: SubjectAttributes,
  resource: ResourceAttributes,
  environment?: EnvironmentAttributes,
): boolean {
  if (rules.length === 0) return true;
  let result = evaluateRule(rules[0], subject, resource, environment);
  for (let i = 1; i < rules.length; i++) {
    const rule = rules[i];
    const ruleResult = evaluateRule(rule, subject, resource, environment);
    const logicalOpStr = getLogicalOperatorStr(rule);
    if (logicalOpStr.toUpperCase() === "AND") {
      result = result && ruleResult;
    } else {
      result = result || ruleResult;
    }
  }
  return result;
}

/**
 * Partition rules into groups by groupIndex. Rules with same groupIndex form a group.
 * Rules with groupIndex null/undefined are each their own group (standalone).
 * Groups are ordered by the order of their first rule.
 */
function partitionRulesByGroup(sortedRules: PolicyRule[]): PolicyRule[][] {
  const groups: PolicyRule[][] = [];
  let currentGroup: PolicyRule[] = [];
  let currentGroupIndex: number | null = null;

  for (const rule of sortedRules) {
    const g = rule.groupIndex;
    if (g == null) {
      if (currentGroup.length > 0) {
        groups.push(currentGroup);
        currentGroup = [];
      }
      groups.push([rule]);
      currentGroupIndex = null;
    } else {
      if (g === currentGroupIndex) {
        currentGroup.push(rule);
      } else {
        if (currentGroup.length > 0) {
          groups.push(currentGroup);
        }
        currentGroup = [rule];
        currentGroupIndex = g;
      }
    }
  }
  if (currentGroup.length > 0) {
    groups.push(currentGroup);
  }
  return groups;
}

/**
 * Evaluate all rules in a policy. Supports grouped conditions for mixed logic:
 * - (rule OR rule) AND rule  -> groupIndex 1 for first two rules, 2 for third
 * - rule OR (rule AND rule)  -> groupIndex 1 for first, 2 for last two
 * - When no groupIndex is set, uses flat left-to-right evaluation (backward compatible)
 */
function evaluatePolicyRules(
  rules: PolicyRule[],
  subject: SubjectAttributes,
  resource: ResourceAttributes,
  environment?: EnvironmentAttributes,
): boolean {
  if (rules.length === 0) return true; // No rules = allow

  const sortedRules = [...rules].sort((a, b) => a.order - b.order);

  // Backward compatible: if no rule has groupIndex, use flat evaluation
  const hasGroups = sortedRules.some((r) => r.groupIndex != null);
  if (!hasGroups) {
    return evaluateRulesFlat(sortedRules, subject, resource, environment);
  }

  // Grouped evaluation: partition rules, evaluate each group, combine with group operators
  const groups = partitionRulesByGroup(sortedRules);
  const groupResults = groups.map((g) =>
    evaluateRulesFlat(g, subject, resource, environment),
  );

  if (process.env.NODE_ENV === "development") {
    groups.forEach((g, i) => {
      console.log(
        `[ABAC Debug] Group ${i} (${g.map((r) => r.attribute).join(", ")}): ${groupResults[i]}`,
      );
    });
  }

  let result = groupResults[0];
  for (let i = 1; i < groupResults.length; i++) {
    const lastRuleInPrevGroup = groups[i - 1][groups[i - 1].length - 1];
    // Use groupCombineOperator for group-to-group, else fall back to logicalOperator
    const groupOp = lastRuleInPrevGroup.groupCombineOperator;
    const logicalOpStr =
      groupOp != null
        ? typeof groupOp === "string"
          ? groupOp
          : LogicalOperator[groupOp] || String(groupOp)
        : getLogicalOperatorStr(lastRuleInPrevGroup);
    if (logicalOpStr.toUpperCase() === "AND") {
      result = result && groupResults[i];
    } else {
      result = result || groupResults[i];
    }
    if (process.env.NODE_ENV === "development") {
      console.log(
        `[ABAC Debug] Combined after group ${i} (op: ${logicalOpStr}): ${result}`,
      );
    }
  }

  return result;
}

/**
 * Evaluate a single policy
 */
function evaluatePolicy(
  policy: Policy,
  subject: SubjectAttributes,
  resource: ResourceAttributes,
  action: string,
  environment?: EnvironmentAttributes,
): string | null {
  // Check if policy applies to this resource type and action
  if (policy.resourceType !== resource.type) return null;
  if (policy.action !== action) return null;
  if (!policy.isActive) return null;

  // Evaluate all rules
  const rulesMatch = evaluatePolicyRules(
    policy.rules,
    subject,
    resource,
    environment,
  );

  if (process.env.NODE_ENV === "development") {
    console.log(
      `[ABAC Debug] Policy ${policy.name}: rulesMatch=${rulesMatch}, effect=${policy.effect}`,
    );
  }

  if (rulesMatch) {
    // Return the effect as a string (Prisma enum values are strings)
    // Handle both enum objects and string values
    const effectValue =
      typeof policy.effect === "string"
        ? policy.effect
        : (policy.effect as any)?.value || String(policy.effect);
    return effectValue;
  }

  return null; // Policy doesn't apply
}

/**
 * Get applicable policies for a resource type and action
 * @param resourceType - The resource type
 * @param action - The action to check
 * @param userId - The user ID
 * @param roleId - The role ID
 * @param includeUnassigned - If true, also include policies with no assignments (applies to everyone)
 */
export async function getApplicablePolicies(
  resourceType: string,
  action: string,
  userId?: string,
  roleId?: string,
  includeUnassigned: boolean = false,
): Promise<Policy[]> {
  const where: any = {
    resourceType,
    action,
    isActive: true,
  };

  // If userId or roleId provided, filter by assignments
  if (userId || roleId) {
    if (includeUnassigned) {
      // Include policies assigned to user/role OR policies with no assignments
      where.OR = [
        { assignments: { some: { userId } } },
        { assignments: { some: { roleId } } },
        { assignments: { none: {} } }, // Policies with no assignments
      ];
    } else {
      // Only policies assigned to user/role
      where.OR = [
        { assignments: { some: { userId } } },
        { assignments: { some: { roleId } } },
      ];
    }
  }

  const policies = await prisma.policy.findMany({
    where,
    include: {
      rules: {
        orderBy: { order: "asc" },
      },
    },
    orderBy: { priority: "asc" }, // Lower priority number = evaluated first
  });

  return policies as unknown as Policy[];
}

/**
 * Check if access should be granted based on ABAC policies
 * @param subject - The subject attributes
 * @param resource - The resource attributes
 * @param action - The action to check
 * @param environment - The environment attributes
 * @returns True if access should be granted, false otherwise
 * @example
 * const subject = {
 *   id: "123",
 *   roleId: "456",
 *   role: "ADMIN",
 * };
 * const resource = {
 *   id: "789",
 *   type: "document",
 * };
 * const action = "view:documents";
 * const environment = {
 *   time: new Date(),
 *   ip: "127.0.0.1",
 * };
 * const result = await checkABACAccess(subject, resource, action, environment);
 * console.log(result); // true or false
 */
export async function checkABACAccess(
  subject: SubjectAttributes,
  resource: ResourceAttributes,
  action: string,
  environment?: EnvironmentAttributes,
): Promise<boolean> {
  // Get applicable policies (include unassigned policies for general access checks)
  const policies = await getApplicablePolicies(
    resource.type,
    action,
    subject.id,
    subject.roleId,
    true, // includeUnassigned = true to include policies that apply to everyone
  );

  // Debug logging (can be removed in production)
  if (process.env.NODE_ENV === "development") {
    console.log(
      `\n[ABAC] Checking access for action: ${action}, resourceType: ${resource.type}`,
    );
    console.log(`[ABAC] Subject attributes:`, {
      id: subject.id,
      role: subject.role,
      roleId: subject.roleId,
      jobTitle: subject.jobTitle,
      jobTitleId: subject.jobTitleId,
      department: subject.department,
      departmentId: subject.departmentId,
    });
    console.log(`[ABAC] Resource attributes:`, {
      id: resource.id,
      type: resource.type,
      status: resource.status,
      createdBy: resource.createdBy,
      departmentId: resource.departmentId,
      department: resource.department,
    });
    console.log(`[ABAC] Found ${policies.length} policies`);
    policies.forEach((p) => {
      console.log(
        `[ABAC] Policy: ${p.name}, Effect: ${p.effect}, Rules: ${p.rules?.length || 0}`,
      );
    });
  }

  // If no policies found, default deny (secure by default)
  if (policies.length === 0) {
    if (process.env.NODE_ENV === "development") {
      console.log(`[ABAC] No policies found, denying access`);
    }
    return false;
  }

  // Evaluate policies in priority order
  for (const policy of policies) {
    const effect = evaluatePolicy(
      policy,
      subject,
      resource,
      action,
      environment,
    );

    if (process.env.NODE_ENV === "development" && effect) {
      console.log(`[ABAC] Policy ${policy.name} evaluated to: ${effect}`);
    }

    // Compare with string values since Prisma returns strings
    const effectStr = String(effect).toUpperCase();
    if (effectStr === "DENY") {
      if (process.env.NODE_ENV === "development") {
        console.log(`[ABAC] DENY policy matched, denying access`);
      }
      return false; // Explicit deny always wins
    }

    if (effectStr === "ALLOW") {
      if (process.env.NODE_ENV === "development") {
        console.log(`[ABAC] ALLOW policy matched, granting access`);
      }
      return true; // First explicit allow grants access
    }
  }

  // No matching policies = deny
  if (process.env.NODE_ENV === "development") {
    console.log(`[ABAC] No matching policies, denying access`);
  }
  return false;
}

/**
 * Check access with resource fetched from database
 */
export async function checkABACAccessWithResource(
  subject: SubjectAttributes,
  resourceType: string,
  resourceId: string,
  action: string,
  environment?: EnvironmentAttributes,
): Promise<boolean> {
  // Fetch resource based on type
  let resourceData: any = null;

  switch (resourceType) {
    case "document":
    case "compliance-document":
      resourceData = await prisma.document.findUnique({
        where: { id: resourceId },
        include: {
          status: true,
          category: true,
          departments: true,
          currentVersion: { select: { expirationDate: true } },
          creator: {
            select: { id: true, departmentId: true },
          },
        },
      });
      if (resourceData) {
        return checkABACAccess(
          subject,
          {
            id: resourceData.id,
            type: resourceType, // Use the original resourceType
            status: resourceData.status?.name,
            categoryId: resourceData.categoryId,
            category: resourceData.category?.name,
            createdBy: resourceData.createdBy,
            departmentId: resourceData.departments?.[0]?.id,
            department: resourceData.departments?.[0]?.name,
            expirationDate: resourceData.currentVersion?.expirationDate ?? undefined,
          },
          action,
          environment,
        );
      }
      break;

    case "user":
      resourceData = await prisma.user.findUnique({
        where: { id: resourceId },
        include: {
          department: true,
          role: true,
        },
      });
      if (resourceData) {
        return checkABACAccess(
          subject,
          {
            id: resourceData.id,
            type: "user",
            departmentId: resourceData.departmentId,
            department: resourceData.department?.name,
            roleId: resourceData.roleId,
            role: resourceData.role?.name,
          },
          action,
          environment,
        );
      }
      break;

    case "department":
      resourceData = await prisma.department.findUnique({
        where: { id: resourceId },
      });
      if (resourceData) {
        return checkABACAccess(
          subject,
          {
            id: resourceData.id,
            type: "department",
            name: resourceData.name,
          },
          action,
          environment,
        );
      }
      break;

    default:
      // Generic resource lookup
      return checkABACAccess(
        subject,
        {
          id: resourceId,
          type: resourceType,
        },
        action,
        environment,
      );
  }

  return false;
}
