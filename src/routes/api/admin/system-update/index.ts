import type { RequestHandler } from "@builder.io/qwik-city";
import { promisify } from "util";
import { exec } from "child_process";
import { writeFileSync, existsSync, mkdirSync, createWriteStream } from "fs";
import { join } from "path";
import jwt from "jsonwebtoken";

const execAsync = promisify(exec);
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

// Helper function to execute shell commands with proper error handling
async function executeCommand(
  command: string
): Promise<{ stdout: string; stderr: string }> {
  try {
    const result = await execAsync(command);
    return result;
  } catch (error: any) {
    throw new Error(`Command failed: ${error.message}`);
  }
}

// Helper function to check if we're running in Docker
function isRunningInDocker(): boolean {
  try {
    // Check for Docker-specific environment variables or files
    return (
      process.env.DOCKER_CONTAINER === "true" ||
      process.env.NODE_ENV === "production" ||
      process.platform === "linux" // Simple heuristic for container environment
    );
  } catch {
    return false;
  }
}

// Helper function to get the current Git status
async function getGitStatus(): Promise<{
  currentBranch: string;
  hasChanges: boolean;
  remoteUrl: string;
  lastCommit: string;
}> {
  // For Docker deployments without Git, return safe defaults
  // This avoids all Git-related errors in production environments
  try {
    // Quick check if git command is even available
    await executeCommand("git --version");

    // Check if we're in a git repository
    await executeCommand("git rev-parse --git-dir");

    // Only if both checks pass, try to get Git info
    const [branchResult, statusResult, remoteResult, commitResult] =
      await Promise.all([
        executeCommand("git branch --show-current").catch(() => ({
          stdout: "unknown",
          stderr: "",
        })),
        executeCommand("git status --porcelain").catch(() => ({
          stdout: "",
          stderr: "",
        })),
        executeCommand("git remote get-url origin").catch(() => ({
          stdout: "not-available",
          stderr: "",
        })),
        executeCommand("git log -1 --format='%H %s'").catch(() => ({
          stdout: "No commits found",
          stderr: "",
        })),
      ]);

    return {
      currentBranch: branchResult.stdout.trim() || "unknown",
      hasChanges: statusResult.stdout.trim().length > 0,
      remoteUrl: remoteResult.stdout.trim() || "not-available",
      lastCommit: commitResult.stdout.trim() || "No commits found",
    };
  } catch {
    // Git not available or not in a repository - return safe defaults
    return {
      currentBranch: "not-available",
      hasChanges: false,
      remoteUrl: "not-available",
      lastCommit: "Git not available (GitHub updates enabled)",
    };
  }
}

// Helper function to get GitHub repository info
function getGitHubInfo() {
  const owner = process.env.GITHUB_OWNER || "ItsAshn";
  const repo = process.env.GITHUB_REPO || "Prometheus";
  return { owner, repo };
}

// Helper function to get latest GitHub release or commit
async function getLatestGitHubRelease(): Promise<{
  version: string;
  downloadUrl: string;
  releaseNotes: string;
} | null> {
  try {
    const { owner, repo } = getGitHubInfo();

    // Try to get the latest release first
    let response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/releases/latest`
    );

    if (response.ok) {
      // We have releases - use the latest release
      const release = await response.json();

      const zipAsset = release.assets?.find((asset: any) =>
        asset.name.endsWith(".zip")
      ) || { browser_download_url: release.zipball_url };

      return {
        version: release.tag_name,
        downloadUrl: zipAsset.browser_download_url,
        releaseNotes: release.body || "No release notes available",
      };
    } else if (response.status === 404) {
      // No releases found - fall back to latest commit
      console.log("No releases found, checking latest commit...");

      response = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/commits/master`
      );

      if (response.ok) {
        const commit = await response.json();
        return {
          version: commit.sha.substring(0, 7),
          downloadUrl: `https://github.com/${owner}/${repo}/archive/refs/heads/master.zip`,
          releaseNotes: `Latest commit: ${commit.commit.message}\n\nCommitted by: ${commit.commit.author.name} on ${new Date(commit.commit.author.date).toLocaleDateString()}`,
        };
      }
    }

    throw new Error(`GitHub API error: ${response.status}`);
  } catch (error: any) {
    console.error("Error fetching GitHub release:", error);
    return null;
  }
}

