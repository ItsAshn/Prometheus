import type { RequestHandler } from "@builder.io/qwik-city";
import { promises as fs } from "fs";
import path from "path";
import { VideoProcessor } from "~/lib/video/video-processor";
import { AdminAuthService, ADMIN_COOKIE_NAME } from "~/lib/auth";

export const onOptions: RequestHandler = async ({ send, request }) => {
  // Handle CORS preflight requests
  const origin = request.headers.get("origin") || "*";
  send(
    new Response(null, {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, Cookie",
        "Access-Control-Allow-Credentials": "true",
        "Access-Control-Max-Age": "86400",
      },
    })
  );
};

export const onPost: RequestHandler = async ({ request, cookie, send }) => {
  try {
    // Get admin token from cookie
    const adminToken = cookie.get(ADMIN_COOKIE_NAME);

    if (!adminToken) {
      const errorData = {
        success: false,
        message: "Admin authentication required",
      };
      const errorBody = JSON.stringify(errorData);
      send(
        new Response(errorBody, {
          status: 401,
          headers: {
            "Content-Type": "application/json",
          },
        })
      );
      return;
    }

    // Verify admin authentication
    const tokenPayload = AdminAuthService.verifyToken(adminToken.value);

    if (!tokenPayload) {
      const errorData = {
        success: false,
        message: "Invalid or expired token",
      };
      const errorBody = JSON.stringify(errorData);
      send(
        new Response(errorBody, {
          status: 401,
          headers: {
            "Content-Type": "application/json",
          },
        })
      );
      return;
    }

    const { uploadId, fileName, totalChunks, title } = await request.json();

    if (!uploadId || !fileName || !totalChunks || !title) {
      const errorData = {
        success: false,
        message: "Missing required assembly data",
      };
      const errorBody = JSON.stringify(errorData);
      send(
        new Response(errorBody, {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        })
      );
      return;
    }

    // Check that all chunks exist
    const tempDir = path.join(process.cwd(), "temp", "uploads", uploadId);
    const chunks = [];

    console.log(
      `Assembly request: uploadId=${uploadId}, fileName=${fileName}, totalChunks=${totalChunks}, title=${title}`
    );
    console.log(`Working directory: ${process.cwd()}`);
    console.log(`Checking temp directory: ${tempDir}`);

    // Check if temp directory exists
    try {
      await fs.access(tempDir);
      console.log(`Temp directory exists: ${tempDir}`);
    } catch (error) {
      console.error(`Temp directory does not exist: ${tempDir}`, error);
      const errorData = {
        success: false,
        message: `Upload directory not found. Please retry the upload.`,
      };
      const errorBody = JSON.stringify(errorData);
      const origin = request.headers.get("origin") || "*";
      send(
        new Response(errorBody, {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            "Content-Length": errorBody.length.toString(),
            "Access-Control-Allow-Origin": origin,
            "Access-Control-Allow-Credentials": "true",
          },
        })
      );
      return;
    }

    for (let i = 0; i < totalChunks; i++) {
      const chunkPath = path.join(
        tempDir,
        `chunk_${i.toString().padStart(4, "0")}`
      );
      try {
        await fs.access(chunkPath);
        chunks.push(chunkPath);
        console.log(`Found chunk ${i + 1}/${totalChunks}: ${chunkPath}`);
      } catch (error) {
        console.error(
          `Missing chunk ${i + 1}/${totalChunks}: ${chunkPath}`,
          error
        );
        const errorData = {
          success: false,
          message: `Missing chunk ${i + 1}/${totalChunks}`,
        };
        const errorBody = JSON.stringify(errorData);
        const origin = request.headers.get("origin") || "*";
        send(
          new Response(errorBody, {
            status: 400,
            headers: {
              "Content-Type": "application/json",
              "Content-Length": errorBody.length.toString(),
              "Access-Control-Allow-Origin": origin,
              "Access-Control-Allow-Credentials": "true",
            },
          })
        );
        return;
      }
    }

    // Ensure temp directory exists for assembled file
    const tempPath = path.join(process.cwd(), "temp");
    try {
      await fs.mkdir(tempPath, { recursive: true });
      console.log(`Ensured temp directory exists: ${tempPath}`);
    } catch (error) {
      console.error(`Failed to create temp directory: ${tempPath}`, error);
      throw new Error(`Failed to create temp directory: ${error}`);
    }

    // Assemble the file
    const finalFilePath = path.join(
      tempPath,
      `assembled_${Date.now()}_${fileName}`
    );

    console.log(`Starting file assembly: ${finalFilePath}`);

    let writeStream;
    try {
      writeStream = await fs.open(finalFilePath, "w");
      console.log(`Opened write stream for: ${finalFilePath}`);
    } catch (error) {
      console.error(`Failed to open write stream: ${finalFilePath}`, error);
      throw new Error(`Failed to open write stream: ${error}`);
    }

    try {
      let totalBytesWritten = 0;
      for (let i = 0; i < chunks.length; i++) {
        const chunkPath = chunks[i];
        console.log(`Reading chunk ${i + 1}/${chunks.length}: ${chunkPath}`);

        try {
          const chunkData = await fs.readFile(chunkPath);
          await writeStream.write(chunkData);
          totalBytesWritten += chunkData.length;
          console.log(
            `Written chunk ${i + 1}/${chunks.length}, bytes: ${chunkData.length}, total: ${totalBytesWritten}`
          );
        } catch (error) {
          console.error(
            `Failed to read/write chunk ${i + 1}: ${chunkPath}`,
            error
          );
          throw new Error(`Failed to process chunk ${i + 1}: ${error}`);
        }
      }

      await writeStream.close();
      console.log(
        `File assembly completed: ${fileName} -> ${finalFilePath}, total bytes: ${totalBytesWritten}`
      );

      // Clean up chunks
      try {
        await fs.rm(tempDir, { recursive: true, force: true });
        console.log(`Cleaned up temp directory: ${tempDir}`);
      } catch (error) {
        console.warn(`Failed to clean up temp directory: ${tempDir}`, error);
        // Don't fail the assembly for cleanup errors
      }

      // Validate file type
      const allowedExtensions = ["mp4", "avi", "mov", "mkv", "webm"];
      const fileExtension = fileName.toLowerCase().split(".").pop();

      if (!allowedExtensions.includes(fileExtension || "")) {
        await fs.unlink(finalFilePath);
        const errorData = {
          success: false,
          message: "Invalid file type. Only video files are allowed.",
        };
        const errorBody = JSON.stringify(errorData);
        send(
          new Response(errorBody, {
            status: 400,
            headers: {
              "Content-Type": "application/json",
            },
          })
        );
        return;
      }

      // Generate unique video ID
      const videoId = `video_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      console.log(`Starting video processing for: ${title} (ID: ${videoId})`);

      // Process video to HLS (this runs in background)
      VideoProcessor.processVideoToHLS(finalFilePath, videoId, title)
        .then(() => {
          console.log(`Video processing completed for: ${title}`);
          // Note: VideoProcessor handles cleanup of the input file
        })
        .catch((error) => {
          console.error(`Video processing failed for: ${title}`, error);
          // Clean up assembled file only on error
          fs.unlink(finalFilePath).catch(console.error);
        });

      const successData = {
        success: true,
        message: "Video upload completed. Processing in background.",
        videoId,
        title,
      };

      const successBody = JSON.stringify(successData);

      send(
        new Response(successBody, {
          status: 200,
          headers: {
            "Content-Type": "application/json",

            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST",
            "Access-Control-Allow-Headers": "Content-Type",
          },
        })
      );
    } catch (error) {
      console.error("Error during file assembly:", error);
      if (writeStream) {
        try {
          await writeStream.close();
        } catch (closeError) {
          console.error("Error closing write stream:", closeError);
        }
      }
      try {
        await fs.unlink(finalFilePath);
        console.log(`Cleaned up failed assembly file: ${finalFilePath}`);
      } catch (unlinkError) {
        console.error("Error cleaning up failed assembly file:", unlinkError);
      }
      throw error;
    }
  } catch (error) {
    console.error("File assembly error:", {
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : "No stack trace",
      errorType: error instanceof Error ? error.constructor.name : typeof error,
      timestamp: new Date().toISOString(),
    });

    const errorData = {
      success: false,
      message: "Internal server error during file assembly",
      details:
        process.env.NODE_ENV === "development"
          ? error instanceof Error
            ? error.message
            : "Unknown error"
          : undefined,
    };

    const errorBody = JSON.stringify(errorData);
    const origin = request.headers.get("origin") || "*";

    send(
      new Response(errorBody, {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Content-Length": errorBody.length.toString(),
          "Access-Control-Allow-Origin": origin,
          "Access-Control-Allow-Methods": "POST",
          "Access-Control-Allow-Headers": "Content-Type",
          "Access-Control-Allow-Credentials": "true",
        },
      })
    );
  }
};
