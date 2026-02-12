import { PageShell } from "@/components/page-shell";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { PolicyForm } from "../components/policy-form";
import { checkServerABACAccess } from "@/lib/permissions-server";

export default async function NewPolicyPage() {
  await checkServerABACAccess("view:policies", "policy");

  return (
    <PageShell>
      <PageHeader heading="Create Policy" text="Add a new ABAC policy and rules">
        <Button variant="outline" size="icon" asChild>
          <Link href="/policies">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
      </PageHeader>
      <PolicyForm submitLabel="Create Policy" />
    </PageShell>
  );
}
