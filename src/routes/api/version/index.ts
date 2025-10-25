import type { RequestHandler } from "@builder.io/qwik-city";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

/**
 * Get version info from Docker image labels by inspecting the running container
 */
async function getImageMetadata() {
  try {
    const hostname = process.env.HOSTNAME;
    if (!hostname) {
      return null;
    }

    // Try to inspect the image using docker command
    const { stdout } = await execAsync(
      `docker inspect ${hostname} --format='{{json .Config.Labels}}'`
    );

    const labels = JSON.parse(stdout.trim());

    return {
      version: labels["org.opencontainers.image.version"],
      buildDate: labels["org.opencontainers.image.created"],
      vcsRef: labels["org.opencontainers.image.revision"],
      source: labels["org.opencontainers.image.source"],
      title: labels["org.opencontainers.image.title"],
    };
  } catch (error) {
    console.warn("Could not inspect Docker image:", error);
    return null;
  }
}

/**
 * Version API endpoint
 * Returns current application version information
 */
export const onGet: RequestHandler = async ({ json }) => {
  try {
    const isDocker = process.env.DOCKER_CONTAINER === "true";
    let imageMetadata = null;

    if (isDocker) {
      imageMetadata = await getImageMetadata();
    }

    const versionInfo = {
      version: imageMetadata?.version || process.env.APP_VERSION || "1.0.0",
      buildDate: imageMetadata?.buildDate || process.env.BUILD_DATE || null,
      vcsRef: imageMetadata?.vcsRef || process.env.VCS_REF || null,
      source: imageMetadata?.source || "https://github.com/ItsAshn/Prometheus",
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      environment: process.env.NODE_ENV || "development",
      isDocker,
      hostname: process.env.HOSTNAME || null,
      imageName: process.env.IMAGE_NAME || null,
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
