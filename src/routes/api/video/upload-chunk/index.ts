import type { RequestHandler } from "@builder.io/qwik-city";
import { promises as fs } from "fs";
import path from "path";
import { AdminAuthService, ADMIN_COOKIE_NAME } from "~/lib/auth";

export const onOptions: RequestHandler = async ({ send }) => {
  // Handle CORS preflight requests
  send(
    new Response(null, {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Max-Age": "86400",
      },
    })
  );
};

export const onPost: RequestHandler = async ({ request, cookie, send }) => {
  try {
    // Get admin token from cookie
    const adminToken = cookie.get(ADMIN_COOKIE_NAME);
    console.log("Chunk upload - Cookie check:", {
      cookieName: ADMIN_COOKIE_NAME,
      hasToken: !!adminToken,
      tokenPreview: adminToken
        ? adminToken.value.substring(0, 20) + "..."
        : "none",
    });

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

    // Create temp directory for this upload
    const tempDir = path.join(process.cwd(), "temp", "uploads", uploadId);
    await fs.mkdir(tempDir, { recursive: true });

    // Save the chunk
    const chunkPath = path.join(
      tempDir,
      `chunk_${chunkIndex.toString().padStart(4, "0")}`
    );
    const arrayBuffer = await chunk.arrayBuffer();
    await fs.writeFile(chunkPath, new Uint8Array(arrayBuffer));

    console.log(
      `Chunk ${chunkIndex + 1}/${totalChunks} uploaded for ${fileName}`
    );

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

    send(
      new Response(responseBody, {
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
    console.error("Chunk upload error:", error);

    const errorData = {
      success: false,
      message: "Internal server error during chunk upload",
    };

    const errorBody = JSON.stringify(errorData);

    send(
      new Response(errorBody, {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      })
    );
  }
};
