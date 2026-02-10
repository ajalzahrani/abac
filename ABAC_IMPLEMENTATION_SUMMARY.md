# ABAC Implementation Summary

## Overview
The application has been migrated from Role-Based Access Control (RBAC) to Attribute-Based Access Control (ABAC). This document summarizes the changes and provides usage examples.

## What Changed

### 1. Database Schema (`prisma/schema.prisma`)

**New Models Added:**
- `Policy`: Defines access control policies
- `PolicyRule`: Defines conditions for policies
- `PolicyAssignment`: Assigns policies to users/roles
- Enums: `PolicyEffect`, `PolicyRuleOperator`, `LogicalOperator`

**Models Kept (for backward compatibility):**
- `Role`, `Permission`, `RolePermission` - Still functional but can be phased out

### 2. Core ABAC Engine (`src/lib/abac.ts`)

New functions:
- `checkABACAccess()`: Evaluates access based on subject, resource, action, and environment
- `checkABACAccessWithResource()`: Fetches resource from DB and evaluates access
- `getApplicablePolicies()`: Gets policies that apply to a resource/action

### 3. Updated Permission Functions

**`src/lib/permissions.ts`:**
- `hasPermission()`: Legacy RBAC (kept for backward compatibility)
- `checkABACPermission()`: New ABAC check
- `getUserSubjectAttributes()`: Converts user to subject attributes

**`src/lib/server-permissions.ts`:**
- `checkServerPermission()`: Legacy RBAC (kept for backward compatibility)
- `checkServerABACAccess()`: New ABAC server-side check

### 4. Updated Components

**`src/components/auth/permission-check.tsx`:**
- Supports both legacy `required` prop (RBAC) and new `action`/`resourceType` props (ABAC)
- Backward compatible

**`src/config/nav.config.ts`:**
- Added `requiredAction` and `resourceType` props
- Legacy `requiredPermissions` still supported

### 5. Updated Authentication

**`src/lib/auth.ts` and `src/actions/auths.ts`:**
- Now loads user attributes (department, jobTitle) for ABAC evaluation
- Still loads permissions for backward compatibility

## Usage Examples

### Example 1: Server-Side ABAC Check

```typescript
import { checkServerABACAccess } from "@/lib/server-permissions";

// Check if user can delete a specific document
await checkServerABACAccess(
  "delete:document",
  "document",
  documentId // Will fetch document from DB
);

// Check with resource attributes
await checkServerABACAccess(
  "view:document",
  "document",
  undefined,
  { status: "DRAFT", departmentId: "dept123" }
);
```

### Example 2: Client-Side Permission Check Component

```tsx
// Legacy RBAC (still works)
<PermissionCheck required="delete:document">
  <DeleteButton />
</PermissionCheck>

// New ABAC
<PermissionCheck 
  action="delete:document" 
  resourceType="document"
  resourceId={documentId}
>
  <DeleteButton />
</PermissionCheck>

// ABAC with resource attributes
<PermissionCheck 
  action="edit:document"
  resourceType="document"
  resource={{ status: "DRAFT", createdBy: userId }}
>
  <EditButton />
</PermissionCheck>
```

### Example 3: Creating Policies

```typescript
// Policy: Users can delete documents in their department if status is DRAFT
await prisma.policy.create({
  data: {
    name: "Delete Own Department Draft Documents",
    effect: "ALLOW",
    action: "delete:document",
    resourceType: "document",
    priority: 100,
    rules: {
      create: [
        {
          attribute: "user.department",
          operator: "equals",
          value: "resource.department",
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
```

### Example 4: Policy with Multiple Conditions

```typescript
// Policy: Approve documents in same department when status is DRAFT
await prisma.policy.create({
  data: {
    name: "Approve Department Documents",
    effect: "ALLOW",
    action: "approve:document",
    resourceType: "document",
    priority: 50,
    rules: {
      create: [
        {
          attribute: "user.departmentId",
          operator: "equals",
          value: "resource.departmentId",
          order: 0,
        },
        {
          attribute: "resource.status",
          operator: "in",
          value: ["DRAFT"],
          logicalOperator: "AND",
          order: 1,
        },
      ],
    },
  },
});
```

## Policy Rule Operators

Available operators:
- `equals`: Attribute equals value
- `notEquals`: Attribute does not equal value
- `in`: Attribute is in array of values
- `notIn`: Attribute is not in array of values
- `contains`: String/array contains value
- `notContains`: String/array does not contain value
- `greaterThan`: Numeric comparison
- `lessThan`: Numeric comparison
- `greaterThanOrEqual`: Numeric comparison
- `lessThanOrEqual`: Numeric comparison
- `exists`: Attribute exists
- `notExists`: Attribute does not exist
- `regex`: Regular expression match

## Attribute Paths

Attributes can reference:
- `user.*` or `subject.*`: User attributes (id, departmentId, roleId, etc.)
- `resource.*`: Resource attributes (status, departmentId, categoryId, etc.)
- `environment.*` or `env.*`: Environment attributes (time, ip, etc.)

Examples:
- `user.departmentId`
- `resource.status`
- `resource.departmentId`
- `user.id`
- `resource.createdBy`

## Migration Steps

1. **Run Prisma Migration:**
   ```bash
   npx prisma migrate dev --name add_abac_models
   ```

2. **Generate Prisma Client:**
   ```bash
   npx prisma generate
   ```

3. **Create Initial Policies:**
   - Convert existing Role-Permission mappings to Policies
   - Create policies for common access patterns
   - Test policies before removing RBAC code

4. **Gradual Migration:**
   - Start using ABAC for new features
   - Migrate existing permission checks one by one
   - Keep RBAC code until all features migrated

## Backward Compatibility

- All existing RBAC code still works
- `hasPermission()` and `checkServerPermission()` remain functional
- `requiredPermissions` prop in components still supported
- Can run both systems in parallel during migration

## Next Steps

1. Create admin UI for policy management
2. Create migration script to convert existing permissions to policies
3. Add policy testing/debugging tools
4. Add audit logging for policy evaluations
5. Performance optimization (caching policies, etc.)

## Testing ABAC

To test if ABAC is working:

```typescript
import { checkABACAccess } from "@/lib/abac";
import { getUserSubjectAttributes } from "@/lib/permissions";
import { getCurrentUser } from "@/lib/auth";

const user = await getCurrentUser();
const subject = getUserSubjectAttributes(user);

const allowed = await checkABACAccess(
  subject,
  {
    type: "document",
    status: "DRAFT",
    departmentId: user.departmentId,
  },
  "delete:document"
);

console.log("Access allowed:", allowed);
```
