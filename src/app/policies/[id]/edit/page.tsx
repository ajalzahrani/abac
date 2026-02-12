import { PageShell } from "@/components/page-shell";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { PolicyForm } from "../../components/policy-form";
import { getPolicyById } from "@/actions/policies";
import { checkServerABACAccess } from "@/lib/permissions-server";
import { notFound } from "next/navigation";

interface PageParams {
  id: string;
}

export default async function EditPolicyPage({
  params,
}: {
  params: Promise<PageParams>;
}) {
  await checkServerABACAccess("view:policies", "policy");
  const { id } = await params;
  const result = await getPolicyById(id);

  if (!result.success || !result.policy) {
    return notFound();
  }

  const policy = result.policy;
  // Normalize rule values for client (JSON from DB may have dates, objects, etc.)
  const normalizeRuleValue = (v: unknown): string | number | (string | number)[] | null => {
    if (v === null || v === undefined || typeof v === "boolean") return null;
    if (typeof v === "string" || typeof v === "number") return v;
    if (Array.isArray(v)) {
      return v.map((item) => (typeof item === "string" || typeof item === "number" ? item : String(item))) as (string | number)[];
    }
    if (typeof v === "object" && v !== null && "toISOString" in v) {
      return (v as Date).toISOString(); // Date from JSON
    }
    return null;
  };

  const initialData = {
    name: policy.name,
    description: policy.description ?? "",
    effect: policy.effect,
    action: policy.action,
    resourceType: policy.resourceType,
    priority: policy.priority,
    isActive: policy.isActive,
    rules: policy.rules.map((r, i) => ({
      attribute: r.attribute,
      operator: r.operator as "equals" | "notEquals" | "in" | "notIn" | "contains" | "notContains" | "greaterThan" | "lessThan" | "greaterThanOrEqual" | "lessThanOrEqual" | "exists" | "notExists" | "regex",
      value: normalizeRuleValue(r.value),
      logicalOperator: (r.logicalOperator ?? "AND") as "AND" | "OR",
      order: r.order ?? i,
      groupIndex: r.groupIndex ?? null,
      groupCombineOperator: (r.groupCombineOperator ?? null) as "AND" | "OR" | null,
    })),
  };

  return (
    <PageShell>
      <PageHeader heading={`Edit: ${policy.name}`} text="Modify policy and rules">
        <Button variant="outline" size="icon" asChild>
          <Link href="/policies">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
      </PageHeader>
      <PolicyForm
        policyId={id}
        initialData={initialData}
        submitLabel="Update Policy"
      />
    </PageShell>
  );
}
