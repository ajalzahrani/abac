import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { checkABACAccessWithResource, checkABACAccess } from "@/lib/abac";
import { getUserSubjectAttributes } from "@/lib/permissions";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { allowed: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const searchParams = req.nextUrl.searchParams;
    const action = searchParams.get("action");
    const resourceType = searchParams.get("resourceType");
    const resourceId = searchParams.get("resourceId");

    if (!action || !resourceType) {
      return NextResponse.json(
        { allowed: false, error: "Missing action or resourceType" },
        { status: 400 }
      );
    }

    const subject = getUserSubjectAttributes(user);
    let allowed = false;

    if (resourceId) {
      // Fetch resource from database
      allowed = await checkABACAccessWithResource(
        subject,
        resourceType,
        resourceId,
        action
      );
    } else {
      // Generic resource check
      allowed = await checkABACAccess(
        subject,
        { type: resourceType },
        action
      );
    }

    return NextResponse.json({ allowed });
  } catch (error) {
    console.error("ABAC check error:", error);
    return NextResponse.json(
      { allowed: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { allowed: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { action, resourceType, resourceId, resource } = body;

    if (!action || !resourceType) {
      return NextResponse.json(
        { allowed: false, error: "Missing action or resourceType" },
        { status: 400 }
      );
    }

    const subject = getUserSubjectAttributes(user);
    let allowed = false;

    if (resourceId) {
      // Fetch resource from database
      allowed = await checkABACAccessWithResource(
        subject,
        resourceType,
        resourceId,
        action
      );
    } else if (resource) {
      // Use provided resource attributes
      allowed = await checkABACAccess(
        subject,
        { ...resource, type: resourceType },
        action
      );
    } else {
      // Generic resource check
      allowed = await checkABACAccess(
        subject,
        { type: resourceType },
        action
      );
    }

    return NextResponse.json({ allowed });
  } catch (error) {
    console.error("ABAC check error:", error);
    return NextResponse.json(
      { allowed: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
