import "next-auth";
import { DefaultSession, DefaultJWT } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      roleId: string;
      departmentId?: string;
      department?: string; // ABAC attribute
      jobTitleId?: string; // ABAC attribute
      jobTitle?: string; // ABAC attribute
    } & DefaultSession["user"];
  }

  interface User {
    role?: string;
    roleId?: string;
    departmentId?: string;
    department?: string; // ABAC attribute
    jobTitleId?: string; // ABAC attribute
    jobTitle?: string; // ABAC attribute
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id: string;
    role: string;
    roleId: string;
    departmentId?: string;
    department?: string; // ABAC attribute
    jobTitleId?: string; // ABAC attribute
    jobTitle?: string; // ABAC attribute
  }
}
