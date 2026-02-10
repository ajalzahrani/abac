# ABAC Migration Steps

## Prerequisites
- Node.js and npm/yarn installed
- PostgreSQL database running
- Prisma CLI installed (`npm install -g prisma` or `npx prisma`)

## Step 1: Update Database Schema

1. **Review the schema changes** in `prisma/schema.prisma`
   - New models: `Policy`, `PolicyRule`, `PolicyAssignment`
   - New enums: `PolicyEffect`, `PolicyRuleOperator`, `LogicalOperator`

2. **Create and run the migration:**
   ```bash
   npx prisma migrate dev --name add_abac_models
   ```

3. **Generate Prisma Client:**
   ```bash
   npx prisma generate
   ```

## Step 2: Verify Code Changes

The following files have been updated:
- ✅ `prisma/schema.prisma` - Added ABAC models
- ✅ `src/lib/abac.ts` - ABAC evaluation engine (NEW)
- ✅ `src/lib/permissions.ts` - Updated with ABAC functions
- ✅ `src/lib/server-permissions.ts` - Updated with ABAC server checks
- ✅ `src/lib/auth.ts` - Updated to load user attributes
- ✅ `src/actions/auths.ts` - Updated to load user attributes
- ✅ `src/types/next-auth.d.ts` - Updated TypeScript types
- ✅ `src/components/auth/permission-check.tsx` - Updated to support ABAC
- ✅ `src/config/nav.config.ts` - Updated to support ABAC
- ✅ `src/app/api/abac/check/route.ts` - API route for ABAC checks (NEW)

## Step 3: Test the Migration

1. **Start your development server:**
   ```bash
   npm run dev
   ```

2. **Verify existing functionality still works:**
   - Login/logout
   - Navigation menu
   - Permission checks in components
   - Document access

3. **Test ABAC (after creating policies):**
   - Create a test policy
   - Test access evaluation
   - Verify policies are evaluated correctly

## Step 4: Create Initial Policies

You'll need to create policies to replace your existing RBAC permissions. Here's an example script:

```typescript
// scripts/create-initial-policies.ts
import { prisma } from "../src/lib/prisma";

async function createInitialPolicies() {
  // Example: Allow users to view documents in their department
  await prisma.policy.create({
    data: {
      name: "View Department Documents",
      description: "Users can view documents in their department",
      effect: "ALLOW",
      action: "view:document",
      resourceType: "document",
      priority: 100,
      isActive: true,
      rules: {
        create: [
          {
            attribute: "user.departmentId",
            operator: "equals",
            value: "resource.departmentId",
            order: 0,
          },
        ],
      },
    },
  });

  // Example: Allow document creators to edit their own draft documents
  await prisma.policy.create({
    data: {
      name: "Edit Own Draft Documents",
      description: "Users can edit documents they created if status is DRAFT",
      effect: "ALLOW",
      action: "edit:document",
      resourceType: "document",
      priority: 50,
      isActive: true,
      rules: {
        create: [
          {
            attribute: "user.id",
            operator: "equals",
            value: "resource.createdBy",
            order: 0,
          },
          {
            attribute: "resource.status",
            operator: "equals",
            value: "DRAFT",
            logicalOperator: "AND",
            order: 1,
          },
        ],
      },
    },
  });

  console.log("Initial policies created!");
}

createInitialPolicies()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

## Step 5: Migrate Existing Permission Checks (Gradual)

### Option A: Keep Both Systems (Recommended for gradual migration)

Keep using `hasPermission()` and `checkServerPermission()` for existing code, and use ABAC for new features.

### Option B: Migrate to ABAC

Replace permission checks one by one:

**Before (RBAC):**
```typescript
import { checkServerPermission } from "@/lib/server-permissions";

await checkServerPermission("delete:document");
```

**After (ABAC):**
```typescript
import { checkServerABACAccess } from "@/lib/server-permissions";

await checkServerABACAccess(
  "delete:document",
  "document",
  documentId
);
```

**Before (RBAC Component):**
```tsx
<PermissionCheck required="delete:document">
  <DeleteButton />
</PermissionCheck>
```

**After (ABAC Component):**
```tsx
<PermissionCheck 
  action="delete:document"
  resourceType="document"
  resourceId={documentId}
>
  <DeleteButton />
</PermissionCheck>
```

## Step 6: Update Navigation Config (Optional)

You can update `nav.config.ts` to use ABAC:

**Before:**
```typescript
{
  label: "Documents",
  href: "/documents",
  requiredPermissions: ["manage:documents"],
}
```

**After:**
```typescript
{
  label: "Documents",
  href: "/documents",
  requiredAction: "view:documents",
  resourceType: "document",
}
```

## Step 7: Create Policy Management UI (Future)

Create admin pages for:
- Listing policies
- Creating/editing policies
- Managing policy rules
- Testing policies
- Viewing policy evaluation logs

## Step 8: Performance Optimization (Future)

- Cache policies in memory
- Cache policy evaluations
- Optimize database queries
- Add policy evaluation metrics

## Troubleshooting

### Issue: Prisma Client not generated
**Solution:** Run `npx prisma generate`

### Issue: Type errors with PolicyEffect, etc.
**Solution:** Make sure Prisma client is generated and types are imported from `@/generated/prisma`

### Issue: Policies not being evaluated
**Solution:** 
- Check that policies are active (`isActive: true`)
- Verify policy `resourceType` and `action` match your request
- Check policy assignments (userId or roleId)
- Review policy rules and operators

### Issue: Access denied when it should be allowed
**Solution:**
- Check policy priority (lower number = evaluated first)
- Verify DENY policies aren't blocking access
- Review rule conditions and operators
- Check attribute paths (user.departmentId vs resource.departmentId)

## Rollback Plan

If you need to rollback:

1. **Keep RBAC code:** All RBAC functions are still available
2. **Disable ABAC:** Set `isActive: false` on all policies
3. **Use legacy functions:** Continue using `hasPermission()` and `checkServerPermission()`

## Next Steps

1. ✅ Database schema updated
2. ✅ ABAC engine implemented
3. ✅ Permission functions updated
4. ✅ Components updated
5. ⏳ Create initial policies
6. ⏳ Migrate existing permission checks
7. ⏳ Create policy management UI
8. ⏳ Performance optimization
9. ⏳ Remove RBAC code (after full migration)

## Support

For questions or issues:
- Review `ABAC_MIGRATION_PLAN.md` for detailed architecture
- Review `ABAC_IMPLEMENTATION_SUMMARY.md` for usage examples
- Check Prisma documentation for schema changes
