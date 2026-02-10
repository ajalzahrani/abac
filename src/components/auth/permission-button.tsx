"use client";

import { Button, ButtonProps } from "@/components/ui/button";
import { PermissionCheck } from "./permission-check";

interface PermissionButtonProps extends Omit<ButtonProps, 'resource'> {
  action: string; // ABAC action (e.g., "approve:document")
  resourceType: string; // ABAC resource type (e.g., "document")
  resourceId?: string; // Optional resource ID
  resource?: { [key: string]: any }; // Optional resource attributes
  fallback?: React.ReactNode;
  asChild?: boolean;
  children?: React.ReactNode;
}

export function PermissionButton({
  action,
  resourceType,
  resourceId,
  resource,
  children,
  fallback = null,
  asChild = false,
  ...props
}: PermissionButtonProps) {
  return (
    <PermissionCheck
      action={action}
      resourceType={resourceType}
      resourceId={resourceId}
      resource={resource}
      fallback={fallback}>
      <Button {...props} asChild={asChild}>
        {children}
      </Button>
    </PermissionCheck>
  );
}
