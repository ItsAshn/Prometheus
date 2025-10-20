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
        const [rawKey, rawValue] = cookie.trim().split("=");
        const key = rawKey?.trim();
        if (!key) return acc;
        acc[key] = rawValue ?? "";
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
    // Try to get git information first - this is the source of truth
    try {
      // Check if we're in a git repository
      const isGitRepo = fs.existsSync(path.join(process.cwd(), ".git"));

      if (isGitRepo) {
        // Try to get exact tag at current commit (this works for releases)
        try {
          const exactTag = execSync("git describe --exact-match --tags HEAD", {
            encoding: "utf-8",
            stdio: ["pipe", "pipe", "pipe"],
          }).trim();

          if (exactTag) {
            // We're exactly at a tag - this is a release version
            return exactTag;
          }
        } catch {
          // Not at an exact tag, continue to check for nearest tag
        }

        // Try to get the nearest tag and commits since
        try {
          const gitDescribe = execSync("git describe --tags --long", {
            encoding: "utf-8",
            stdio: ["pipe", "pipe", "pipe"],
          }).trim();

          if (gitDescribe) {
            // Format: v1.0.0-5-g1a2b3c4 (tag-commits-hash)
            const parts = gitDescribe.split("-");
            if (parts.length >= 3) {
              const tag = parts.slice(0, -2).join("-");
              const commitsSinceTag = parseInt(
                parts[parts.length - 2] || "0",
                10
              );
              const shortHash = parts[parts.length - 1];

              if (commitsSinceTag > 0) {
                // We're ahead of the tag
                return `${tag}+${commitsSinceTag}.${shortHash}`;
              } else {
                // We're at the tag
                return tag;
              }
            }
          }
        } catch {
          // No tags found at all, build version from commit
          try {
            const packageJsonPath = path.join(process.cwd(), "package.json");
            const packageJson = JSON.parse(
              fs.readFileSync(packageJsonPath, "utf-8")
            );
            const baseVersion = packageJson.version || "1.0.0";

            const shortHash = execSync("git rev-parse --short HEAD", {
              encoding: "utf-8",
              stdio: ["pipe", "pipe", "pipe"],
            }).trim();

            const commitCount = execSync("git rev-list --count HEAD", {
              encoding: "utf-8",
              stdio: ["pipe", "pipe", "pipe"],
            }).trim();

            return `${baseVersion}-dev.${commitCount}+${shortHash}`;
          } catch {
            // Can't get git info, fall through to package.json
          }
        }
      }
    } catch (error) {
      // Git commands failed, continue to package.json fallback
      console.log("Could not retrieve git version info:", error);
    }

    // Fallback to package.json version
    const packageJsonPath = path.join(process.cwd(), "package.json");
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
    return packageJson.version || "1.0.0";
  } catch {
    return "1.0.0";
  }
}

// Helper function to get GitHub repository info
function getGitHubInfo() {
  // Hardcoded official repository - all installations pull updates from here
  // Users don't need to set these in their .env file
  const owner = "ItsAshn";
  const repo = "Prometheus";
  return { owner, repo };
}

