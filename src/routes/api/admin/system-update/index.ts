import type { RequestHandler } from "@builder.io/qwik-city";
import { AdminAuthService, ADMIN_COOKIE_NAME } from "~/lib/auth";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

interface DockerHubTag {
  name: string;
  last_updated: string;
  digest: string;
  images?: Array<{
    architecture: string;
    os: string;
    digest: string;
  }>;
}

interface DockerHubResponse {
  results: DockerHubTag[];
}

interface ImageInspectData {
  version?: string;
  buildDate?: string;
  vcsRef?: string;
  digest?: string;
  created?: string;
}

/**
 * Get version info from Docker image labels by inspecting the running container
 */
async function getImageMetadata(): Promise<ImageInspectData> {
  try {
    const hostname = process.env.HOSTNAME;
    if (!hostname) {
      throw new Error("HOSTNAME not found - not running in Docker?");
    }

    // Try to inspect the image using docker command
    const { stdout } = await execAsync(
      `docker inspect ${hostname} --format='{{json .Config.Labels}}'`
    );

    const labels = JSON.parse(stdout.trim());

    return {
      version:
        labels["org.opencontainers.image.version"] ||
        process.env.APP_VERSION ||
        "1.0.0",
      buildDate:
        labels["org.opencontainers.image.created"] ||
        process.env.BUILD_DATE ||
        null,
      vcsRef:
        labels["org.opencontainers.image.revision"] ||
        process.env.VCS_REF ||
        null,
      created: labels["org.opencontainers.image.created"] || null,
    };
  } catch (error) {
    // Fallback to environment variables if docker inspect fails
    console.warn(
      "Could not inspect Docker image, using environment variables:",
      error
    );
    return {
      version: process.env.APP_VERSION || "1.0.0",
      buildDate: process.env.BUILD_DATE || undefined,
      vcsRef: process.env.VCS_REF || undefined,
    };
  }
}

/**
 * Get the current image digest from the running container
 */
async function getCurrentImageDigest(): Promise<string | null> {
  try {
    const hostname = process.env.HOSTNAME;
    if (!hostname) {
      return null;
    }

    const { stdout } = await execAsync(
      `docker inspect ${hostname} --format='{{.Image}}'`
    );

    return stdout.trim();
  } catch (error) {
    console.warn("Could not get current image digest:", error);
    return null;
  }
}

/**
 * System Update API endpoint
 * Checks for available updates from Docker Hub
 */
