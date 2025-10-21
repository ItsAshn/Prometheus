import type { RequestHandler } from "@builder.io/qwik-city";

/**
 * Version API endpoint
 * Returns current application version information
 */
export const onGet: RequestHandler = async ({ json }) => {
  try {
    const versionInfo = {
      version: process.env.APP_VERSION || "1.0.0",
      buildDate: process.env.BUILD_DATE || null,
      vcsRef: process.env.VCS_REF || null,
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      environment: process.env.NODE_ENV || "development",
      isDocker: process.env.DOCKER_CONTAINER === "true",
      hostname: process.env.HOSTNAME || null,
    };

    json(200, versionInfo);
  } catch (error) {
    console.error("Version check error:", error);
    json(500, {
      error: "Failed to retrieve version information",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
