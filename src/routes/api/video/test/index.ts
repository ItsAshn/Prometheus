import type { RequestHandler } from "@builder.io/qwik-city";

export const onGet: RequestHandler = async ({ json }) => {
  try {
    // Test endpoint to check if our streaming API is working
    const testUrl =
      "/api/video/stream/videos/hls/video_1758643931133_xqkyhzdjt/playlist.m3u8";

    json(200, {
      success: true,
      message: "Video streaming test endpoint",
      testPlaylistUrl: testUrl,
      testSegmentUrl:
        "/api/video/stream/videos/hls/video_1758643931133_xqkyhzdjt/segment_000.ts",
      instructions:
        "Try accessing these URLs directly in your browser to test if they load correctly",
    });
  } catch (error) {
    console.error("Test endpoint error:", error);
    json(500, {
      success: false,
      message: "Test endpoint failed",
    });
  }
};
