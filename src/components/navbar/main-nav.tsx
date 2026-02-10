import Link from "next/link";
import { InboxIcon } from "lucide-react";

import { NAV_ITEMS } from "@/config/nav.config";
import { getUserSubjectAttributes } from "@/lib/permissions-client";
import { checkABACAccess } from "@/lib/abac";
import { getCurrentUser } from "@/lib/auth";
import NavList from "./nav-list";

export async function MainNav() {
  const session = await getCurrentUser();

  if (!session) return null;

  const user = session;
  const subject = getUserSubjectAttributes(user);

  const filterItems = async (
    items: typeof NAV_ITEMS,
  ): Promise<typeof NAV_ITEMS> => {
    const filteredItems = await Promise.all(
      items.map(async (item) => {
        // Check ABAC access
        let hasAccess = false;
        try {
          hasAccess = await checkABACAccess(
            subject,
            { type: item.resourceType },
            item.requiredAction,
          );
        } catch (error) {
          console.error(`ABAC check failed for ${item.label}:`, error);
          hasAccess = false;
        }

        if (!hasAccess) return null;

        // Filter children recursively
        const children = item.children
          ? await filterItems(item.children)
          : undefined;

        // If item has children but none are visible, hide the parent too
        if (item.children && (!children || children.length === 0)) {
          return null;
        }

        return { ...item, children };
      }),
    );

    return filteredItems.filter(Boolean) as typeof NAV_ITEMS;
  };

  const visibleItems = await filterItems(NAV_ITEMS);

  return (
    <div className="flex gap-6 md:gap-10">
      <Link href="/dashboard" className="flex items-center space-x-2">
        <InboxIcon className="h-6 w-6" />
        <span className="font-bold inline-block">DocBox</span>
      </Link>
      <nav className="flex gap-6 items-center">
        <NavList items={visibleItems} />
      </nav>
    </div>
  );
}
