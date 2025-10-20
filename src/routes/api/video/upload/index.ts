import type { RequestHandler } from "@builder.io/qwik-city";
import { promises as fs } from "fs";
import path from "path";
import { VideoProcessor } from "~/lib/video/video-processor";
import { AdminAuthService, ADMIN_COOKIE_NAME } from "~/lib/auth";
import { CONFIG } from "~/lib/constants";

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

    // Check content-length before parsing
    const contentLength = request.headers.get("content-length");

    if (contentLength) {
      const sizeInBytes = parseInt(contentLength);
      const sizeInGB = sizeInBytes / (1024 * 1024 * 1024);

      // Check if size exceeds our limit before parsing
      if (sizeInBytes > CONFIG.VIDEO.MAX_SIZE_BYTES) {
        json(413, {
          // 413 Payload Too Large
          success: false,
          message: `File size (${sizeInGB.toFixed(2)} GB) exceeds ${CONFIG.VIDEO.MAX_SIZE_GB}GB limit. Please compress or split the video.`,
        });
        return;
      }
    }

    // Parse the multipart form data using Web API
    let formData;
    try {
      formData = await request.formData();
    } catch (error) {
      console.error("FormData parsing error:", error);

      // Check if this is a size-related error
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      if (errorMessage.includes("body") || errorMessage.includes("size")) {
        json(413, {
          success: false,
          message:
            "File too large to process. Please try a smaller file or use chunked upload.",
        });
      } else {
        json(400, {
          success: false,
          message: "Failed to parse form data. Please check the file format.",
        });
      }
      return;
    }

    const videoFile = formData.get("video") as File;
    const title = formData.get("title") as string;

    if (!videoFile || !title) {
      json(400, {
        success: false,
        message: "Video file and title are required",
      });
      return;
    }

    // Validate file size
    if (videoFile.size > CONFIG.VIDEO.MAX_SIZE_BYTES) {
      json(400, {
        success: false,
        message: `File size exceeds ${CONFIG.VIDEO.MAX_SIZE_GB}GB limit`,
      });
      return;
    }

    // Create temp directory and save uploaded file
    const uploadDir = path.join(process.cwd(), CONFIG.PATHS.TEMP_DIR);
    await fs.mkdir(uploadDir, { recursive: true });

    const tempFileName = `temp_${Date.now()}_${videoFile.name}`;
    const tempFilePath = path.join(uploadDir, tempFileName);

    // Write the file to disk
    const arrayBuffer = await videoFile.arrayBuffer();
    await fs.writeFile(tempFilePath, new Uint8Array(arrayBuffer));

    // Validate file type
    const allowedTypes = CONFIG.VIDEO.ALLOWED_MIME_TYPES;

    // Also check file extension as fallback
    const fileExtension = videoFile.name?.toLowerCase().split(".").pop();
    const allowedExtensions = CONFIG.VIDEO.ALLOWED_EXTENSIONS;

    const isValidMimeType = allowedTypes.includes(
      (videoFile.type as any) || ""
    );
    const isValidExtension = allowedExtensions.includes(
      (fileExtension as any) || ""
    );

    if (!isValidMimeType && !isValidExtension) {
      // Clean up uploaded file
      await fs.unlink(tempFilePath);
      json(400, {
        success: false,
        message: "Invalid file type. Only video files are allowed.",
      });
      return;
    }

    // Generate unique video ID
    const videoId = `video_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Process video to HLS (this runs in background)
    VideoProcessor.processVideoToHLS(tempFilePath, videoId, title)
      .then(() => {
        // Note: VideoProcessor handles cleanup of the input file
      })
      .catch((error) => {
        console.error(`Video processing failed for: ${title}`, error);
        // Clean up temp file only on error
        fs.unlink(tempFilePath).catch(() => {});
      });

    json(200, {
      success: true,
      message: "Video upload started. Processing in background.",
      videoId,
      title,
    });
  } catch (error) {
    console.error("Video upload error:", error);
    json(500, {
      success: false,
      message: "Internal server error during video upload",
    });
  }
};
