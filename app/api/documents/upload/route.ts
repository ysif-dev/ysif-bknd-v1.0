import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { uploadToCloudinary, isCloudinaryConfigured } from "@/lib/media/cloudinary";
import path from "path";
import fs from "fs/promises";

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ error: "No valid file uploaded" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const originalName = (file as any).name || "document.pdf";
    const bytes = buffer.length;
    const sizeInMb = (bytes / (1024 * 1024)).toFixed(1);
    const fileSize = `${sizeInMb} MB`;
    const ext = originalName.split(".").pop()?.toUpperCase() || "PDF";

    let fileUrl: string;

    if (isCloudinaryConfigured()) {
      const base64 = buffer.toString("base64");
      const mime = file.type || "application/pdf";
      const dataUri = `data:${mime};base64,${base64}`;

      const res = await uploadToCloudinary(dataUri, {
        folder: "ysif/documents",
        originalFilename: originalName,
        title: originalName,
        uploadedBy: session.name,
      });
      fileUrl = res.asset.secureUrl;
    } else {
      // Local public storage fallback
      const uploadDir = path.join(process.cwd(), "public", "uploads", "documents");
      await fs.mkdir(uploadDir, { recursive: true });
      const safeFilename = `${Date.now()}-${originalName.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
      const filePath = path.join(uploadDir, safeFilename);
      await fs.writeFile(filePath, buffer);
      fileUrl = `/uploads/documents/${safeFilename}`;
    }

    return NextResponse.json({
      success: true,
      fileUrl,
      fileSize,
      fileType: ext,
      originalName,
    });
  } catch (error: any) {
    console.error("Document upload error:", error);
    return NextResponse.json({ error: error?.message || "Document upload failed" }, { status: 500 });
  }
}
