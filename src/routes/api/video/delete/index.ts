import type { RequestHandler } from "@builder.io/qwik-city";
import { VideoProcessor } from "~/lib/video/video-processor";
import { AdminAuthService, ADMIN_COOKIE_NAME } from "~/lib/auth";

export const onPost: RequestHandler = async ({ request, json, cookie }) => {
  try {
    // Verify admin authentication
    const authCookie = cookie.get(ADMIN_COOKIE_NAME);
    if (!authCookie?.value) {
      console.log("Video delete: No auth cookie found");
      json(401, { success: false, message: "Authentication required" });
      return;
    }

    const isValidToken = AdminAuthService.verifyToken(authCookie.value);
    if (!isValidToken) {
      console.log("Video delete: Invalid or expired token");
      json(401, { success: false, message: "Invalid or expired token" });
      return;
    }

    console.log("Video delete: Authentication successful");

    const { videoId } = await request.json();

    if (!videoId) {
      json(400, { success: false, message: "Video ID is required" });
      return;
    }

    const success = await VideoProcessor.deleteVideo(videoId);

    if (success) {
      json(200, {
        success: true,
        message: "Video deleted successfully",
      });
    } else {
      json(500, {
        success: false,
        message: "Failed to delete video",
      });
    }
  } catch (error) {
    console.error("Error deleting video:", error);
    json(500, {
      success: false,
      message: "Internal server error",
    });
  }
};
