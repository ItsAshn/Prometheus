import type { RequestHandler } from "@builder.io/qwik-city";

// Simple test endpoint to debug request body issues
export const onPost: RequestHandler = async ({ json, request }) => {
  try {
    console.log("=== Test Endpoint Debug ===");
    console.log("Method:", request.method);
    console.log("Headers:", Object.fromEntries(request.headers.entries()));

    // Try to read the body
    let bodyResult = "No body";
    let method = "none";

    try {
      const body = await request.json();
      bodyResult = JSON.stringify(body);
      method = "request.json()";
    } catch (error1) {
      try {
        const bodyText = await request.text();
        bodyResult = bodyText;
        method = "request.text()";
      } catch (error2) {
        bodyResult = `Both methods failed: ${error1 instanceof Error ? error1.message : String(error1)}, ${error2 instanceof Error ? error2.message : String(error2)}`;
        method = "failed";
      }
    }

    json(200, {
      success: true,
      method: method,
      body: bodyResult,
      headers: Object.fromEntries(request.headers.entries()),
    });
  } catch (error: any) {
    console.error("Test endpoint error:", error);
    json(500, {
      success: false,
      error: error.message,
    });
  }
};