// Helper function to fetch latest GitHub release
async function getLatestRelease(includePrereleases: boolean = false): Promise<{
  version: string;
  downloadUrl: string;
  releaseNotes: string;
  isPrerelease: boolean;
}> {
  const { owner, repo } = getGitHubInfo();

  try {
    // Get all releases to find the appropriate one
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/releases`,
      {
        headers: {
          Accept: "application/vnd.github.v3+json",
          "User-Agent": "Prometheus-Update-System",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`GitHub API responded with status ${response.status}`);
    }

    const releases = await response.json();

    if (!Array.isArray(releases) || releases.length === 0) {
      throw new Error("No releases found on GitHub");
    }

    // Find the appropriate release
    let selectedRelease;
    if (includePrereleases) {
      // Get the latest release (including pre-releases)
      selectedRelease = releases[0];
    } else {
      // Get the latest stable release (excluding pre-releases)
      selectedRelease = releases.find((r: any) => !r.prerelease);
    }

    if (!selectedRelease) {
      throw new Error("No suitable release found on GitHub");
    }

    return {
      version: selectedRelease.tag_name,
      downloadUrl: selectedRelease.tarball_url,
      releaseNotes: selectedRelease.body || "No release notes available",
      isPrerelease: selectedRelease.prerelease || false,
    };
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

    // Create a git tag to mark this version
    try {
      // Configure git if needed (for Docker containers)
      try {
        execSync('git config user.email "prometheus@system.local"', {
          stdio: ["pipe", "pipe", "pipe"],
        });
        execSync('git config user.name "Prometheus System"', {
          stdio: ["pipe", "pipe", "pipe"],
        });
      } catch {
        // Git config might already be set, ignore errors
      }

      // Stage and commit the version update
      execSync("git add package.json", { stdio: ["pipe", "pipe", "pipe"] });
      execSync(`git commit -m "Update to ${version}"`, {
        stdio: ["pipe", "pipe", "pipe"],
      });

      // Create annotated tag for the version
      execSync(`git tag -a "${version}" -m "Release ${version}"`, {
        stdio: ["pipe", "pipe", "pipe"],
      });

      console.log(`Created git tag: ${version}`);
    } catch (error: any) {
      // Git tagging failed, but update was still applied
      console.warn(
        `Warning: Could not create git tag: ${error.message}. Update still applied.`
      );
    }

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

// Helper function to compare versions
function compareVersions(current: string, latest: string): boolean {
  // Remove 'v' prefix if present
  const cleanCurrent = current.replace(/^v/, "");
  const cleanLatest = latest.replace(/^v/, "");

  // If they're exactly equal, no update needed
  if (cleanCurrent === cleanLatest) {
    return false;
  }

  // Parse version numbers
  const parseCurrent = cleanCurrent.split(/[.-]/).map((n) => parseInt(n) || 0);
  const parseLatest = cleanLatest.split(/[.-]/).map((n) => parseInt(n) || 0);

  // Compare version numbers
  for (let i = 0; i < Math.max(parseCurrent.length, parseLatest.length); i++) {
    const curr = parseCurrent[i] || 0;
    const lat = parseLatest[i] || 0;

    if (lat > curr) return true;
    if (lat < curr) return false;
  }

  // If versions are numerically equal but strings differ, update is available
  return cleanCurrent !== cleanLatest;
}

// Main update function
async function performFullUpdate(includePrereleases: boolean = false): Promise<{
  success: boolean;
  message: string;
  details: string[];
}> {
  const details: string[] = [];

  try {
    // Get current and latest versions
    const currentVersion = getCurrentVersion();
    details.push(`📦 Current version: ${currentVersion}`);

    const latestRelease = await getLatestRelease(includePrereleases);
    details.push(
      `🆕 Latest version: ${latestRelease.version}${latestRelease.isPrerelease ? " (pre-release)" : ""}`
    );

    if (!compareVersions(currentVersion, latestRelease.version)) {
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
    const includePrereleases =
      url.searchParams.get("prerelease") === "true" || false;

    if (action === "update") {
      // Perform full update from GitHub
      const result = await performFullUpdate(includePrereleases);

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
        const latestRelease = await getLatestRelease(includePrereleases);

        json(200, {
          success: true,
          currentVersion,
          latestVersion: latestRelease.version,
          updateAvailable: compareVersions(
            currentVersion,
            latestRelease.version
          ),
          releaseNotes: latestRelease.releaseNotes,
          isPrerelease: latestRelease.isPrerelease,
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
          "?action=check - Check for available updates (stable releases only)",
          "?action=check&prerelease=true - Check for updates including pre-releases",
          "?action=update - Download latest stable version and restart",
          "?action=update&prerelease=true - Download latest version including pre-releases and restart",
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
