import type { RequestHandler } from "@builder.io/qwik-city";
import { VideoProcessor } from "~/lib/video/video-processor";
import { AdminAuthService, ADMIN_COOKIE_NAME } from "~/lib/auth";

export const onGet: RequestHandler = async ({ cookie, json }) => {
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

    // Check FFmpeg status
    const ffmpegStatus = await VideoProcessor.checkFFmpegStatus();

    json(200, {
      success: true,
      ffmpeg: ffmpegStatus,
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        cwd: process.cwd(),
      },
      pnpmPaths: {
        nodeModules: [
          "./node_modules/.pnpm/ffmpeg-static@5.2.0/node_modules/ffmpeg-static/ffmpeg",
          "./node_modules/ffmpeg-static/ffmpeg",
          "/app/node_modules/.pnpm/ffmpeg-static@5.2.0/node_modules/ffmpeg-static/ffmpeg",
          "/app/node_modules/ffmpeg-static/ffmpeg",
        ],
      },
    });
  } catch (error) {
    console.error("FFmpeg status check error:", error);
    json(500, {
      success: false,
      message: "Failed to check FFmpeg status",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
