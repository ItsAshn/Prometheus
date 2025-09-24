import type { RequestHandler } from "@builder.io/qwik-city";
import { promises as fs } from "fs";
import path from "path";
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
    // Debug request information
    console.log("Upload chunk request:", {
      method: request.method,
      url: request.url,
      headers: Object.fromEntries(request.headers.entries()),
      userAgent: request.headers.get("user-agent"),
      contentType: request.headers.get("content-type"),
      origin: request.headers.get("origin"),
    });

    // Get admin token from cookie
    const adminToken = cookie.get(ADMIN_COOKIE_NAME);
    console.log("Chunk upload - Cookie check:", {
      cookieName: ADMIN_COOKIE_NAME,
      hasToken: !!adminToken,
      tokenPreview: adminToken
        ? adminToken.value.substring(0, 20) + "..."
        : "none",
      allCookies: Object.keys(cookie.getAll()),
    });

    if (!adminToken) {
      const errorData = {
        success: false,
        message: "Admin authentication required",
      };
      const errorBody = JSON.stringify(errorData);
      const origin = request.headers.get("origin") || "*";
      send(
        new Response(errorBody, {
          status: 401,
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

    // Verify admin authentication
    const tokenPayload = AdminAuthService.verifyToken(adminToken.value);
    console.log("Chunk upload - Token verification:", {
      isValid: !!tokenPayload,
      payload: tokenPayload
        ? { username: tokenPayload.username, isAdmin: tokenPayload.isAdmin }
        : null,
    });

    if (!tokenPayload) {
      const errorData = {
        success: false,
        message: "Invalid or expired token",
      };
      const errorBody = JSON.stringify(errorData);
      const origin = request.headers.get("origin") || "*";
      send(
        new Response(errorBody, {
          status: 401,
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

    // Parse the chunk data
    const formData = await request.formData();
    const chunk = formData.get("chunk") as File;
    const chunkIndex = parseInt(formData.get("chunkIndex") as string);
    const totalChunks = parseInt(formData.get("totalChunks") as string);
    const fileName = formData.get("fileName") as string;
    const uploadId = formData.get("uploadId") as string;

    if (
      !chunk ||
      isNaN(chunkIndex) ||
      isNaN(totalChunks) ||
      !fileName ||
      !uploadId
    ) {
      const errorData = {
        success: false,
        message: "Missing required chunk data",
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

    // Create temp directory for this upload
    const tempDir = path.join(process.cwd(), "temp", "uploads", uploadId);

    try {
      await fs.mkdir(tempDir, { recursive: true });
      console.log(`Created/ensured temp directory: ${tempDir}`);
    } catch (error) {
      console.error(`Failed to create temp directory: ${tempDir}`, error);
      throw new Error(`Failed to create temp directory: ${error}`);
    }

    // Save the chunk
    const chunkPath = path.join(
      tempDir,
      `chunk_${chunkIndex.toString().padStart(4, "0")}`
    );

    try {
      const arrayBuffer = await chunk.arrayBuffer();
      const chunkData = new Uint8Array(arrayBuffer);
      await fs.writeFile(chunkPath, chunkData);

      console.log(
        `Chunk ${chunkIndex + 1}/${totalChunks} uploaded for ${fileName}: ${chunkData.length} bytes -> ${chunkPath}`
      );
    } catch (error) {
      console.error(
        `Failed to save chunk ${chunkIndex + 1}/${totalChunks}:`,
        error
      );
      throw new Error(`Failed to save chunk: ${error}`);
    }

    // Check if all chunks are uploaded
    const uploadedChunks = [];
    for (let i = 0; i < totalChunks; i++) {
      const chunkFile = path.join(
        tempDir,
        `chunk_${i.toString().padStart(4, "0")}`
      );
      try {
        await fs.access(chunkFile);
        uploadedChunks.push(i);
      } catch {
        // Chunk doesn't exist yet
      }
    }

    // Create response with proper headers to avoid Content-Length mismatch
    const responseData = {
      success: true,
      message: `Chunk ${chunkIndex + 1}/${totalChunks} uploaded`,
      uploadedChunks: uploadedChunks.length,
      totalChunks,
      isComplete: uploadedChunks.length === totalChunks,
    };

    const responseBody = JSON.stringify(responseData);

    const origin = request.headers.get("origin") || "*";
    send(
      new Response(responseBody, {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Content-Length": responseBody.length.toString(),
          "Access-Control-Allow-Origin": origin,
          "Access-Control-Allow-Methods": "POST",
          "Access-Control-Allow-Headers": "Content-Type, Cookie",
          "Access-Control-Allow-Credentials": "true",
        },
      })
    );
  } catch (error) {
    console.error("Chunk upload error:", {
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : "No stack trace",
      errorType: error instanceof Error ? error.constructor.name : typeof error,
      timestamp: new Date().toISOString(),
      workingDirectory: process.cwd(),
    });

    const errorData = {
      success: false,
      message: "Internal server error during chunk upload",
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
          "Access-Control-Allow-Headers": "Content-Type, Cookie",
          "Access-Control-Allow-Credentials": "true",
        },
      })
    );
  }
};
