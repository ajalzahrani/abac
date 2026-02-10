# ABAC vs RBAC: Understanding the Difference

## Key Question: "Should we have roles like 'view:documents' in ABAC?"

**Answer: NO!** In ABAC, you don't create roles for permissions. Instead, you create **policies** that check **attributes**.

## RBAC (Role-Based Access Control) - The Old Way

### How RBAC Works:
1. **Roles** are created (e.g., "ADMIN", "DOCTOR", "NURSE")
2. **Permissions** are created (e.g., "view:documents", "delete:documents")
3. **Roles are assigned permissions** (e.g., ADMIN role has "view:documents" permission)
4. **Users are assigned roles** (e.g., User A has ADMIN role)
5. **Access is checked**: "Does user's role have this permission?"

### Example RBAC:
```
Role: ADMIN
  └─ Permissions: ["view:documents", "delete:documents", "manage:users"]

User: John
  └─ Role: ADMIN
      └─ Can: view:documents, delete:documents, manage:users
```

## ABAC (Attribute-Based Access Control) - The New Way

### How ABAC Works:
1. **Policies** are created that define **rules based on attributes**
2. **Attributes** are properties of users, resources, or environment
3. **Access is evaluated dynamically** based on current context
4. **No direct role-permission mapping** - everything is attribute-based

### Example ABAC:
```
Policy: "View Documents"
  Action: "view:documents"
  Resource Type: "document"
  Rules:
    - user.role equals "ADMIN" OR
    - user.department equals resource.department

User: John
  Attributes: { role: "ADMIN", department: "IT" }
  
  When accessing document in "IT" department:
    ✅ ALLOWED (matches policy rule)
```

## Key Differences

| Aspect | RBAC | ABAC |
|--------|------|------|
| **Permission Model** | Roles have permissions | Policies check attributes |
| **Granularity** | Fixed (role-based) | Dynamic (attribute-based) |
| **Context Awareness** | No | Yes (resource, environment) |
| **Flexibility** | Limited | High |
| **Example** | "ADMIN role can view documents" | "Users with role=ADMIN OR department=IT can view documents in their department" |

## In Your ABAC System

### ✅ What You Have (Correct):
- **Roles** as **attributes** (e.g., `user.role === "ADMIN"`)
- **Policies** that check role attributes
- **Dynamic evaluation** based on user attributes

### ❌ What You DON'T Need:
- Roles named "view:documents" 
- Permission-to-role mappings
- Static role-permission assignments

### ✅ How It Works in Your System:

**Policy Example:**
```typescript
{
  name: "Admin View Users",
  action: "view:users",
  resourceType: "user",
  effect: "ALLOW",
  rules: [
    {
      attribute: "user.role",
      operator: "equals",
      value: "ADMIN"
    }
  ]
}
```

**Evaluation:**
1. User tries to access "view:users"
2. System finds policies for action="view:users", resourceType="user"
3. Evaluates rules: Does `user.role === "ADMIN"`?
4. If yes → ALLOW, if no → check next policy or DENY

## Benefits of ABAC Over RBAC

1. **More Granular**: Can check multiple attributes (role + department + time)
2. **Context-Aware**: Can consider resource state (document status, department)
3. **Dynamic**: Policies can change without reassigning roles
4. **Scalable**: No role explosion (don't need roles for every permission combination)
5. **Flexible**: Can create complex rules (e.g., "Users in Finance department can approve invoices over $1000 during business hours")

## Migration from RBAC to ABAC

### Step 1: Keep Roles as Attributes
- Roles still exist (ADMIN, DOCTOR, etc.)
- But they're now **attributes**, not permission containers

### Step 2: Create Policies Instead of Role-Permissions
**Old RBAC:**
```typescript
Role: ADMIN → Permissions: ["view:users", "delete:users"]
```

**New ABAC:**
```typescript
Policy: "Admin View Users"
  Rules: user.role === "ADMIN"
  Action: "view:users"

Policy: "Admin Delete Users"  
  Rules: user.role === "ADMIN"
  Action: "delete:users"
```

### Step 3: Use Attributes for Dynamic Rules
```typescript
Policy: "Department Document Access"
  Rules: 
    - user.department === resource.department
    - resource.status === "PUBLISHED"
  Action: "view:document"
```

## Summary

- **ABAC doesn't use roles as permission containers**
- **Roles are attributes** that policies can check
- **Policies define access rules** based on attributes
- **No need for roles like "view:documents"** - that's RBAC thinking
- **In ABAC, you create policies** that check if `user.role === "ADMIN"` to allow access

Your current implementation is correct! The issue was likely with policy evaluation or role value matching, which we've now fixed with better comparison logic and admin catch-all policies.
