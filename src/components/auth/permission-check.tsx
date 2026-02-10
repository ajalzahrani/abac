// src/components/auth/permission-check.tsx
"use client";

import { ReactNode, useEffect, useState } from "react";
import { useSession } from "next-auth/react";

interface PermissionCheckProps {
  // ABAC props
  action: string; // e.g., "view:document", "delete:document" (required)
  resourceType: string; // e.g., "document", "user" (required)
  resourceId?: string; // Resource ID to fetch from DB
  resource?: { [key: string]: any }; // Resource attributes (if resourceId not provided)
  
  children: ReactNode;
  fallback?: ReactNode;
}

export function PermissionCheck({
  action,
  resourceType,
  resourceId,
  resource,
  children,
  fallback = null,
}: PermissionCheckProps) {
  const { data: session, status } = useSession();
  const [canAccess, setCanAccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function checkAccess() {
      if (status !== "authenticated" || !session?.user) {
        setCanAccess(false);
        setIsLoading(false);
        return;
      }

      try {
        let response: Response;
        
        if (resourceId) {
          // Fetch resource from API using GET
          response = await fetch(`/api/abac/check?action=${action}&resourceType=${resourceType}&resourceId=${resourceId}`);
        } else {
          // Use POST to send resource attributes
          response = await fetch("/api/abac/check", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              action,
              resourceType,
              resource: resource ? { ...resource, type: resource.type || resourceType } : undefined,
            }),
          });
        }
        
        const data = await response.json();
        setCanAccess(data.allowed || false);
      } catch (error) {
        console.error("ABAC check error:", error);
        setCanAccess(false);
      }
      
      setIsLoading(false);
    }

    checkAccess();
  }, [session, status, action, resourceType, resourceId, resource]);

  if (status === "loading" || isLoading) {
    return null;
  }

  return canAccess ? <>{children}</> : <>{fallback}</>;
}
