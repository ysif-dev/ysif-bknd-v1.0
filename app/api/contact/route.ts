import { NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";
import { createContactEnquiry } from "@/lib/dal";

const contactSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Invalid email address"),
  phone: z.string().max(20).optional(),
  type: z.string().min(2).max(50),
  subject: z.string().min(3, "Subject must be at least 3 characters").max(150),
  message: z.string().min(10, "Message must be at least 10 characters").max(2000),
});

// Simple in-memory rate limiter per IP hash
const rateLimitMap = new Map<string, { count: number; expiresAt: number }>();

function checkRateLimit(ipHash: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ipHash);
  if (!record || now > record.expiresAt) {
    rateLimitMap.set(ipHash, { count: 1, expiresAt: now + 10 * 60 * 1000 }); // 10 mins
    return true;
  }
  if (record.count >= 5) {
    return false;
  }
  record.count += 1;
  return true;
}

export async function POST(request: Request) {
  try {
    const rawIp =
      request.headers.get("x-forwarded-for")?.split(",")[0] ||
      request.headers.get("x-real-ip") ||
      "127.0.0.1";

    const ipHash = crypto
      .createHash("sha256")
      .update(rawIp + "ysif_rate_salt_2026")
      .digest("hex")
      .substring(0, 16);

    if (!checkRateLimit(ipHash)) {
      return NextResponse.json(
        { error: "Too many submissions. Please wait 10 minutes before trying again." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const result = contactSchema.safeParse(body);

    if (!result.success) {
      const errorMessage = result.error.errors.map((e) => e.message).join(", ");
      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }

    const saved = await createContactEnquiry({
      fullName: result.data.fullName,
      email: result.data.email,
      phone: result.data.phone,
      type: result.data.type,
      subject: result.data.subject,
      message: result.data.message,
      ipHash,
    });

    return NextResponse.json({
      success: true,
      id: saved.id,
      message: "Enquiry successfully received by Youth Spark India Foundation.",
    });
  } catch (error: any) {
    console.error("Contact API error:", error);
    return NextResponse.json(
      { error: "Internal server error. Please try again later." },
      { status: 500 }
    );
  }
}
