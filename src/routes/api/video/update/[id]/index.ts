import type { RequestHandler } from "@builder.io/qwik-city";
import { VideoProcessor } from "~/lib/video/video-processor";
import path from "path";

interface UpdateVideoRequest {
  title?: string;
  description?: string;
}

export const onPut: RequestHandler = async ({ params, request, json }) => {
  try {
    const videoId = params.id;

    if (!videoId) {
      json(400, { error: "Video ID is required" });
      return;
    }

    const body: UpdateVideoRequest = await request.json();
    const { title, description } = body;

    if (!title || !title.trim()) {
      json(400, { error: "Title is required" });
      return;
    }

    if (title.length > 100) {
      json(400, { error: "Title must be 100 characters or less" });
      return;
    }

    if (description && description.length > 500) {
      json(400, { error: "Description must be 500 characters or less" });
      return;
    }

    // Get current video metadata
    const videos = await VideoProcessor.getVideoMetadata();
    const videoIndex = videos.findIndex((v: any) => v.id === videoId);

    if (videoIndex === -1) {
      json(404, { error: "Video not found" });
      return;
    }

    // Update the video in the array
    const currentVideo = videos[videoIndex];
    videos[videoIndex] = {
      ...currentVideo,
      title: title.trim(),
      description: description?.trim() || "",
      updatedAt: Date.now(),
    } as any;

    // Save updated metadata using writeVideoMetadata
    const metadataPath = path.join(
      process.cwd(),
      "public",
      "videos",
      "metadata.json",
    );
    const { atomicWriteJSON } = await import("~/lib/atomic-file-ops");
    await atomicWriteJSON(metadataPath, videos);

    json(200, {
      success: true,
      message: "Video metadata updated successfully",
      video: videos[videoIndex],
    });
  } catch (error) {
    console.error("Error updating video metadata:", error);
    json(500, {
      error: "Failed to update video metadata",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
