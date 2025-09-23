import type { RequestHandler } from "@builder.io/qwik-city";
import { VideoProcessor } from "~/lib/video/video-processor";

export const onGet: RequestHandler = async ({ json }) => {
  try {
    const videos = await VideoProcessor.getVideoMetadata();

    json(200, {
      success: true,
      videos,
    });
  } catch (error) {
    console.error("Error fetching videos:", error);
    json(500, {
      success: false,
      message: "Failed to fetch videos",
    });
  }
};
