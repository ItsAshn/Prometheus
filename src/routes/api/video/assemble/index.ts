import type { RequestHandler } from "@builder.io/qwik-city";
import { promises as fs } from "fs";
import path from "path";
import { VideoProcessor } from "~/lib/video/video-processor";
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

    const { uploadId, fileName, totalChunks, title } = await request.json();

    if (!uploadId || !fileName || !totalChunks || !title) {
      json(400, {
        success: false,
        message: "Missing required assembly data",
      });
      return;
    }

    // Check that all chunks exist
    const tempDir = path.join(process.cwd(), "temp", "uploads", uploadId);
    const chunks = [];

    for (let i = 0; i < totalChunks; i++) {
      const chunkPath = path.join(
        tempDir,
        `chunk_${i.toString().padStart(4, "0")}`
      );
      try {
        await fs.access(chunkPath);
        chunks.push(chunkPath);
      } catch {
        json(400, {
          success: false,
          message: `Missing chunk ${i + 1}/${totalChunks}`,
        });
        return;
      }
    }

    // Assemble the file
    const finalFilePath = path.join(
      process.cwd(),
      "temp",
      `assembled_${Date.now()}_${fileName}`
    );
    const writeStream = await fs.open(finalFilePath, "w");

    try {
      for (const chunkPath of chunks) {
        const chunkData = await fs.readFile(chunkPath);
        await writeStream.write(chunkData);
      }
      await writeStream.close();

      // Clean up chunks
      await fs.rm(tempDir, { recursive: true, force: true });

      console.log(`File assembled: ${fileName} -> ${finalFilePath}`);

      // Validate file type
      const allowedExtensions = ["mp4", "avi", "mov", "mkv", "webm"];
      const fileExtension = fileName.toLowerCase().split(".").pop();

      if (!allowedExtensions.includes(fileExtension || "")) {
        await fs.unlink(finalFilePath);
        json(400, {
          success: false,
          message: "Invalid file type. Only video files are allowed.",
        });
        return;
      }

      // Generate unique video ID
      const videoId = `video_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      console.log(`Starting video processing for: ${title} (ID: ${videoId})`);

      // Process video to HLS (this runs in background)
      VideoProcessor.processVideoToHLS(finalFilePath, videoId, title)
        .then(() => {
          console.log(`Video processing completed for: ${title}`);
          // Note: VideoProcessor handles cleanup of the input file
        })
        .catch((error) => {
          console.error(`Video processing failed for: ${title}`, error);
          // Clean up assembled file only on error
          fs.unlink(finalFilePath).catch(console.error);
        });

      json(200, {
        success: true,
        message: "Video upload completed. Processing in background.",
        videoId,
        title,
      });
    } catch (error) {
      await writeStream.close().catch(() => {});
      await fs.unlink(finalFilePath).catch(() => {});
      throw error;
    }
  } catch (error) {
    console.error("File assembly error:", error);
    json(500, {
      success: false,
      message: "Internal server error during file assembly",
    });
  }
};
