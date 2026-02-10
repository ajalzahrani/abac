import { PageShell } from "@/components/page-shell";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import Link from "next/link";
import { CategoryList } from "./components/category-list";
import { getCategories } from "@/actions/categories";
import { checkServerABACAccess } from "@/lib/permissions-server";
import { notFound } from "next/navigation";

export default async function CategoriesPage() {
  await checkServerABACAccess("view:certificate", "certificate");

  const categories = await getCategories();
  if (!categories.success) {
    return notFound();
  }

  return (
    <PageShell>
      <PageHeader heading="Categories" text="Manage and track categories">
        <Link href="/categories/new">
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Create Category
          </Button>
        </Link>
      </PageHeader>

      <CategoryList categories={categories.categories || []} />
    </PageShell>
  );
}
