"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma, isDatabaseConfigured } from "../db/prisma";
import { verifyPassword } from "./password";
import { createSession, destroySession, getSession } from "./session";

import { createOtpChallenge, verifyOtpChallenge, isOtpEnabled } from "./otp";

export async function loginAdminAction(formData: FormData) {
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { success: false, error: "Email and password are required." };
  }

  try {
    // If database is configured and connected, check database AdminUser
    if (isDatabaseConfigured()) {
      try {
        const user = await prisma.adminUser.findUnique({
          where: { email },
          include: {
            appRole: {
              include: {
                permissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        });

        if (user && user.isActive) {
          const isValid = await verifyPassword(password, user.passwordHash);
          if (isValid) {
            // Check if per-administrator Email OTP is enabled for this account
            if (user.otpEnabled) {
              const { challengeId, requiresOtp } = await createOtpChallenge(user.id, user.email);
              if (requiresOtp) {
                return {
                  success: true,
                  requiresOtp: true,
                  challengeId,
                  email: user.email,
                  message: `A 6-digit verification code has been dispatched to ${user.email}.`,
                };
              }
            }

            const permissions =
              user.appRole?.permissions?.map((p) => p.permission.action) || [];
            if (user.role === "SUPER_ADMIN" || user.appRole?.code === "SUPER_ADMIN") {
              permissions.push("*");
            }

            await createSession({
              id: user.id,
              email: user.email,
              name: user.name,
              role: user.role,
              appRoleCode: user.appRole?.code,
              permissions,
            });

            // Update lastLoginAt
            await prisma.adminUser.update({
              where: { id: user.id },
              data: { lastLoginAt: new Date() },
            });

            revalidatePath("/admin");
            return { success: true };
          }
        }

        return {
          success: false,
          error: "Invalid email address or password. Please try again.",
        };
      } catch (dbError) {
        console.error("Database authentication query failed:", dbError);
        return {
          success: false,
          error: "Database authentication service unavailable. Please try again later.",
        };
      }
    }

    return {
      success: false,
      error: "Authentication service unavailable. Database connection not configured.",
    };
  } catch (error: any) {
    console.error("Admin login error:", error);
    return {
      success: false,
      error: "An internal authentication error occurred. Please try again.",
    };
  }
}

export async function verifyOtpAdminAction(formData: FormData) {
  const challengeId = formData.get("challengeId") as string;
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const otpCode = (formData.get("otpCode") as string)?.trim();

  if (!challengeId || !email || !otpCode) {
    return { success: false, error: "Missing verification parameters." };
  }

  const result = await verifyOtpChallenge(challengeId, email, otpCode);
  if (!result.valid) {
    return { success: false, error: result.error || "Invalid security code." };
  }

  try {
    if (result.userId && result.userId !== "admin-initial") {
      const user = await prisma.adminUser.findUnique({
        where: { id: result.userId },
        include: {
          appRole: {
            include: {
              permissions: {
                include: {
                  permission: true,
                },
              },
            },
          },
        },
      });

      if (user && user.isActive) {
        const permissions =
          user.appRole?.permissions?.map((p) => p.permission.action) || [];
        if (user.role === "SUPER_ADMIN" || user.appRole?.code === "SUPER_ADMIN") {
          permissions.push("*");
        }

        await createSession({
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          appRoleCode: user.appRole?.code,
          permissions,
        });

        await prisma.adminUser.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });

        revalidatePath("/admin");
        return { success: true };
      }
    }

    // Default fallback initial admin session
    await createSession({
      id: "admin-initial",
      email,
      name: process.env.INITIAL_ADMIN_NAME || "YSIF Lead Administrator",
      role: "SUPER_ADMIN",
      appRoleCode: "SUPER_ADMIN",
      permissions: ["*"],
    });
    revalidatePath("/admin");
    return { success: true };
  } catch (e: any) {
    console.error("Failed to establish session after OTP:", e);
    return { success: false, error: "Authentication session establishment failed." };
  }
}


export async function logoutAdminAction() {
  await destroySession();
  revalidatePath("/");
  redirect("/admin/login");
}

export async function requireAdminSession() {
  const session = await getSession();
  if (!session) {
    redirect("/admin/login");
  }
  return session;
}
