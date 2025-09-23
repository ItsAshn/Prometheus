import type { RequestHandler } from "@builder.io/qwik-city";
import { VideoProcessor } from "~/lib/video/video-processor";

export const onGet: RequestHandler = async ({ json }) => {
  try {
    const processingStatus = await VideoProcessor.getProcessingStatus();

    json(200, {
      success: true,
      processingVideos: processingStatus,
    });
  } catch (error) {
    console.error("Error getting processing status:", error);
    json(500, {
      success: false,
      message: "Failed to get processing status",
    });
  }
};
