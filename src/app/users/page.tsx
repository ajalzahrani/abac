import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getUsers } from "@/actions/users";
import { PageShell } from "@/components/page-shell";
import { PageHeader } from "@/components/page-header";
import { UserList } from "./components/users-list";
import { PlusCircle } from "lucide-react";
import { checkServerABACAccess } from "@/lib/permissions-server";
import { notFound } from "next/navigation";
import { PermissionCheck } from "@/components/auth/permission-check";
export default async function UsersPage() {
  await checkServerABACAccess("view:users", "user");

  const users = await getUsers();

  if (!users.success) {
    return notFound();
  }

  return (
    <PageShell>
      <PageHeader heading="Users" text="Manage and track users">
        <Link href="/users/new">
          <PermissionCheck action="create:user" resourceType="user">
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Create User
            </Button>
          </PermissionCheck>
        </Link>
      </PageHeader>

      <UserList users={users.users || []} />
    </PageShell>
  );
}
