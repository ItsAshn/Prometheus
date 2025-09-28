import type { RequestHandler } from "@builder.io/qwik-city";
import { readFile } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

// Handle OPTIONS requests for CORS preflight
export const onOptions: RequestHandler = async ({ send }) => {
  send(
    new Response(null, {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
        "Access-Control-Allow-Headers":
          "Range, Content-Range, Authorization, Content-Type",
        "Access-Control-Expose-Headers":
          "Content-Length, Content-Range, Accept-Ranges",
        "Access-Control-Max-Age": "86400",
      },
    })
  );
};

export const onGet: RequestHandler = async ({ params, send, request }) => {
  const requestStart = Date.now();
  const path = params.path;
  const rangeHeader = request.headers.get("range");

  console.log(
    `[${new Date().toISOString()}] Video stream request: ${path}${rangeHeader ? ` (Range: ${rangeHeader})` : ""}`
  );

  if (!path) {
    console.log("Error: No path parameter provided");
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

    // Check if file exists and get size
    if (!existsSync(fullPath)) {
      console.error("File not found:", fullPath);
      send(
        new Response('{"error":"Video file not found"}', {
          status: 404,
          headers: { "Content-Type": "application/json" },
        })
      );
      return;
    }

    let fileContent: Buffer;
    try {
      const readStartTime = Date.now();
      fileContent = await readFile(fullPath);
      const readTime = Date.now() - readStartTime;
      const fileSizeMB =
        Math.round((fileContent.length / 1024 / 1024) * 100) / 100;
      console.log(`File read successfully: ${fileSizeMB}MB in ${readTime}ms`);

      // Check for unusually large files that might cause issues
      if (fileContent.length > 50 * 1024 * 1024) {
        // 50MB+
        console.warn(
          `Warning: Very large file detected (${fileSizeMB}MB), this may cause memory issues`
        );
      }
    } catch (readError) {
      console.error("Failed to read file:", fullPath, readError);
      send(
        new Response('{"error":"Failed to read video file"}', {
          status: 500,
          headers: { "Content-Type": "application/json" },
        })
      );
      return;
    }

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
    console.log("File extension detected:", path.split(".").pop());

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
            "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
            "Access-Control-Allow-Headers": "Range, Content-Type",
            "Access-Control-Expose-Headers": "Content-Length, Content-Range",
          },
        })
      );
    } else {
      // For .ts and .mp4 files, serve as binary with proper headers
      console.log("Serving media file, size:", fileContent.length, "bytes");

      const fileSize = fileContent.length;
      const fileSizeMB = Math.round((fileSize / 1024 / 1024) * 100) / 100;

      // Handle range requests for large files (improves streaming performance)
      if (rangeHeader && fileSize > 1024 * 1024) {
        // Only for files > 1MB
        const parts = rangeHeader.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

        if (start >= fileSize || end >= fileSize) {
          send(
            new Response('{"error":"Range not satisfiable"}', {
              status: 416,
              headers: {
                "Content-Type": "application/json",
                "Content-Range": `bytes */${fileSize}`,
              },
            })
          );
          return;
        }

        const chunkSize = end - start + 1;
        const chunk = fileContent.slice(start, end + 1);

        console.log(
          `Serving range ${start}-${end}/${fileSize} (${Math.round(chunkSize / 1024)}KB chunk)`
        );

        const headers: Record<string, string> = {
          "Content-Type": mimeType,
          "Content-Length": chunkSize.toString(),
          "Content-Range": `bytes ${start}-${end}/${fileSize}`,
          "Accept-Ranges": "bytes",
          "Cache-Control": "public, max-age=3600",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
          "Access-Control-Expose-Headers":
            "Content-Length, Content-Range, Accept-Ranges",
        };

        try {
          send(
            new Response(new Uint8Array(chunk), {
              status: 206, // Partial Content
              headers,
            })
          );
          const requestTime = Date.now() - requestStart;
          console.log(
            `Range response sent successfully: ${path} (${requestTime}ms)`
          );
        } catch (sendError) {
          console.error("Failed to send range response:", sendError);
          send(
            new Response('{"error":"Failed to send video chunk"}', {
              status: 500,
              headers: { "Content-Type": "application/json" },
            })
          );
        }
      } else {
        // Serve the entire file
        const headers: Record<string, string> = {
          "Content-Type": mimeType,
          "Content-Length": fileSize.toString(),
          "Cache-Control": "public, max-age=3600",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
          "Access-Control-Expose-Headers": "Content-Length, Accept-Ranges",
        };

        // Always add Accept-Ranges for video files to enable progressive loading
        if (path.endsWith(".ts") || path.endsWith(".mp4")) {
          headers["Accept-Ranges"] = "bytes";
        }

        if (fileSizeMB > 5) {
          console.log(
            `Large file detected: ${fileSizeMB}MB - enabling range support`
          );
        }

        try {
          send(
            new Response(new Uint8Array(fileContent), {
              status: 200,
              headers,
            })
          );
          const requestTime = Date.now() - requestStart;
          console.log(
            `Response sent successfully for: ${path} (${fileSizeMB}MB in ${requestTime}ms)`
          );
        } catch (sendError) {
          console.error("Failed to send response:", sendError);
          // Try to send a simpler error response
          try {
            send(
              new Response('{"error":"Failed to send video data"}', {
                status: 500,
                headers: { "Content-Type": "application/json" },
              })
            );
          } catch (fallbackError) {
            console.error(
              "Failed to send fallback error response:",
              fallbackError
            );
          }
        }
      }
    }
  } catch (error) {
    console.error("Unexpected error in video streaming:", error);
    try {
      send(
        new Response('{"error":"Internal server error"}', {
          status: 500,
          headers: { "Content-Type": "application/json" },
        })
      );
    } catch (errorResponseError) {
      console.error("Failed to send error response:", errorResponseError);
    }
  }
};