export const onGet: RequestHandler = async ({ json, cookie }) => {
  try {
    // Verify admin authentication
    const adminToken = cookie.get(ADMIN_COOKIE_NAME);
    if (!adminToken?.value) {
      json(401, {
        error: "Unauthorized",
        message: "Authentication required",
      });
      return;
    }

    const tokenPayload = AdminAuthService.verifyToken(adminToken.value);
    if (!tokenPayload || !tokenPayload.isAdmin) {
      json(401, {
        error: "Unauthorized",
        message: "Invalid or expired admin token",
      });
      return;
    }

    const isDocker = process.env.DOCKER_CONTAINER === "true";
    const imageName = process.env.IMAGE_NAME || "itsashn/prometheus";

    // If not running in Docker, updates are not applicable
    if (!isDocker) {
      json(200, {
        updateAvailable: false,
        message:
          "Not running in Docker container. Updates only available for Docker deployments.",
        current: {
          version: "1.0.0",
          buildDate: null,
          vcsRef: null,
        },
        imageName,
      });
      return;
    }

    // Get current version info from image metadata
    const imageMetadata = await getImageMetadata();
    const currentDigest = await getCurrentImageDigest();

    console.log("Current image metadata:", imageMetadata);
    console.log("Current image digest:", currentDigest);

    // Fetch latest version from Docker Hub
    try {
      const dockerHubUrl = `https://hub.docker.com/v2/repositories/${imageName}/tags?page_size=20&ordering=-last_updated`;

      console.log("Fetching from Docker Hub:", dockerHubUrl);

      const response = await fetch(dockerHubUrl, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(
          `Docker Hub API returned ${response.status}: ${response.statusText}`
        );
      }

      const data = (await response.json()) as DockerHubResponse;

      console.log("Docker Hub response:", JSON.stringify(data, null, 2));

      // Find the 'latest' tag
      const latestTag = data.results?.find((tag) => tag.name === "latest");

      if (!latestTag) {
        json(200, {
          updateAvailable: false,
          message:
            "Could not find 'latest' tag on Docker Hub. Please ensure the image exists.",
          current: {
            version: imageMetadata.version,
            buildDate: imageMetadata.buildDate,
            vcsRef: imageMetadata.vcsRef,
          },
          imageName,
        });
        return;
      }

      // Determine if update is available
      // Method 1: Compare digests (most reliable)
      let updateAvailable = false;
      let comparisonMethod = "none";

      if (currentDigest && latestTag.digest) {
        // Extract just the hash part if it's a full digest
        const currentHash = currentDigest.includes(":")
          ? currentDigest.split(":")[1]
          : currentDigest;
        const latestHash = latestTag.digest.includes(":")
          ? latestTag.digest.split(":")[1]
          : latestTag.digest;

        updateAvailable = currentHash !== latestHash;
        comparisonMethod = "digest";
        console.log(
          `Digest comparison: ${currentHash} vs ${latestHash} = ${updateAvailable}`
        );
      }
      // Method 2: Compare dates
      else if (imageMetadata.buildDate || imageMetadata.created) {
        const currentDate = imageMetadata.buildDate || imageMetadata.created;
        if (currentDate) {
          try {
            const current = new Date(currentDate);
            const latest = new Date(latestTag.last_updated);
            updateAvailable = latest > current;
            comparisonMethod = "date";
            console.log(
              `Date comparison: ${current.toISOString()} vs ${latest.toISOString()} = ${updateAvailable}`
            );
          } catch (e) {
            console.error("Date comparison failed:", e);
          }
        }
      }

      // If we couldn't determine update status, assume update is available
      if (comparisonMethod === "none") {
        updateAvailable = true;
        comparisonMethod = "unknown";
        console.log(
          "Could not determine update status, assuming update available"
        );
      }

      json(200, {
        updateAvailable,
        current: {
          version: imageMetadata.version,
          buildDate: imageMetadata.buildDate,
          vcsRef: imageMetadata.vcsRef,
          digest: currentDigest,
        },
        latest: {
          tag: latestTag.name,
          lastUpdated: latestTag.last_updated,
          digest: latestTag.digest,
        },
        imageName,
        comparisonMethod,
        instructions: updateAvailable
          ? "To update, run: docker-compose pull && docker-compose up -d"
          : null,
        message: updateAvailable
          ? `A new version is available on Docker Hub (updated ${new Date(latestTag.last_updated).toLocaleDateString()})`
          : "You are running the latest version",
      });
    } catch (fetchError) {
      console.error("Failed to fetch Docker Hub data:", fetchError);
      json(500, {
        error: "Failed to check for updates",
        message:
          fetchError instanceof Error ? fetchError.message : "Unknown error",
        current: {
          version: imageMetadata.version,
          buildDate: imageMetadata.buildDate,
          vcsRef: imageMetadata.vcsRef,
        },
        imageName,
      });
    }
  } catch (error) {
    console.error("System update check error:", error);
    json(500, {
      error: "Failed to check for system updates",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * Trigger system update (POST)
 * This endpoint provides instructions for updating but doesn't perform the update
 * as that requires Docker operations outside the container
 */
export const onPost: RequestHandler = async ({ json, cookie }) => {
  try {
    // Verify admin authentication
    const adminToken = cookie.get(ADMIN_COOKIE_NAME);
    if (!adminToken?.value) {
      json(401, {
        error: "Unauthorized",
        message: "Authentication required",
      });
      return;
    }

    const tokenPayload = AdminAuthService.verifyToken(adminToken.value);
    if (!tokenPayload || !tokenPayload.isAdmin) {
      json(401, {
        error: "Unauthorized",
        message: "Invalid or expired admin token",
      });
      return;
    }

    const isDocker = process.env.DOCKER_CONTAINER === "true";
    const imageName = process.env.IMAGE_NAME || "itsashn/prometheus";

    if (!isDocker) {
      json(400, {
        error: "Not applicable",
        message: "Updates only available for Docker deployments",
      });
      return;
    }

    // Provide update instructions
    json(200, {
      message: "Update instructions",
      steps: [
        {
          step: 1,
          description: "Pull the latest image",
          command: "docker-compose pull",
        },
        {
          step: 2,
          description: "Restart the container with the new image",
          command: "docker-compose up -d",
        },
        {
          step: 3,
          description: "Check the logs",
          command: "docker-compose logs -f prometheus",
        },
      ],
      imageName,
      note: "These commands should be run on the Docker host machine, not inside the container.",
      automaticUpdate: false,
      scriptAvailable: true,
      scriptPath: "./scripts/update-docker.sh or ./scripts/update-docker.ps1",
    });
  } catch (error) {
    console.error("System update trigger error:", error);
    json(500, {
      error: "Failed to initiate system update",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
