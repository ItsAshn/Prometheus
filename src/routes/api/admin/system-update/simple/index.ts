import type { RequestHandler } from "@builder.io/qwik-city";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-jwt-key";

// Helper function to verify admin token
function verifyAdminToken(request: Request): boolean {
  try {
    const cookieHeader = request.headers.get("cookie");
    if (!cookieHeader) {
      return false;
    }

    const cookies = cookieHeader.split(";").reduce(
      (acc, cookie) => {
        const [key, value] = cookie.trim().split("=");
        acc[key] = value;
        return acc;
      },
      {} as Record<string, string>
    );

    const token = cookies["admin-auth-token"];
    if (!token) {
      return false;
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    return decoded && decoded.isAdmin;
  } catch {
    return false;
  }
}

// Helper function to restart Docker container
async function restartDockerContainer(): Promise<string> {
  try {
    // Use a simple approach - send SIGTERM to the current process after a delay
    // This will cause the container to restart if it's configured with restart: unless-stopped
    setTimeout(() => {
      process.kill(process.pid, "SIGTERM");
    }, 3000);

    return "Container restart initiated. The application will restart in a few seconds...";
  } catch (error: any) {
    throw new Error(`Failed to restart Docker container: ${error.message}`);
  }
}

// Helper function to get GitHub repository info
function getGitHubInfo() {
  const owner = process.env.GITHUB_OWNER || "ItsAshn";
  const repo = process.env.GITHUB_REPO || "Prometheus";
  return { owner, repo };
}

// Helper function to download latest update
async function downloadLatestUpdate(): Promise<string> {
  try {
    const { owner, repo } = getGitHubInfo();

    // First try to get the latest release
    let response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/releases/latest`
    );

    let version = "unknown";
    let downloadUrl = "";

    if (response.ok) {
      const release = await response.json();
      version = release.tag_name;
      downloadUrl = release.zipball_url;
    } else {
      // No releases - use latest commit from master
      response = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/commits/master`
      );

      if (response.ok) {
        const commit = await response.json();
        version = commit.sha.substring(0, 7);
        downloadUrl = `https://github.com/${owner}/${repo}/archive/refs/heads/master.zip`;
      } else {
        throw new Error(`GitHub API error: ${response.status}`);
      }
    }

    // Create a simple marker file to indicate update was triggered
    const fs = await import("fs");
    const path = await import("path");

    const tempDir = path.join(process.cwd(), "temp");
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const updateMarker = {
      version,
      downloadUrl,
      timestamp: new Date().toISOString(),
      status: "download_initiated",
    };

    fs.writeFileSync(
      path.join(tempDir, "update-status.json"),
      JSON.stringify(updateMarker, null, 2)
    );

    return `Update to version ${version} initiated successfully. Container will restart to apply changes.`;
  } catch (error: any) {
    throw new Error(`Failed to initiate update: ${error.message}`);
  }
}

// Simple GET-based update system to avoid JSON parsing issues
export const onGet: RequestHandler = async ({ json, request, url }) => {
  if (!verifyAdminToken(request)) {
    json(401, { message: "Unauthorized" });
    return;
  }

  try {
    const action = url.searchParams.get("action") || "status";

    if (action === "update") {
      // Download and prepare update
      const updateResult = await downloadLatestUpdate();

      // Restart container after a short delay
      const restartResult = await restartDockerContainer();

      json(200, {
        success: true,
        message: "Update initiated successfully!",
        details: [updateResult, restartResult].join("\n\n"),
        restarting: true,
      });
    } else if (action === "restart") {
      // Just restart without updating
      const restartResult = await restartDockerContainer();

      json(200, {
        success: true,
        message: "Restart initiated successfully!",
        details: restartResult,
        restarting: true,
      });
    } else {
      // Default: return status
      json(200, {
        success: true,
        message: "Simple update system ready",
        availableActions: [
          "?action=update - Download latest version and restart",
          "?action=restart - Restart container without updating",
          "?action=status - Show this status (default)",
        ],
        currentVersion: process.env.APP_VERSION || "v1.0.0",
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error: any) {
    console.error("Simple update system error:", error);
    json(500, {
      success: false,
      error: error.message || "Update system error",
    });
  }
};
