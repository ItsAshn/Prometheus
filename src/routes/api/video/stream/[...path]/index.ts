import type { RequestHandler } from "@builder.io/qwik-city";
import { readFile } from "fs/promises";
import { join } from "path";

export const onGet: RequestHandler = async ({ params, send }) => {
  const path = params.path;

  if (!path) {
    send(
      new Response('{"error":"Path parameter is required"}', {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    );
    return;
  }

  // Security: Only allow access to HLS files
  if (
    !path.includes("/hls/") ||
    (!path.endsWith(".m3u8") && !path.endsWith(".ts") && !path.endsWith(".mp4"))
  ) {
    send(
      new Response('{"error":"Access denied"}', {
        status: 403,
        headers: { "Content-Type": "application/json" },
      })
    );
    return;
  }

  try {
    // Build the full path to the video file
    // The path already includes "videos/hls/..." so just join with public
    console.log("Received path parameter:", path);

    // Remove any leading "videos/" if it exists to prevent duplication
    let cleanPath = path;
    if (path.startsWith("videos/")) {
      cleanPath = path;
    } else if (path.startsWith("/videos/")) {
      cleanPath = path.substring(1);
    }

    const fullPath = join(process.cwd(), "public", cleanPath);
    console.log("Full path constructed:", fullPath);
    const fileContent = await readFile(fullPath);

    // Set appropriate MIME type
    let mimeType: string;
    if (path.endsWith(".m3u8")) {
      mimeType = "application/vnd.apple.mpegurl";
    } else if (path.endsWith(".ts")) {
      mimeType = "video/mp2t";
    } else if (path.endsWith(".mp4")) {
      mimeType = "video/mp4";
    } else {
      mimeType = "application/octet-stream";
    }

    console.log("Serving file with MIME type:", mimeType);

    // For .m3u8 files, serve as text; for .ts and .mp4 files, serve as binary
    if (path.endsWith(".m3u8")) {
      // Read and modify the playlist to use absolute URLs
      let playlistContent = fileContent.toString("utf-8");

      // Extract the directory path from the current request
      const dirPath = path.substring(0, path.lastIndexOf("/"));

      // Replace relative segment URLs with absolute API URLs
      playlistContent = playlistContent.replace(
        /^(segment_\d+\.ts)$/gm,
        `/api/video/stream/${dirPath}/$1`
      );

      // Also handle fmp4 segments and init files
      playlistContent = playlistContent.replace(
        /^(init\.mp4)$/gm,
        `/api/video/stream/${dirPath}/$1`
      );
      
      playlistContent = playlistContent.replace(
        /^(segment_\d+\.mp4)$/gm,
        `/api/video/stream/${dirPath}/$1`
      );

      console.log(
        "Modified playlist content (first 300 chars):",
        playlistContent.substring(0, 300)
      );

      send(
        new Response(playlistContent, {
          status: 200,
          headers: {
            "Content-Type": mimeType,
            "Cache-Control": "no-cache",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET",
            "Access-Control-Allow-Headers": "Range",
          },
        })
      );
    } else {
      // For .ts and .mp4 files, serve as binary with proper headers
      console.log("Serving media file, size:", fileContent.length, "bytes");

      send(
        new Response(new Uint8Array(fileContent), {
          status: 200,
          headers: {
            "Content-Type": mimeType,
            "Content-Length": fileContent.length.toString(),
            "Accept-Ranges": "bytes",
            "Cache-Control": "public, max-age=3600",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET",
            "Access-Control-Allow-Headers": "Range, Content-Range",
            "Access-Control-Expose-Headers": "Content-Length, Content-Range",
          },
        })
      );
    }
  } catch (fileError) {
    console.error("File read error:", fileError);
    send(
      new Response('{"error":"Video file not found"}', {
        status: 404,
        headers: { "Content-Type": "application/json" },
      })
    );
  }
};
