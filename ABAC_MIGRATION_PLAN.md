# ABAC Migration Plan

## Overview
This document outlines the steps to migrate from Role-Based Access Control (RBAC) to Attribute-Based Access Control (ABAC) in the application.

## What is ABAC?

Attribute-Based Access Control (ABAC) evaluates access decisions based on:
- **Subject Attributes**: User properties (department, role, jobTitle, etc.)
- **Resource Attributes**: Resource properties (document category, status, department, etc.)
- **Environment Attributes**: Context (time, location, IP, etc.)
- **Action**: What the user is trying to do (read, write, delete, approve, etc.)

## Key Differences from RBAC

### RBAC (Current)
- Users have roles
- Roles have permissions
- Access is granted based on role membership
- Example: "User with role 'ADMIN' can delete documents"

### ABAC (New)
- Policies define rules based on attributes
- Access is evaluated dynamically based on context
- More granular and flexible
- Example: "User can delete documents if: user.department === document.department AND document.status === 'DRAFT' AND user.jobTitle === 'MANAGER'"

## Migration Steps

### Step 1: Database Schema Changes

#### New Models to Add:
1. **Policy**: Defines access policies
   - `id`, `name`, `description`, `effect` (ALLOW/DENY)
   - `action` (e.g., "delete:document", "approve:document")
   - `resourceType` (e.g., "document", "user", "department")
   - `priority` (for policy ordering)
   - `isActive`

2. **PolicyRule**: Defines conditions for policies
   - `id`, `policyId`
   - `attribute` (e.g., "user.department", "resource.status")
   - `operator` (e.g., "equals", "in", "notEquals", "greaterThan")
   - `value` (JSON field for flexible value storage)
   - `logicalOperator` (AND/OR for combining rules)

3. **PolicyAssignment**: Assigns policies to users/roles (optional, for backward compatibility)
   - `id`, `policyId`, `userId` (optional), `roleId` (optional)

#### Models to Keep (for backward compatibility):
- Keep `Role` model (may be used as an attribute)
- Keep `Permission` model (can be migrated to policies)
- Keep `RolePermission` (can be phased out gradually)

#### Models to Update:
- `User`: Keep `roleId` for now (can be used as attribute), add attributes JSON field for extensibility

### Step 2: Create ABAC Evaluation Engine

Create `src/lib/abac.ts` with:
- `evaluatePolicy(policy, subject, resource, action, environment)`: Evaluates a single policy
- `checkAccess(subject, resource, action, environment)`: Checks if access should be granted
- `getApplicablePolicies(resourceType, action)`: Gets policies that apply to a resource/action

### Step 3: Update Authentication & Authorization

1. **Update `src/lib/auth.ts`**:
   - Remove permission loading from role
   - Load user attributes instead
   - Store user attributes in session

2. **Update `src/lib/permissions.ts`**:
   - Replace `hasPermission()` with `checkABACAccess()`
   - New function signature: `checkABACAccess(user, resource, action, context?)`

3. **Update `src/lib/server-permissions.ts`**:
   - Replace `checkServerPermission()` with `checkServerABACAccess()`

### Step 4: Update Components

1. **Update `src/components/auth/permission-check.tsx`**:
   - Change to accept: `action`, `resource`, `resourceId` (optional)
   - Use ABAC evaluation instead of permission check

2. **Update `src/config/nav.config.ts`**:
   - Replace `requiredPermissions` with `requiredAction` and `resourceType`
   - Example: `{ action: "view:documents", resourceType: "document" }`

### Step 5: Update Action Files

Update all server actions that check permissions:
- `src/actions/documents.ts`
- `src/actions/auths.ts`
- `src/actions/permissions.ts`
- `src/actions/roles.ts`
- `src/actions/departments.ts`

### Step 6: Create Policy Management UI

Create admin interface for:
- Creating/editing policies
- Managing policy rules
- Testing policies
- Viewing policy evaluation logs

### Step 7: Data Migration

1. Convert existing Role-Permission mappings to Policies
2. Create migration script to:
   - Create policies from existing permissions
   - Create policy rules based on role assignments
   - Preserve existing access patterns

### Step 8: Testing

1. Test all existing access patterns still work
2. Test new ABAC features
3. Test policy evaluation performance
4. Test edge cases

## Policy Examples

### Example 1: Department-based Document Access
```json
{
  "name": "Department Document Access",
  "action": "view:document",
  "resourceType": "document",
  "effect": "ALLOW",
  "rules": [
    {
      "attribute": "user.department",
      "operator": "equals",
      "value": "resource.department"
    }
  ]
}
```

### Example 2: Document Status-based Actions
```json
{
  "name": "Edit Draft Documents",
  "action": "edit:document",
  "resourceType": "document",
  "effect": "ALLOW",
  "rules": [
    {
      "attribute": "resource.status",
      "operator": "in",
      "value": ["DRAFT", "REJECTED"]
    },
    {
      "attribute": "user.id",
      "operator": "equals",
      "value": "resource.createdBy"
    }
  ]
}
```

### Example 3: Approve Documents
```json
{
  "name": "Approve Documents",
  "action": "approve:document",
  "resourceType": "document",
  "effect": "ALLOW",
  "rules": [
    {
      "attribute": "resource.status",
      "operator": "equals",
      "value": "DRAFT"
    },
    {
      "attribute": "user.department",
      "operator": "equals",
      "value": "resource.department"
    }
  ]
}
```

## Backward Compatibility

- Keep Role model for transition period
- Support both RBAC and ABAC during migration
- Gradually migrate permissions to policies
- Provide migration utilities

## Benefits of ABAC

1. **Granular Control**: Fine-grained access based on multiple attributes
2. **Dynamic Policies**: Policies can change without reassigning roles
3. **Context-Aware**: Consider resource state, time, location
4. **Scalable**: Easier to manage than role explosion
5. **Flexible**: Support complex business rules

## Timeline

1. **Phase 1** (Week 1): Schema changes and ABAC engine
2. **Phase 2** (Week 2): Update auth and permission checks
3. **Phase 3** (Week 3): Update components and actions
4. **Phase 4** (Week 4): Policy management UI and migration
5. **Phase 5** (Week 5): Testing and refinement