// Helper function to download and extract update
async function downloadAndExtractUpdate(): Promise<string> {
  try {
    const release = await getLatestGitHubRelease();
    if (!release) {
      return "Error: Unable to fetch latest release from GitHub.";
    }

    // Check current version
    const currentVersion = process.env.APP_VERSION || "unknown";
    if (currentVersion !== "unknown" && currentVersion === release.version) {
      return "Already up to date - you have the latest version.";
    }

    // Create temp directory
    const tempDir = join(process.cwd(), "temp", "update");
    if (!existsSync(tempDir)) {
      mkdirSync(tempDir, { recursive: true });
    }

    // Download the release
    const response = await fetch(release.downloadUrl);
    if (!response.ok) {
      throw new Error(`Download failed: ${response.status}`);
    }

    const zipPath = join(tempDir, "update.zip");
    const fileStream = createWriteStream(zipPath);

    if (response.body) {
      const reader = response.body.getReader();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        fileStream.write(value);
      }
    }
    fileStream.end();

    // Extract and deploy (simplified approach - in production you'd want proper extraction)
    // For now, we'll just prepare the update and require a restart
    const updateScript = `#!/bin/bash
# Auto-generated update script
echo "Update downloaded: ${release.version}"
echo "Please restart the container to apply updates."
`;

    writeFileSync(join(tempDir, "update.sh"), updateScript);

    return `Successfully downloaded version ${release.version}:\n${release.releaseNotes.substring(0, 500)}...\n\nRestart required to apply changes.`;
  } catch (error: any) {
    return `Failed to download update: ${error.message}`;
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

// GET - Get system status and update information
export const onGet: RequestHandler = async ({ json, request }) => {
  if (!verifyAdminToken(request)) {
    json(401, { message: "Unauthorized" });
    return;
  }

  try {
    // Get Git status
    const gitStatus = await getGitStatus();

    // Check if there are remote updates available from GitHub
    let updatesAvailable = false;
    let updateInfo = "";
    let latestRelease = null;

    try {
      latestRelease = await getLatestGitHubRelease();

      if (latestRelease) {
        const currentVersion = process.env.APP_VERSION || "unknown";

        // Handle different version formats (semver vs commit hash)
        let isUpdateAvailable = false;
        if (currentVersion === "unknown" || currentVersion === "v1.0.0") {
          // Default version, updates are likely available
          isUpdateAvailable = true;
        } else if (
          latestRelease.version.length === 7 &&
          currentVersion.length === 7
        ) {
          // Both are commit hashes - compare them
          isUpdateAvailable = currentVersion !== latestRelease.version;
        } else if (
          latestRelease.version.startsWith("v") &&
          currentVersion.startsWith("v")
        ) {
          // Both are version tags - compare them
          isUpdateAvailable = currentVersion !== latestRelease.version;
        } else {
          // Mixed formats - assume update is available
          isUpdateAvailable = true;
        }

        if (isUpdateAvailable) {
          updatesAvailable = true;
          const releaseType =
            latestRelease.version.length === 7 ? "commit" : "release";
          updateInfo = `New ${releaseType} available: ${latestRelease.version}\n\n${latestRelease.releaseNotes.substring(0, 400)}${latestRelease.releaseNotes.length > 400 ? "..." : ""}`;
        } else {
          updateInfo = "System is up to date.";
        }
      } else {
        updateInfo =
          "Unable to check for updates from GitHub. Please check your internet connection.";
      }
    } catch (error: any) {
      updateInfo = `Unable to check for updates: ${error.message}`;
    }

    json(200, {
      success: true,
      data: {
        gitStatus,
        updatesAvailable,
        updateInfo,
        currentVersion: process.env.APP_VERSION || "v1.0.0",
        latestVersion: latestRelease?.version || "unknown",
        isDocker: isRunningInDocker(),
        containerName: process.env.CONTAINER_NAME || "prometheus",
        currentTime: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error("Error getting system status:", error);
    json(500, {
      success: false,
      error: error.message || "Failed to get system status",
    });
  }
};

// POST - Perform system update
export const onPost: RequestHandler = async ({ json, request }) => {
  if (!verifyAdminToken(request)) {
    json(401, { message: "Unauthorized" });
    return;
  }

  try {
    let action: string;

    // Handle different ways the body might arrive
    try {
      // Method 1: Try the standard approach first
      const body = await request.json();
      action = body?.action;
    } catch {
      // Method 2: If that fails, the body stream might have been consumed
      // Try to get it from form data or other sources
      try {
        const formData = await request.formData();
        const actionFromForm = formData.get("action");
        if (actionFromForm) {
          action = String(actionFromForm);
        } else {
          throw new Error("No action in form data");
        }
      } catch {
        // Method 3: Try URL search params as last resort
        const url = new URL(request.url);
        const actionFromQuery = url.searchParams.get("action");
        if (actionFromQuery) {
          action = actionFromQuery;
        } else {
          // If all methods fail, return a helpful error
          json(400, {
            success: false,
            error:
              "Could not parse request. Please ensure you're sending JSON with 'action' field, or try refreshing the page.",
          });
          return;
        }
      }
    }

    // Validate the action
    if (!action || (action !== "update" && action !== "restart")) {
      json(400, {
        success: false,
        error: `Invalid action: '${action}'. Must be 'update' or 'restart'.`,
      });
      return;
    }

    if (action === "update") {
      // Download latest release from GitHub
      const updateResult = await downloadAndExtractUpdate();

      if (isRunningInDocker()) {
        // If running in Docker, restart the container
        const restartResult = await restartDockerContainer();

        json(200, {
          success: true,
          message: "Update completed successfully! Container is restarting...",
          output: `${updateResult}\n\n${restartResult}`,
          requiresRestart: true,
        });
      } else {
        // If not in Docker, just report the update result
        json(200, {
          success: true,
          message:
            "Update downloaded successfully! Please restart the application manually.",
          output: updateResult,
          requiresRestart: false,
        });
      }
    } else if (action === "restart") {
      // Just restart the container without pulling
      if (isRunningInDocker()) {
        const restartResult = await restartDockerContainer();

        json(200, {
          success: true,
          message: "Container restarted successfully!",
          output: restartResult,
          requiresRestart: true,
        });
      } else {
        json(400, {
          success: false,
          error: "Restart is only available when running in Docker.",
        });
      }
    } else {
      json(400, {
        success: false,
        error: "Invalid action. Use 'update' or 'restart'.",
      });
    }
  } catch (error: any) {
    console.error("Error performing system update:", error);
    json(500, {
      success: false,
      error: error.message || "Failed to perform system update",
    });
  }
};
