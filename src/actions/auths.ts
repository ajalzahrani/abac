"use server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { unstable_cache as cache } from "next/cache";

// Cached function to get user data by ID
const getCachedUserById = cache(
  async (userId: string) => {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });

    return user;
  },
  ["user-by-id"],
  { tags: ["user-session"], revalidate: 300 }, // Cache for 5 minutes
);

// Get current user by first getting session outside cache, then using cached function
export async function getCurrentUserFromDB(userId: string) {
  return getCachedUserById(userId);
}

export async function authenticateUser(email: string, password: string) {
  const user = await prisma.user.findUnique({
    where: {
      email: email,
    },
    include: {
      role: {
        select: { id: true, name: true },
      },
      department: {
        select: { id: true, name: true },
      },
      person: {
        select: {
          jobTitleId: true,
          jobTitle: {
            select: { id: true, nameEn: true },
          },
        },
      },
    },
  });

  if (!user || !user.password) {
    return null;
  }

  const isValidPassword = await bcrypt.compare(password, user.password);

  if (!isValidPassword) {
    return null;
  }

  // ABAC: Access is evaluated dynamically based on policies
  // User attributes (role, department, jobTitle) are used for policy evaluation

  return {
    ...user,
    departmentId: user.departmentId || undefined,
    // ABAC attributes are available via user object (role, department, person.jobTitle)
  };
}
