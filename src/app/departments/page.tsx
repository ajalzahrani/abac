import { PageShell } from "@/components/page-shell";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import Link from "next/link";
import { DepartmentList } from "./components/department-list";
import { getDepartments } from "@/actions/departments";
import { checkServerABACAccess } from "@/lib/permissions-server";
import { notFound } from "next/navigation";

export default async function DepartmentsPage() {
  await checkServerABACAccess("view:department", "department");

  const departments = await getDepartments();
  if (!departments.success) {
    return notFound();
  }

  return (
    <PageShell>
      <PageHeader heading="Departments" text="Manage and track departments">
        <Link href="/departments/new">
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Create Department
          </Button>
        </Link>
      </PageHeader>

      <DepartmentList departments={departments.departments || []} />
    </PageShell>
  );
}
