import crypto from "crypto";
import { prisma, isDatabaseConfigured } from "../db/prisma";

export interface CloudinaryUploadResult {
  asset_id: string;
  public_id: string;
  version: number;
  format: string;
  resource_type: string;
  created_at: string;
  bytes: number;
  width: number;
  height: number;
  secure_url: string;
  original_filename: string;
}

export function isCloudinaryConfigured(): boolean {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  return Boolean(
    cloudName &&
      cloudName.trim().length > 0 &&
      apiKey &&
      apiKey.trim().length > 0 &&
      apiSecret &&
      apiSecret.trim().length > 0
  );
}

export async function uploadToCloudinary(
  fileBase64OrUrl: string,
  options: {
    folder?: string;
    publicId?: string;
    originalFilename?: string;
    title?: string;
    altText?: string;
    caption?: string;
    uploadedBy?: string;
  } = {}
) {
  const folder = options.folder || "ysif";

  if (!isCloudinaryConfigured()) {
    console.warn("Cloudinary credentials are not configured. Storing asset reference in Neon with fallback URL.");
    // If Cloudinary keys are not yet provided, create a resilient record in Neon
    if (isDatabaseConfigured()) {
      const fallbackUrl = fileBase64OrUrl.startsWith("http")
        ? fileBase64OrUrl
        : "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1200&q=80";

      const mockAssetId = "local-" + Date.now();
      const mockPublicId = `${folder}/${options.publicId || Date.now()}`;

      const saved = await prisma.mediaAsset.create({
        data: {
          cloudinaryId: mockAssetId,
          publicId: mockPublicId,
          secureUrl: fallbackUrl,
          format: "webp",
          width: 1200,
          height: 800,
          bytes: 150000,
          originalFilename: options.originalFilename || "upload.webp",
          title: options.title || "Uploaded Image",
          altText: options.altText || "Youth Spark NGO Media Asset",
          caption: options.caption || null,
          folder,
          uploadedBy: options.uploadedBy || "Administrator",
        },
      });

      return {
        success: true,
        isMock: true,
        asset: saved,
        notice: "Cloudinary credentials pending configuration. Asset stored in Neon with fallback URL.",
      };
    }

    throw new Error("Neither Cloudinary nor Database is configured.");
  }

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME!;
  const apiKey = process.env.CLOUDINARY_API_KEY!;
  const apiSecret = process.env.CLOUDINARY_API_SECRET!;
  const timestamp = Math.floor(Date.now() / 1000);

  // Generate SHA-1 / SHA-256 signature for Cloudinary upload
  const paramsToSign: Record<string, string | number> = {
    folder,
    timestamp,
  };
  if (options.publicId) {
    paramsToSign.public_id = options.publicId;
  }

  const sortedKeys = Object.keys(paramsToSign).sort();
  const stringToSign =
    sortedKeys.map((k) => `${k}=${paramsToSign[k]}`).join("&") + apiSecret;

  const signature = crypto.createHash("sha1").update(stringToSign).digest("hex");

  const formData = new FormData();
  formData.append("file", fileBase64OrUrl);
  formData.append("api_key", apiKey);
  formData.append("timestamp", String(timestamp));
  formData.append("folder", folder);
  formData.append("signature", signature);
  if (options.publicId) {
    formData.append("public_id", options.publicId);
  }

  const uploadEndpoint = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
  const response = await fetch(uploadEndpoint, {
    method: "POST",
    body: formData,
  });

  const result = await response.json();

  if (!response.ok || result.error) {
    throw new Error(result.error?.message || "Failed to upload image to Cloudinary.");
  }

  // Persist metadata into Neon PostgreSQL MediaAsset table
  const saved = await prisma.mediaAsset.upsert({
    where: { cloudinaryId: result.asset_id },
    update: {
      publicId: result.public_id,
      secureUrl: result.secure_url,
      format: result.format,
      width: result.width,
      height: result.height,
      bytes: result.bytes,
      originalFilename: options.originalFilename || result.original_filename,
      title: options.title || options.originalFilename || result.public_id,
      altText: options.altText || options.title || "Youth Spark Community Media",
      caption: options.caption || null,
      folder,
      uploadedBy: options.uploadedBy || "Administrator",
    },
    create: {
      cloudinaryId: result.asset_id,
      publicId: result.public_id,
      secureUrl: result.secure_url,
      format: result.format,
      width: result.width,
      height: result.height,
      bytes: result.bytes,
      originalFilename: options.originalFilename || result.original_filename,
      title: options.title || options.originalFilename || result.public_id,
      altText: options.altText || options.title || "Youth Spark Community Media",
      caption: options.caption || null,
      folder,
      uploadedBy: options.uploadedBy || "Administrator",
    },
  });

  return {
    success: true,
    isMock: false,
    asset: saved,
  };
}

export async function deleteFromCloudinary(id: string) {
  const asset = await prisma.mediaAsset.findUnique({ where: { id } });
  if (!asset) return { success: false, error: "Asset not found" };

  if (isCloudinaryConfigured() && !asset.cloudinaryId.startsWith("local-")) {
    try {
      const cloudName = process.env.CLOUDINARY_CLOUD_NAME!;
      const apiKey = process.env.CLOUDINARY_API_KEY!;
      const apiSecret = process.env.CLOUDINARY_API_SECRET!;
      const timestamp = Math.floor(Date.now() / 1000);

      const stringToSign = `public_id=${asset.publicId}&timestamp=${timestamp}${apiSecret}`;
      const signature = crypto.createHash("sha1").update(stringToSign).digest("hex");

      const formData = new FormData();
      formData.append("public_id", asset.publicId);
      formData.append("api_key", apiKey);
      formData.append("timestamp", String(timestamp));
      formData.append("signature", signature);

      await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`, {
        method: "POST",
        body: formData,
      });
    } catch (e) {
      console.warn("Failed to delete from Cloudinary CDN:", e);
    }
  }

  await prisma.mediaAsset.delete({ where: { id } });
  return { success: true };
}
