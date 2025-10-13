import type { RequestHandler } from "@builder.io/qwik-city";
import jwt from "jsonwebtoken";
import { execSync } from "child_process";
import fs from "fs";
import path from "path";

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

// Helper function to get current version
function getCurrentVersion(): string {
  try {
    const packageJsonPath = path.join(process.cwd(), "package.json");
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
    return packageJson.version || "1.0.0";
  } catch {
    return "1.0.0";
  }
}

// Helper function to get GitHub repository info
function getGitHubInfo() {
  const owner = process.env.GITHUB_OWNER || "ItsAshn";
  const repo = process.env.GITHUB_REPO || "Prometheus";
  return { owner, repo };
}

// Helper function to fetch latest GitHub release
async function getLatestRelease(): Promise<{
  version: string;
  downloadUrl: string;
  releaseNotes: string;
}> {
  const { owner, repo } = getGitHubInfo();

  try {
    // Try to get the latest release
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/releases/latest`,
      {
        headers: {
          Accept: "application/vnd.github.v3+json",
          "User-Agent": "Prometheus-Update-System",
        },
      }
    );

    if (response.ok) {
      const release = await response.json();
      return {
        version: release.tag_name,
        downloadUrl: release.tarball_url,
        releaseNotes: release.body || "No release notes available",
      };
    } else {
      // Fallback to the main branch
      const branchResponse = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/branches/various-updates`,
        {
          headers: {
            Accept: "application/vnd.github.v3+json",
            "User-Agent": "Prometheus-Update-System",
          },
        }
      );

      if (branchResponse.ok) {
        const branch = await branchResponse.json();
        return {
          version: `dev-${branch.commit.sha.substring(0, 7)}`,
          downloadUrl: `https://github.com/${owner}/${repo}/archive/refs/heads/various-updates.tar.gz`,
          releaseNotes: "Latest development version from main branch",
        };
      }
    }

    throw new Error("Failed to fetch release information from GitHub");
  } catch (error: any) {
    throw new Error(`GitHub API error: ${error.message}`);
  }
}

