import { PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getPolicies } from "@/actions/policies";
import { PageHeader } from "@/components/page-header";
import { PageShell } from "@/components/page-shell";
import Link from "next/link";
import { PolicyList } from "./components/policy-list";
import { checkServerABACAccess } from "@/lib/permissions-server";
import { notFound } from "next/navigation";

export default async function PoliciesPage() {
  await checkServerABACAccess("view:policies", "policy");
  const result = await getPolicies();

  if (!result.success) {
    return notFound();
  }

  return (
    <PageShell>
      <PageHeader heading="Policies" text="Manage ABAC policies and rules">
        <Link href="/policies/new">
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Create Policy
          </Button>
        </Link>
      </PageHeader>
      <PolicyList policies={result.policies ?? []} />
    </PageShell>
  );
}
