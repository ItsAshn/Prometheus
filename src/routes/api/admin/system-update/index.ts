import type { RequestHandler } from "@builder.io/qwik-city";
import { promisify } from "util";
import { exec } from "child_process";
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
  try {
    const [branchResult, statusResult, remoteResult, commitResult] =
      await Promise.all([
        executeCommand("git branch --show-current"),
        executeCommand("git status --porcelain"),
        executeCommand("git remote get-url origin"),
        executeCommand("git log -1 --format='%H %s'"),
      ]);

    return {
      currentBranch: branchResult.stdout.trim(),
      hasChanges: statusResult.stdout.trim().length > 0,
      remoteUrl: remoteResult.stdout.trim(),
      lastCommit: commitResult.stdout.trim(),
    };
  } catch (error: any) {
    throw new Error(`Failed to get Git status: ${error.message}`);
  }
}

// Helper function to pull latest changes
async function pullLatestChanges(): Promise<string> {
  try {
    // First, fetch the latest changes
    await executeCommand("git fetch origin");

    // Check if there are updates available
    const { stdout: behindOutput } = await executeCommand(
      "git rev-list --count HEAD..origin/master"
    );
    const commitsBehind = parseInt(behindOutput.trim());

    if (commitsBehind === 0) {
      return "Already up to date - no new changes available.";
    }

    // Pull the latest changes
    const { stdout: pullOutput } = await executeCommand(
      "git pull origin master"
    );

    return `Successfully pulled ${commitsBehind} new commit(s):\n${pullOutput}`;
  } catch (error: any) {
    throw new Error(`Failed to pull changes: ${error.message}`);
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

    // Check if there are remote updates available
    let updatesAvailable = false;
    let updateInfo = "";

    try {
      await executeCommand("git fetch origin");
      const { stdout: behindOutput } = await executeCommand(
        "git rev-list --count HEAD..origin/master"
      );
      const commitsBehind = parseInt(behindOutput.trim());

      if (commitsBehind > 0) {
        updatesAvailable = true;
        const { stdout: logOutput } = await executeCommand(
          `git log --oneline HEAD..origin/master`
        );
        updateInfo = `${commitsBehind} update(s) available:\n${logOutput}`;
      } else {
        updateInfo = "System is up to date.";
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
    const { action } = await request.json();

    if (action === "update") {
      // Pull latest changes
      const pullResult = await pullLatestChanges();

      if (isRunningInDocker()) {
        // If running in Docker, restart the container
        const restartResult = await restartDockerContainer();

        json(200, {
          success: true,
          message: "Update completed successfully! Container is restarting...",
          output: `${pullResult}\n\n${restartResult}`,
          requiresRestart: true,
        });
      } else {
        // If not in Docker, just report the pull result
        json(200, {
          success: true,
          message:
            "Code updated successfully! Please restart the application manually.",
          output: pullResult,
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
