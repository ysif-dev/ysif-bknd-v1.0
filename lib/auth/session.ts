import crypto from "crypto";
import { cookies } from "next/headers";

const SESSION_COOKIE_NAME = "ysif_admin_session";
const SESSION_MAX_AGE_SECONDS = 8 * 60 * 60; // 8 hours

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: "SUPER_ADMIN" | "EDITOR" | "VOLUNTEER_COORDINATOR";
  appRoleCode?: string;
  permissions?: string[];
}

export function hasPermission(
  session: SessionUser | null,
  requiredAction: string
): boolean {
  if (!session) return false;
  if (session.role === "SUPER_ADMIN" || session.appRoleCode === "SUPER_ADMIN") {
    return true;
  }
  if (!session.permissions || session.permissions.length === 0) {
    return false;
  }
  return session.permissions.some(
    (p) =>
      p === "*" ||
      p === requiredAction ||
      (p.endsWith(".*") && requiredAction.startsWith(p.slice(0, -1)))
  );
}

interface SessionPayload extends SessionUser {
  exp: number; // unix timestamp in ms
}

function getSecretKey(): string {
  return (
    process.env.AUTH_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    "ysif_super_secure_fallback_secret_key_minimum_32_chars_2026!"
  );
}

export function signToken(payload: SessionPayload): string {
  const secret = getSecretKey();
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto
    .createHmac("sha256", secret)
    .update(data)
    .digest("base64url");
  return `${data}.${signature}`;
}

export function verifyToken(token: string): SessionPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 2) return null;
    const [data, signature] = parts;
    const secret = getSecretKey();
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(data)
      .digest("base64url");

    // Timing-safe comparison to prevent timing attacks
    const sigBuf = Buffer.from(signature);
    const expSigBuf = Buffer.from(expectedSignature);
    if (sigBuf.length !== expSigBuf.length) return null;
    if (!crypto.timingSafeEqual(sigBuf, expSigBuf)) return null;

    const payload: SessionPayload = JSON.parse(
      Buffer.from(data, "base64url").toString("utf-8")
    );

    if (Date.now() > payload.exp) {
      return null; // Expired
    }

    return payload;
  } catch (error) {
    return null;
  }
}

export async function createSession(user: SessionUser): Promise<void> {
  const exp = Date.now() + SESSION_MAX_AGE_SECONDS * 1000;
  const token = signToken({ ...user, exp });
  const cookieStore: any = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore: any = await cookies();
  const cookie = cookieStore.get(SESSION_COOKIE_NAME);
  if (!cookie || !cookie.value) return null;
  const payload = verifyToken(cookie.value);
  if (!payload) return null;
  return {
    id: payload.id,
    email: payload.email,
    name: payload.name,
    role: payload.role,
    appRoleCode: payload.appRoleCode,
    permissions: payload.permissions || [],
  };
}

export async function destroySession(): Promise<void> {
  const cookieStore: any = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}