// Helper function to download and extract update
async function downloadAndExtractUpdate(downloadUrl: string): Promise<void> {
  const tempDir = path.join(process.cwd(), "temp");
  const updateDir = path.join(tempDir, "update");

  // Clean up any existing update directory
  if (fs.existsSync(updateDir)) {
    fs.rmSync(updateDir, { recursive: true, force: true });
  }
  fs.mkdirSync(updateDir, { recursive: true });

  const tarballPath = path.join(tempDir, "update.tar.gz");

  try {
    // Download the tarball
    console.log(`Downloading from ${downloadUrl}...`);
    const response = await fetch(downloadUrl, {
      headers: {
        "User-Agent": "Prometheus-Update-System",
      },
    });

    if (!response.ok) {
      throw new Error(`Download failed: ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    fs.writeFileSync(tarballPath, Buffer.from(arrayBuffer));

    // Extract the tarball
    console.log("Extracting update...");
    execSync(`tar -xzf ${tarballPath} -C ${updateDir} --strip-components=1`, {
      stdio: "inherit",
    });

    // Clean up tarball
    fs.unlinkSync(tarballPath);

    console.log("Update downloaded and extracted successfully");
  } catch (error: any) {
    throw new Error(`Failed to download/extract update: ${error.message}`);
  }
}

// Helper function to apply update
async function applyUpdate(version: string): Promise<void> {
  const updateDir = path.join(process.cwd(), "temp", "update");
  const appDir = process.cwd();

  try {
    console.log("Applying update...");

    // Backup critical files
    const backupDir = path.join(process.cwd(), "temp", "backup");
    if (fs.existsSync(backupDir)) {
      fs.rmSync(backupDir, { recursive: true, force: true });
    }
    fs.mkdirSync(backupDir, { recursive: true });

    // Backup .env if exists
    const envPath = path.join(appDir, ".env");
    if (fs.existsSync(envPath)) {
      fs.copyFileSync(envPath, path.join(backupDir, ".env"));
    }

    // Copy new files (excluding certain directories)
    const excludeDirs = [
      "node_modules",
      "dist",
      "server",
      ".git",
      "temp",
      "public/videos",
      "data",
    ];

    function copyRecursive(src: string, dest: string) {
      const stat = fs.statSync(src);

      if (stat.isDirectory()) {
        const dirName = path.basename(src);
        if (excludeDirs.includes(dirName)) {
          return;
        }

        if (!fs.existsSync(dest)) {
          fs.mkdirSync(dest, { recursive: true });
        }

        const files = fs.readdirSync(src);
        for (const file of files) {
          copyRecursive(path.join(src, file), path.join(dest, file));
        }
      } else {
        fs.copyFileSync(src, dest);
      }
    }

    copyRecursive(updateDir, appDir);

    // Restore .env if it was backed up
    if (fs.existsSync(path.join(backupDir, ".env"))) {
      fs.copyFileSync(path.join(backupDir, ".env"), envPath);
    }

    // Update package.json version
    const packageJsonPath = path.join(appDir, "package.json");
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
    packageJson.version = version.replace(/^v/, "");
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

    console.log("Update applied successfully");
  } catch (error: any) {
    throw new Error(`Failed to apply update: ${error.message}`);
  }
}

// Helper function to rebuild application
async function rebuildApplication(): Promise<void> {
  try {
    console.log("Installing dependencies...");
    execSync("pnpm install --frozen-lockfile", {
      stdio: "inherit",
      cwd: process.cwd(),
    });

    console.log("Building application...");
    execSync("pnpm build.client && pnpm build.server", {
      stdio: "inherit",
      cwd: process.cwd(),
      env: { ...process.env, NODE_ENV: "production" },
    });

    console.log("Application rebuilt successfully");
  } catch (error: any) {
    throw new Error(`Failed to rebuild application: ${error.message}`);
  }
}

// Helper function to restart Docker container
async function restartDockerContainer(): Promise<string> {
  try {
    const containerName = process.env.CONTAINER_NAME || "prometheus";

    // Schedule container restart
    setTimeout(() => {
      console.log("Restarting container...");
      try {
        execSync(`docker restart ${containerName}`, { stdio: "inherit" });
      } catch {
        // Fallback to process kill
        process.kill(process.pid, "SIGTERM");
      }
    }, 3000);

    return "Container restart initiated. The application will restart in a few seconds...";
  } catch (error: any) {
    throw new Error(`Failed to restart Docker container: ${error.message}`);
  }
}

// Main update function
async function performFullUpdate(): Promise<{
  success: boolean;
  message: string;
  details: string[];
}> {
  const details: string[] = [];

  try {
    // Get current and latest versions
    const currentVersion = getCurrentVersion();
    details.push(`📦 Current version: ${currentVersion}`);

    const latestRelease = await getLatestRelease();
    details.push(`🆕 Latest version: ${latestRelease.version}`);

    if (currentVersion === latestRelease.version) {
      return {
        success: true,
        message: "Already up to date",
        details,
      };
    }

    // Download and extract update
    details.push("⬇️ Downloading update...");
    await downloadAndExtractUpdate(latestRelease.downloadUrl);
    details.push("✅ Download complete");

    // Apply update
    details.push("📝 Applying update...");
    await applyUpdate(latestRelease.version);
    details.push("✅ Update applied");

    // Rebuild application
    details.push("🔨 Rebuilding application...");
    await rebuildApplication();
    details.push("✅ Build complete");

    // Restart container
    details.push("🔄 Restarting container...");
    await restartDockerContainer();

    return {
      success: true,
      message: `Successfully updated to ${latestRelease.version}`,
      details,
    };
  } catch (error: any) {
    details.push(`❌ Error: ${error.message}`);
    return {
      success: false,
      message: "Update failed",
      details,
    };
  }
}

// Simple GET-based update system
export const onGet: RequestHandler = async ({ json, request, url }) => {
  if (!verifyAdminToken(request)) {
    json(401, { message: "Unauthorized" });
    return;
  }

  try {
    const action = url.searchParams.get("action") || "status";

    if (action === "update") {
      // Perform full update from GitHub
      const result = await performFullUpdate();

      json(200, {
        success: result.success,
        message: result.message,
        details: result.details.join("\n"),
        restarting: result.success,
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
    } else if (action === "check") {
      // Check for available updates
      try {
        const currentVersion = getCurrentVersion();
        const latestRelease = await getLatestRelease();

        json(200, {
          success: true,
          currentVersion,
          latestVersion: latestRelease.version,
          updateAvailable: currentVersion !== latestRelease.version,
          releaseNotes: latestRelease.releaseNotes,
        });
      } catch (error: any) {
        json(500, {
          success: false,
          error: `Failed to check for updates: ${error.message}`,
        });
      }
    } else {
      // Default: return status
      const currentVersion = getCurrentVersion();

      json(200, {
        success: true,
        message: "Update system ready",
        availableActions: [
          "?action=check - Check for available updates",
          "?action=update - Download latest version and restart",
          "?action=restart - Restart container without updating",
          "?action=status - Show this status (default)",
        ],
        currentVersion,
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error: any) {
    console.error("Update system error:", error);
    json(500, {
      success: false,
      error: error.message || "Update system error",
    });
  }
};
