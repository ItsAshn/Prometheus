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

    console.log(`Analyzing video segments for: ${videoId}`);

    const analysis = await VideoProcessor.analyzeVideoSegments(videoId);

    json(200, {
      success: true,
      videoId,
      analysis,
    });
  } catch (error) {
    console.error("Video analysis error:", error);
    json(500, {
      success: false,
      message: "Failed to analyze video segments",
    });
  }
};
