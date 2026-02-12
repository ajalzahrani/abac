import { z } from "zod";

// Policy rule operator enum values
export const POLICY_RULE_OPERATORS = [
  "equals",
  "notEquals",
  "in",
  "notIn",
  "contains",
  "notContains",
  "greaterThan",
  "lessThan",
  "greaterThanOrEqual",
  "lessThanOrEqual",
  "exists",
  "notExists",
  "regex",
] as const;

// Logical operator enum values
export const LOGICAL_OPERATORS = ["AND", "OR"] as const;

// Policy effect enum values
export const POLICY_EFFECTS = ["ALLOW", "DENY"] as const;

// Rule schema - value can be string, number, array, or null for exists/notExists
const ruleValueSchema = z.union([
  z.string(),
  z.number(),
  z.array(z.union([z.string(), z.number()])),
  z.null(),
]);

export const policyRuleSchema = z.object({
  id: z.string().optional(),
  attribute: z.string().min(1, "Attribute is required"),
  operator: z.enum(POLICY_RULE_OPERATORS),
  value: ruleValueSchema.optional().nullable(),
  logicalOperator: z.enum(LOGICAL_OPERATORS).optional().nullable(),
  order: z.number().optional().default(0),
  groupIndex: z.number().optional().nullable(),
  groupCombineOperator: z.enum(LOGICAL_OPERATORS).optional().nullable(),
});

export const policySchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().optional().nullable(),
  effect: z.enum(POLICY_EFFECTS),
  action: z.string().min(1, "Action is required"),
  resourceType: z.string().min(1, "Resource type is required"),
  priority: z.number().min(0).default(100),
  isActive: z.boolean().default(true),
  rules: z.array(policyRuleSchema).optional().default([]),
});

export type PolicyFormValues = z.infer<typeof policySchema>;
export type PolicyRuleFormValues = z.infer<typeof policyRuleSchema>;
