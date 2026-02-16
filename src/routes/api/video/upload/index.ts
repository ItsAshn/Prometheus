import type { RequestHandler } from "@builder.io/qwik-city";
import { promises as fs } from "fs";
import path from "path";
import { VideoProcessor } from "~/lib/video/video-processor";
import { AdminAuthService, ADMIN_COOKIE_NAME } from "~/lib/auth";
import { CONFIG } from "~/lib/constants";
import {
  rateLimiters,
  getClientIP,
  createRateLimitHeaders,
} from "~/lib/rate-limiter";
import {
  ErrorMessages,
  formatSystemError,
  logError,
  createErrorResponse,
} from "~/lib/errors";
import {
  getDiskSpace,
  hasEnoughDiskSpace,
  formatBytes,
} from "~/lib/disk-space";

export const onPost: RequestHandler = async ({
  request,
  json,
  cookie,
  headers,
}) => {
  try {
    // Apply rate limiting for uploads
    const clientIP = getClientIP(headers);
    const rateLimitHeaders = createRateLimitHeaders(
      rateLimiters.upload,
      clientIP,
    );

    if (!rateLimiters.upload.check(clientIP)) {
      // Set rate limit headers
      Object.entries(rateLimitHeaders).forEach(([key, value]) => {
        headers.set(key, value);
      });

      json(429, {
        success: false,
        message: "Upload limit reached. Please try again in an hour.",
      });
      return;
    }

    // Get admin token from cookie
    const adminToken = cookie.get(ADMIN_COOKIE_NAME);

    if (!adminToken) {
      json(401, createErrorResponse(ErrorMessages.AUTH.REQUIRED));
      return;
    }

    // Verify admin authentication
    const tokenPayload = AdminAuthService.verifyToken(adminToken.value);

    if (!tokenPayload) {
      json(401, createErrorResponse(ErrorMessages.AUTH.TOKEN_EXPIRED));
      return;
    }

    // Check content-length before parsing
    const contentLength = request.headers.get("content-length");

    if (contentLength) {
      const sizeInBytes = parseInt(contentLength);
      const sizeInGB = sizeInBytes / (1024 * 1024 * 1024);

      // Check if size exceeds our limit before parsing
      if (sizeInBytes > CONFIG.VIDEO.MAX_SIZE_BYTES) {
        json(
          413,
          createErrorResponse(
            ErrorMessages.UPLOAD.FILE_TOO_LARGE(
              sizeInGB,
              CONFIG.VIDEO.MAX_SIZE_GB,
            ),
            "Try compressing the video using a tool like HandBrake, or split it into smaller parts.",
          ),
        );
        return;
      }

      // Check disk space before accepting upload
      // Require 3x the file size to account for processing (original + HLS segments + safety buffer)
      const requiredSpace = sizeInBytes * 3;
      const uploadDir = path.join(process.cwd(), CONFIG.PATHS.TEMP_DIR);

      try {
        const hasSpace = await hasEnoughDiskSpace(uploadDir, requiredSpace, 10);

        if (!hasSpace) {
          const diskInfo = await getDiskSpace(uploadDir);
          const availableGB = diskInfo.available / (1024 * 1024 * 1024);

          json(
            507,
            createErrorResponse(
              ErrorMessages.UPLOAD.DISK_FULL(availableGB),
              `This upload requires approximately ${formatBytes(requiredSpace)} of space (including processing overhead). Please free up disk space and try again.`,
            ),
          );
          return;
        }
      } catch (diskError) {
        logError("Disk Space Check", diskError);
        // Continue with upload if disk check fails (conservative approach)
        console.warn("Could not check disk space, proceeding with upload");
      }
    }

    // Parse the multipart form data using Web API
    let formData;
    try {
      formData = await request.formData();
    } catch (error) {
      logError("Upload FormData Parse", error);

      // Check if this is a size-related error
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      if (errorMessage.includes("body") || errorMessage.includes("size")) {
        json(
          413,
          createErrorResponse(
            ErrorMessages.UPLOAD.PARSE_FAILED,
            "The file is too large to upload directly. Try using the chunked upload feature or compress the video first.",
          ),
        );
      } else {
        json(
          400,
          createErrorResponse(
            ErrorMessages.UPLOAD.PARSE_FAILED,
            "Ensure the file is a valid video and your connection is stable.",
          ),
        );
      }
      return;
    }

    const videoFile = formData.get("video") as File;
    const title = formData.get("title") as string;

    if (!videoFile) {
      json(400, createErrorResponse(ErrorMessages.UPLOAD.FILE_REQUIRED));
      return;
    }

    if (!title || title.trim().length === 0) {
      json(400, createErrorResponse(ErrorMessages.UPLOAD.TITLE_REQUIRED));
      return;
    }

    // Validate file size
    if (videoFile.size > CONFIG.VIDEO.MAX_SIZE_BYTES) {
      const sizeGB = videoFile.size / (1024 * 1024 * 1024);
      json(
        413,
        createErrorResponse(
          ErrorMessages.UPLOAD.FILE_TOO_LARGE(sizeGB, CONFIG.VIDEO.MAX_SIZE_GB),
        ),
      );
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
      (videoFile.type as any) || "",
    );
    const isValidExtension = allowedExtensions.includes(
      (fileExtension as any) || "",
    );

    if (!isValidMimeType && !isValidExtension) {
      // Clean up uploaded file
      await fs.unlink(tempFilePath).catch(() => {});
      json(
        400,
        createErrorResponse(
          ErrorMessages.UPLOAD.INVALID_FORMAT(
            Array.from(CONFIG.VIDEO.ALLOWED_EXTENSIONS),
          ),
          `Detected file type: ${fileExtension || videoFile.type || "unknown"}`,
        ),
      );
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
        logError("Video Processing", error, { videoId, title });
        // Clean up temp file only on error
        fs.unlink(tempFilePath).catch(() => {});
      });

    json(200, {
      success: true,
      message: "Video uploaded successfully! Processing will begin shortly.",
      videoId,
      title,
    });
  } catch (error) {
    logError("Video Upload", error);
    const userMessage = formatSystemError(error);
    json(
      500,
      createErrorResponse(
        userMessage,
        "If this problem persists, contact the administrator.",
      ),
    );
  }
};
