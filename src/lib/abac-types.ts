// src/lib/abac-types.ts
// Shared ABAC types that can be used in both client and server code

export interface SubjectAttributes {
  id: string;
  email?: string;
  name?: string;
  roleId?: string;
  role?: string;
  departmentId?: string;
  department?: string;
  jobTitleId?: string;
  jobTitle?: string;
  [key: string]: any; // Allow additional attributes
}

export interface ResourceAttributes {
  id?: string;
  type: string;
  status?: string;
  expirationDate?: Date;
  departmentId?: string;
  department?: string;
  categoryId?: string;
  category?: string;
  createdBy?: string;
  [key: string]: any; // Allow additional attributes
}

export interface EnvironmentAttributes {
  time?: Date;
  ip?: string;
  [key: string]: any; // Allow additional attributes
}
