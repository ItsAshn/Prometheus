import type { RequestHandler } from "@builder.io/qwik-city";
import { AdminAuthService, ADMIN_COOKIE_NAME } from "~/lib/auth";

interface DockerHubTag {
  name: string;
  last_updated: string;
  digest: string;
}

interface DockerHubResponse {
  results: DockerHubTag[];
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

    // Get current version info
    const currentVersion = process.env.APP_VERSION || "1.0.0";
    const currentBuildDate = process.env.BUILD_DATE || null;
    const currentVcsRef = process.env.VCS_REF || null;
    const isDocker = process.env.DOCKER_CONTAINER === "true";
    const imageName = process.env.IMAGE_NAME || "itsashn/prometheus";

    // If not running in Docker, updates are not applicable
    if (!isDocker) {
      json(200, {
        updateAvailable: false,
        message:
          "Not running in Docker container. Updates only available for Docker deployments.",
        current: {
          version: currentVersion,
          buildDate: currentBuildDate,
          vcsRef: currentVcsRef,
        },
      });
      return;
    }

    // Fetch latest version from Docker Hub
    try {
      const dockerHubUrl = `https://hub.docker.com/v2/repositories/${imageName}/tags?page_size=10&ordering=last_updated`;

      const response = await fetch(dockerHubUrl, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Docker Hub API returned ${response.status}`);
      }

      const data = (await response.json()) as DockerHubResponse;

      // Find the 'latest' tag
      const latestTag = data.results.find((tag) => tag.name === "latest");

      if (!latestTag) {
        json(200, {
          updateAvailable: false,
          message: "Could not determine latest version",
          current: {
            version: currentVersion,
            buildDate: currentBuildDate,
            vcsRef: currentVcsRef,
          },
        });
        return;
      }

      // Compare build dates to determine if update is available
      const updateAvailable = currentBuildDate
        ? new Date(latestTag.last_updated) > new Date(currentBuildDate)
        : false;

      json(200, {
        updateAvailable,
        current: {
          version: currentVersion,
          buildDate: currentBuildDate,
          vcsRef: currentVcsRef,
        },
        latest: {
          tag: latestTag.name,
          lastUpdated: latestTag.last_updated,
          digest: latestTag.digest,
        },
        imageName,
        instructions: updateAvailable
          ? "To update, run: docker-compose pull && docker-compose up -d"
          : null,
      });
    } catch (fetchError) {
      console.error("Failed to fetch Docker Hub data:", fetchError);
      json(500, {
        error: "Failed to check for updates",
        message:
          fetchError instanceof Error ? fetchError.message : "Unknown error",
        current: {
          version: currentVersion,
          buildDate: currentBuildDate,
          vcsRef: currentVcsRef,
        },
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
