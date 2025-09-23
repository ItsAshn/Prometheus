import type { RequestHandler } from "@builder.io/qwik-city";
import { promises as fs } from "fs";
import path from "path";
import { AdminAuthService, ADMIN_COOKIE_NAME } from "~/lib/auth";

export const onPost: RequestHandler = async ({ request, json, cookie }) => {
  try {
    // Get admin token from cookie
    const adminToken = cookie.get(ADMIN_COOKIE_NAME);

    if (!adminToken) {
      json(401, {
        success: false,
        message: "Admin authentication required",
      });
      return;
    }

    // Verify admin authentication
    const tokenPayload = AdminAuthService.verifyToken(adminToken.value);

    if (!tokenPayload) {
      json(401, {
        success: false,
        message: "Invalid or expired token",
      });
      return;
    }

    // Parse the chunk data
    const formData = await request.formData();
    const chunk = formData.get("chunk") as File;
    const chunkIndex = parseInt(formData.get("chunkIndex") as string);
    const totalChunks = parseInt(formData.get("totalChunks") as string);
    const fileName = formData.get("fileName") as string;
    const uploadId = formData.get("uploadId") as string;

    if (
      !chunk ||
      isNaN(chunkIndex) ||
      isNaN(totalChunks) ||
      !fileName ||
      !uploadId
    ) {
      json(400, {
        success: false,
        message: "Missing required chunk data",
      });
      return;
    }

    // Create temp directory for this upload
    const tempDir = path.join(process.cwd(), "temp", "uploads", uploadId);
    await fs.mkdir(tempDir, { recursive: true });

    // Save the chunk
    const chunkPath = path.join(
      tempDir,
      `chunk_${chunkIndex.toString().padStart(4, "0")}`
    );
    const arrayBuffer = await chunk.arrayBuffer();
    await fs.writeFile(chunkPath, new Uint8Array(arrayBuffer));

    console.log(
      `Chunk ${chunkIndex + 1}/${totalChunks} uploaded for ${fileName}`
    );

    // Check if all chunks are uploaded
    const uploadedChunks = [];
    for (let i = 0; i < totalChunks; i++) {
      const chunkFile = path.join(
        tempDir,
        `chunk_${i.toString().padStart(4, "0")}`
      );
      try {
        await fs.access(chunkFile);
        uploadedChunks.push(i);
      } catch {
        // Chunk doesn't exist yet
      }
    }

    json(200, {
      success: true,
      message: `Chunk ${chunkIndex + 1}/${totalChunks} uploaded`,
      uploadedChunks: uploadedChunks.length,
      totalChunks,
      isComplete: uploadedChunks.length === totalChunks,
    });
  } catch (error) {
    console.error("Chunk upload error:", error);
    json(500, {
      success: false,
      message: "Internal server error during chunk upload",
    });
  }
};
