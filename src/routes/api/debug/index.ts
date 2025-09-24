import type { RequestHandler } from "@builder.io/qwik-city";

export const onGet: RequestHandler = async ({ request, cookie, json }) => {
  const diagnostics = {
    timestamp: new Date().toISOString(),
    nodeEnv: process.env.NODE_ENV,
    method: request.method,
    url: request.url,
    headers: Object.fromEntries(request.headers.entries()),
    cookies: cookie.getAll(),
    environment: {
      adminUsername: process.env.ADMIN_USERNAME ? "SET" : "NOT_SET",
      adminPassword: process.env.ADMIN_PASSWORD ? "SET" : "NOT_SET",
      jwtSecret: process.env.JWT_SECRET ? "SET" : "NOT_SET",
    },
  };

  json(200, diagnostics);
};

export const onPost: RequestHandler = async ({ request, cookie, json }) => {
  try {
    // Test multipart form parsing
    const formData = await request.formData();
    const testFile = formData.get("testFile") as File;

    const result = {
      timestamp: new Date().toISOString(),
      success: true,
      message: "POST endpoint working",
      formDataReceived: !!testFile,
      fileSize: testFile?.size || 0,
      fileName: testFile?.name || "none",
      cookies: cookie.getAll(),
    };

    json(200, result);
  } catch (error) {
    json(500, {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
    });
  }
};
