import type { RequestHandler } from "@builder.io/qwik-city";
import { writeFile, mkdir, unlink } from "fs/promises";
import { existsSync } from "fs";
import { join } from "path";
import { AdminAuthService, ADMIN_COOKIE_NAME } from "~/lib/auth";

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export const onPost: RequestHandler = async ({ json, request, cookie }) => {
  console.log("[Upload Image] POST request received");

  const authCookie = cookie.get(ADMIN_COOKIE_NAME);
  if (!authCookie?.value) {
    console.log("[Upload Image] Unauthorized access attempt - no cookie");
    json(401, { message: "Unauthorized" });
    return;
  }

  const isValidToken = AdminAuthService.verifyToken(authCookie.value);
  if (!isValidToken) {
    console.log("[Upload Image] Unauthorized access attempt - invalid token");
    json(401, { message: "Unauthorized" });
    return;
  }

  try {
    const formData = await request.formData();
    const file = formData.get("image") as File;
    const imageType = formData.get("type") as string; // 'banner' or 'avatar'

    if (!file) {
      json(400, { message: "No image file provided" });
      return;
    }

    if (!imageType || !["banner", "avatar"].includes(imageType)) {
      json(400, {
        message: "Invalid image type. Must be 'banner' or 'avatar'",
      });
      return;
    }

    // Validate file type
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      json(400, {
        message: `Invalid file type. Allowed types: ${ALLOWED_IMAGE_TYPES.join(", ")}`,
      });
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      json(400, {
        message: `File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
      });
      return;
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), "public", "uploads");
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    // Generate filename with timestamp
    const timestamp = Date.now();
    const extension = file.name.split(".").pop() || "jpg";
    const filename = `${imageType}-${timestamp}.${extension}`;
    const filepath = join(uploadsDir, filename);

    // Delete old image if exists
    try {
      const fs = await import("fs");
      const files = fs.readdirSync(uploadsDir);
      const oldFiles = files.filter((f) => f.startsWith(`${imageType}-`));
      for (const oldFile of oldFiles) {
        await unlink(join(uploadsDir, oldFile)).catch(() => {});
      }
    } catch {
      console.log("[Upload Image] No old images to delete");
    }

    // Save the file
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    await writeFile(filepath, buffer);

    const imageUrl = `/uploads/${filename}`;
    console.log(`[Upload Image] ${imageType} saved successfully:`, imageUrl);

    json(200, {
      message: "Image uploaded successfully",
      imageUrl,
      imageType,
    });
    return;
  } catch (error) {
    console.error("[Upload Image] Error uploading image:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Internal server error";
    json(500, { message: errorMessage });
    return;
  }
};
