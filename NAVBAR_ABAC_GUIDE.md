# Navbar ABAC Implementation Guide

## Overview
The navbar now uses ABAC (Attribute-Based Access Control) to determine which menu items each user can see based on policies.

## How It Works

1. **Navbar Component** (`src/components/navbar/main-nav.tsx`):
   - Filters navigation items based on ABAC policies
   - Checks `requiredAction` and `resourceType` for each item
   - Falls back to RBAC (`requiredPermissions`) for backward compatibility

2. **Navigation Config** (`src/config/nav.config.ts`):
   - Each nav item can specify:
     - `requiredAction`: The action to check (e.g., "view:documents")
     - `resourceType`: The resource type (e.g., "document")
     - `requiredPermissions`: Legacy RBAC (still supported)

3. **Policies** (`prisma/seed-policies.ts`):
   - Policies define who can see which menu items
   - Policies without assignments apply to everyone
   - Policies with assignments apply only to specific users/roles

## Setting Up Navbar Policies

### Example: Allow All Users to See Documents Menu

```typescript
await prisma.policy.create({
  data: {
    name: "View Documents Menu",
    description: "All authenticated users can see Documents menu",
    effect: "ALLOW",
    action: "view:documents",
    resourceType: "document",
    priority: 100,
    isActive: true,
    // No rules = applies to everyone
    // No assignments = applies to everyone
  },
});
```

### Example: Allow Only Admins to See Users Menu

```typescript
await prisma.policy.create({
  data: {
    name: "View Users Menu",
    description: "Only admins can see Users menu",
    effect: "ALLOW",
    action: "view:users",
    resourceType: "user",
    priority: 50,
    isActive: true,
    rules: {
      create: [
        {
          attribute: "user.role",
          operator: "equals",
          value: "ADMIN",
          order: 0,
        },
      ],
    },
  },
});
```

### Example: Allow Users in Specific Department

```typescript
await prisma.policy.create({
  data: {
    name: "View Department Reports",
    description: "Users in Finance department can see Reports",
    effect: "ALLOW",
    action: "view:reports",
    resourceType: "report",
    priority: 50,
    isActive: true,
    rules: {
      create: [
        {
          attribute: "user.department",
          operator: "equals",
          value: "Finance",
          order: 0,
        },
      ],
    },
  },
});
```

## Running the Seed Script

To create the initial navbar policies:

```bash
# Make sure you have the Prisma client generated
npx prisma generate

# Run the seed script
npx ts-node prisma/seed-policies.ts
```

Or add it to your main seed file:

```typescript
// In prisma/seed.ts
import { createNavbarPolicies } from "./seed-policies";

async function main() {
  // ... other seed data
  await createNavbarPolicies();
}
```

## Policy Evaluation Logic

1. **Policies are evaluated in priority order** (lower number = higher priority)
2. **DENY policies always win** - if a DENY policy matches, access is denied
3. **First ALLOW policy grants access** - if an ALLOW policy matches, access is granted
4. **No policies = DENY** - if no policies match, access is denied (secure by default)
5. **Policies without rules** - apply to everyone (if no assignments) or to assigned users/roles
6. **Policies without assignments** - apply to everyone (when `includeUnassigned` is true)

## Navbar Item Configuration

In `src/config/nav.config.ts`:

```typescript
{
  label: "Documents",
  href: "/documents",
  requiredAction: "view:documents",  // ABAC action
  resourceType: "document",          // Resource type
  // OR use legacy RBAC:
  // requiredPermissions: ["manage:documents"],
}
```

## Testing

1. **Create policies** using the seed script
2. **Login as different users** with different roles/attributes
3. **Check navbar** - only items with matching policies should be visible
4. **Verify policies** - check that policies are being evaluated correctly

## Troubleshooting

### Navbar items not showing

1. **Check policies exist**: Verify policies are created in database
2. **Check policy is active**: `isActive: true`
3. **Check action/resourceType match**: Must match `requiredAction` and `resourceType` in nav.config.ts
4. **Check policy rules**: If rules exist, they must match user attributes
5. **Check policy assignments**: If assignments exist, user/role must be assigned

### All items showing (or none showing)

1. **Check policy effect**: Should be `ALLOW` for items to show
2. **Check policy priority**: Lower priority numbers are evaluated first
3. **Check for DENY policies**: DENY policies override ALLOW policies
4. **Check user attributes**: Make sure user has required attributes (role, department, etc.)

## Migration from RBAC

The navbar supports both RBAC and ABAC:

- **RBAC**: Use `requiredPermissions` prop (backward compatible)
- **ABAC**: Use `requiredAction` and `resourceType` props (new)

You can migrate gradually:
1. Keep `requiredPermissions` for existing items
2. Add `requiredAction` and `resourceType` for new items
3. Create ABAC policies
4. Remove `requiredPermissions` once all policies are created
