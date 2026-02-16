import type { RequestHandler } from "@builder.io/qwik-city";
import { VideoProcessor } from "~/lib/video/video-processor";

interface VideoMetadata {
  id: string;
  title: string;
  description?: string;
  [key: string]: any;
}

export const onGet: RequestHandler = async ({ query, json }) => {
  try {
    const searchQuery = query.get("q")?.toLowerCase().trim() || "";

    if (!searchQuery) {
      json(200, { suggestions: [] });
      return;
    }

    // Get all videos
    const videos: VideoMetadata[] = await VideoProcessor.getVideoMetadata();

    // Filter and sort by relevance
    const suggestions = videos
      .filter(
        (video: VideoMetadata) =>
          video.title.toLowerCase().includes(searchQuery) ||
          (video.description &&
            video.description.toLowerCase().includes(searchQuery)),
      )
      .sort((a: VideoMetadata, b: VideoMetadata) => {
        // Prioritize title matches over description matches
        const aTitleMatch = a.title.toLowerCase().startsWith(searchQuery);
        const bTitleMatch = b.title.toLowerCase().startsWith(searchQuery);

        if (aTitleMatch && !bTitleMatch) return -1;
        if (!aTitleMatch && bTitleMatch) return 1;

        // Then sort by how early the match appears
        const aIndex = a.title.toLowerCase().indexOf(searchQuery);
        const bIndex = b.title.toLowerCase().indexOf(searchQuery);

        return aIndex - bIndex;
      })
      .slice(0, 5) // Limit to 5 suggestions
      .map((video: VideoMetadata) => ({
        id: video.id,
        title: video.title,
      }));

    json(200, { suggestions });
  } catch (error) {
    console.error("Error fetching search suggestions:", error);
    json(500, {
      error: "Failed to fetch search suggestions",
      suggestions: [],
    });
  }
};
