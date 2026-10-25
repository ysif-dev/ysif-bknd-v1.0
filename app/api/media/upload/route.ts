import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { uploadToCloudinary, isCloudinaryConfigured } from "@/lib/media/cloudinary";

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file");
    const folder = (formData.get("folder") as string) || "ysif";
    const title = formData.get("title") as string | undefined;
    const altText = formData.get("altText") as string | undefined;
    const caption = formData.get("caption") as string | undefined;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    let fileToUpload: string;
    let originalFilename = "upload";

    if (typeof file === "string") {
      fileToUpload = file;
    } else if (file instanceof Blob) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const base64 = buffer.toString("base64");
      const mime = file.type || "image/jpeg";
      fileToUpload = `data:${mime};base64,${base64}`;
      originalFilename = (file as any).name || "upload";
    } else {
      return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
    }

    const result = await uploadToCloudinary(fileToUpload, {
      folder,
      originalFilename,
      title: title || originalFilename,
      altText: altText || title || originalFilename,
      caption,
      uploadedBy: session.name,
    });

    return NextResponse.json({
      success: true,
      asset: result.asset,
      notice: result.notice,
      isConfigured: isCloudinaryConfigured(),
    });
  } catch (error: any) {
    console.error("Media upload error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to process image upload" },
      { status: 500 }
    );
  }
}
