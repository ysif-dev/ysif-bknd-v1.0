import crypto from "crypto";
import { Resend } from "resend";
import { prisma } from "../db/prisma";

export function isOtpEnabled(): boolean {
  return (
    process.env.ADMIN_EMAIL_OTP_ENABLED === "true" ||
    process.env.ADMIN_EMAIL_OTP_ENABLED === "1"
  );
}

export function hashOtp(code: string): string {
  return crypto.createHash("sha256").update(code.trim()).digest("hex");
}

let resendClient: Resend | null = null;
function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) return null;
  if (!resendClient) {
    resendClient = new Resend(apiKey);
  }
  return resendClient;
}

function getFromEmail(): string {
  const configured = process.env.RESEND_FROM_EMAIL || process.env.OTP_FROM_EMAIL;
  if (!configured) return "onboarding@resend.dev";
  const trimmed = configured.trim();
  if (/@(gmail|googlemail|yahoo|hotmail|outlook)\.com$/i.test(trimmed)) {
    return "onboarding@resend.dev";
  }
  return trimmed;
}

export async function sendResendOtpEmail(
  email: string,
  code: string,
  metadata?: { name?: string; role?: string; requestId?: string; requestTime?: string }
): Promise<{ success: boolean; error?: string }> {
  const client = getResendClient();
  const rawSender = getFromEmail();
  const from = rawSender.includes("<") ? rawSender : `Youth Spark Security <${rawSender}>`;
  const templateId = (
    process.env.RESEND_ADMIN_OTP_TEMPLATE_ID ||
    process.env.RESEND_OTP_TEMPLATE_ID ||
    "498949c2-7df7-48f1-9c9e-b448db57a7de"
  ).trim();

  if (!client) {
    console.warn(`[OTP] RESEND_API_KEY is not set. Generated OTP for ${email}: [ ${code} ]`);
    return { success: true };
  }

  const baseUrl = process.env.APP_BASE_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";
  const otpVariables: Record<string, string> = {
    ADMIN_NAME: metadata?.name || "Administrator",
    ADMIN_ROLE: metadata?.role || "Administrator",
    ADMIN_EMAIL: email,
    OTP: code,
    EXPIRY_MINUTES: "5",
    REQUEST_ID: metadata?.requestId || `req_${Date.now().toString(36)}`,
    REQUEST_TIME: metadata?.requestTime || new Date().toUTCString(),
    PORTAL_URL: `${baseUrl}/admin`,
    REGISTERED_ADDRESS: "Youth Spark India Foundation, Regd. Office, New Delhi, India",
    REGISTRATION_AUTHORITY: "Ministry of Corporate Affairs, Govt. of India",
    REGISTRATION_NUMBER: "U85300DL2024NPL123456",
    OFFICIAL_WEBSITE: baseUrl.includes("localhost") ? "https://youthsparkindia.org" : baseUrl,
    CURRENT_YEAR: new Date().getFullYear().toString(),
    OTP_CODE: code,
    CODE: code,
  };

  // Primary: Official SDK Template Dispatch
  if (templateId) {
    try {
      const response = await client.emails.send({
        from,
        to: [email],
        subject: `Your YSIF Admin Security Passcode: ${code}`,
        template: {
          id: templateId,
          variables: otpVariables,
        },
      });

      if (response && !response.error && response.data?.id) {
        return { success: true };
      }

      console.warn(`[Backend OTP] Template ${templateId} call failed: ${response?.error?.message}. Falling back to styled HTML.`);
    } catch (err: any) {
      console.warn(`[Backend OTP] Error during template send: ${err.message}. Falling back.`);
    }
  }

  // Fallback: Styled HTML
  try {
    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h2 style="color: #0f172a; margin: 0; font-size: 20px; font-weight: 800; text-transform: uppercase;">Youth Spark India Foundation</h2>
          <p style="color: #64748b; font-size: 13px; margin: 4px 0 0;">Igniting Potential, Empowering Futures</p>
        </div>
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 24px; text-align: center; margin-bottom: 24px;">
          <p style="margin: 0 0 12px; color: #475569; font-size: 14px;">Your one-time administrative sign-in verification code is:</p>
          <div style="font-size: 34px; font-weight: 800; letter-spacing: 8px; color: #0284c7; background: #ffffff; padding: 12px 20px; border-radius: 8px; border: 1px solid #cbd5e1; display: inline-block;">
            ${code}
          </div>
          <p style="margin: 14px 0 0; color: #dc2626; font-size: 12px; font-weight: 600;">Valid for 5 minutes. Do not share this code with anyone.</p>
        </div>
        <p style="color: #64748b; font-size: 12px; line-height: 1.5; margin: 0;">
          If you did not initiate this administrator sign-in request, please review your account credentials immediately or notify the YSIF Security Team.
        </p>
        <div style="border-top: 1px solid #e2e8f0; margin-top: 24px; padding-top: 16px; text-align: center; color: #94a3b8; font-size: 11px;">
          Youth Spark India Foundation · Admin CMS Access Control
        </div>
      </div>
    `;

    const response = await client.emails.send({
      from,
      to: [email],
      subject: `Your YSIF Admin Security Passcode: ${code}`,
      html,
    });

    if (response && !response.error && response.data?.id) {
      return { success: true };
    }

    return { success: false, error: response?.error?.message || "Failed to dispatch email via Resend service." };
  } catch (err: any) {
    console.error("[Backend OTP] Error sending fallback email:", err);
    return { success: false, error: err?.message || "Email dispatch failed." };
  }
}

export async function createOtpChallenge(
  userId: string,
  email: string,
  metadata?: { name?: string; role?: string; requestId?: string; requestTime?: string }
): Promise<{ challengeId: string; requiresOtp: boolean; error?: string }> {
  if (!isOtpEnabled()) {
    return { challengeId: "", requiresOtp: false };
  }

  // Generate 6-digit cryptographic code
  const code = crypto.randomInt(100000, 999999).toString();
  const codeHash = hashOtp(code);
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

  // Invalidate previous pending challenges for this user/email
  try {
    await prisma.otpChallenge.deleteMany({
      where: { email },
    });
  } catch (e) {
    // ignore clean up error
  }

  const challenge = await prisma.otpChallenge.create({
    data: {
      userId,
      email,
      codeHash,
      expiresAt,
    },
  });

  const sendResult = await sendResendOtpEmail(email, code, {
    ...metadata,
    requestId: metadata?.requestId || challenge.id,
  });

  if (!sendResult.success) {
    await prisma.otpChallenge.delete({ where: { id: challenge.id } }).catch(() => {});
    return {
      challengeId: "",
      requiresOtp: false,
      error: sendResult.error || "Failed to dispatch OTP verification email.",
    };
  }

  return { challengeId: challenge.id, requiresOtp: true };
}

export async function verifyOtpChallenge(
  challengeId: string,
  email: string,
  inputCode: string
): Promise<{ valid: boolean; error?: string; userId?: string }> {
  try {
    const challenge = await prisma.otpChallenge.findUnique({
      where: { id: challengeId },
    });

    if (!challenge) {
      return { valid: false, error: "Verification challenge expired or invalid. Please sign in again." };
    }

    if (challenge.email.toLowerCase() !== email.toLowerCase()) {
      return { valid: false, error: "Identity mismatch for OTP verification." };
    }

    if (challenge.verified) {
      return { valid: false, error: "This security code has already been used." };
    }

    if (challenge.expiresAt < new Date()) {
      await prisma.otpChallenge.delete({ where: { id: challenge.id } }).catch(() => {});
      return { valid: false, error: "Verification code has expired. Please request a new code." };
    }

    if (challenge.attempts >= 5) {
      await prisma.otpChallenge.delete({ where: { id: challenge.id } }).catch(() => {});
      return { valid: false, error: "Maximum verification attempts exceeded. Please sign in again." };
    }

    const inputHash = hashOtp(inputCode);
    if (inputHash !== challenge.codeHash) {
      await prisma.otpChallenge.update({
        where: { id: challenge.id },
        data: { attempts: { increment: 1 } },
      });
      return { valid: false, error: `Invalid security code. ${4 - challenge.attempts} attempts remaining.` };
    }

    // Mark as verified
    await prisma.otpChallenge.update({
      where: { id: challenge.id },
      data: { verified: true },
    });

    return { valid: true, userId: challenge.userId };
  } catch (e: any) {
    console.error("OTP challenge verification error:", e);
    return { valid: false, error: "Error verifying security passcode." };
  }
}

export async function resendOtpChallenge(
  challengeId: string,
  email: string,
  metadata?: { name?: string; role?: string; requestId?: string; requestTime?: string }
): Promise<{
  success: boolean;
  error?: string;
  message?: string;
  remainingResends?: number;
  cooldownSeconds?: number;
}> {
  try {
    const challenge = await prisma.otpChallenge.findUnique({
      where: { id: challengeId },
    });

    if (!challenge) {
      return {
        success: false,
        error: "Verification challenge expired or not found. Please sign in again.",
      };
    }

    if (challenge.email.toLowerCase() !== email.toLowerCase()) {
      return {
        success: false,
        error: "Identity mismatch for OTP verification.",
      };
    }

    if (challenge.verified) {
      return {
        success: false,
        error: "This verification challenge has already been completed.",
      };
    }

    const MAX_RESENDS = 3;
    const resendCount = await prisma.auditLog.count({
      where: {
        action: "AUTH_LOGIN_OTP_RESENT",
        entityId: challengeId,
      },
    });

    if (resendCount >= MAX_RESENDS) {
      return {
        success: false,
        error: "Maximum resend limit (3) reached for this login session. Please sign in again to receive a fresh verification code.",
        remainingResends: 0,
      };
    }

    // Rate limiting: 15-second cooldown between resends
    const lastAudit = await prisma.auditLog.findFirst({
      where: {
        action: "AUTH_LOGIN_OTP_RESENT",
        entityId: challengeId,
      },
      orderBy: { createdAt: "desc" },
    });

    if (lastAudit) {
      const elapsedMs = Date.now() - new Date(lastAudit.createdAt).getTime();
      const cooldownMs = 15000;
      if (elapsedMs < cooldownMs) {
        const waitSec = Math.ceil((cooldownMs - elapsedMs) / 1000);
        return {
          success: false,
          error: `Please wait ${waitSec} second${waitSec > 1 ? "s" : ""} before requesting another verification code.`,
          remainingResends: MAX_RESENDS - resendCount,
          cooldownSeconds: waitSec,
        };
      }
    }

    // Generate new 6-digit cryptographic code
    const code = crypto.randomInt(100000, 999999).toString();
    const codeHash = hashOtp(code);
    const newExpiresAt = new Date(Date.now() + 5 * 60 * 1000);

    const sendResult = await sendResendOtpEmail(email, code, {
      name: metadata?.name,
      role: metadata?.role,
      requestId: metadata?.requestId || challengeId,
      requestTime: metadata?.requestTime || new Date().toUTCString(),
    });

    if (!sendResult.success) {
      return {
        success: false,
        error: sendResult.error || "Failed to dispatch verification code via email.",
        remainingResends: MAX_RESENDS - resendCount,
      };
    }

    // Invalidate previous OTP and update with new hash, reset attempts, extend expiry
    await prisma.otpChallenge.update({
      where: { id: challengeId },
      data: {
        codeHash,
        attempts: 0,
        expiresAt: newExpiresAt,
      },
    });

    // Record forensic audit log
    await prisma.auditLog.create({
      data: {
        action: "AUTH_LOGIN_OTP_RESENT",
        category: "AUTH",
        entity: "OtpChallenge",
        entityId: challengeId,
        userId: challenge.userId !== "admin-initial" ? challenge.userId : undefined,
        actorEmail: email,
        actorName: metadata?.name,
        actorRole: metadata?.role,
        targetLabel: email,
        outcome: "SUCCESS",
        details: `2FA security passcode resent. Resend #${resendCount + 1} of ${MAX_RESENDS}. Remaining resends: ${MAX_RESENDS - (resendCount + 1)}.`,
      },
    });

    const remainingResends = MAX_RESENDS - (resendCount + 1);
    return {
      success: true,
      remainingResends,
      cooldownSeconds: 15,
      message: `A fresh 6-digit verification code has been dispatched to ${email}. (${remainingResends} resend${remainingResends === 1 ? "" : "s"} remaining)`,
    };
  } catch (err: any) {
    console.error("Error resending OTP challenge:", err);
    return {
      success: false,
      error: "An error occurred while resending the security passcode. Please try again.",
    };
  }
}
