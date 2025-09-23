import type { RequestHandler } from "@builder.io/qwik-city";
import { VideoProcessor } from "~/lib/video/video-processor";

export const onPost: RequestHandler = async ({ json, request }) => {
  try {
    const { videoId } = await request.json();

    if (!videoId) {
      json(400, {
        success: false,
        message: "Video ID is required",
      });
      return;
    }

    console.log(`Re-processing video ${videoId} with compatible settings...`);

    // Start re-processing in the background
    VideoProcessor.processVideoToHLS(
      `c:/Users/phoen/Documents/Prometheus/qwik-app/public/videos/${videoId}.mp4`,
      videoId,
      "Treasure Planet"
    ).catch(console.error);

    json(200, {
      success: true,
      message: "Re-processing started with compatible audio settings",
      videoId,
    });
  } catch (error) {
    console.error("Re-processing trigger error:", error);
    json(500, {
      success: false,
      message: "Failed to trigger re-processing",
    });
  }
};
