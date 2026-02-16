import type { RequestHandler } from "@builder.io/qwik-city";
import { VideoProcessor } from "~/lib/video/video-processor";
import { promises as fs } from "fs";
import path from "path";
import { CONFIG } from "~/lib/constants";
import { getDiskSpace, formatBytes } from "~/lib/disk-space";
import os from "os";

/**
 * Health check endpoint
 * Returns comprehensive system status for monitoring and debugging
 */
export const onGet: RequestHandler = async ({ json }) => {
  try {
    const checks = {
      ffmpeg: {
        available: false,
        version: null as string | null,
        path: null as string | null,
        error: null as string | null,
      },
      disk: {
        available: false,
        free: "0 B",
        total: "0 B",
        used: "0 B",
        percentUsed: 0,
        healthy: true,
      },
      processing: {
        active: 0,
        completed: 0,
        failed: 0,
        queued: 0,
      },
      directories: {
        videosDir: false,
        hlsDir: false,
        tempDir: false,
        uploadsDir: false,
      },
      docker: {
        isContainer: false,
        hostname: null as string | null,
        version: null as string | null,
        imageName: null as string | null,
      },
      system: {
        platform: process.platform,
        arch: process.arch,
        nodeVersion: process.version,
        uptime: Math.floor(process.uptime()),
        memory: {
          total: formatBytes(os.totalmem()),
          free: formatBytes(os.freemem()),
          used: formatBytes(os.totalmem() - os.freemem()),
          percentUsed: Math.round(
            ((os.totalmem() - os.freemem()) / os.totalmem()) * 100,
          ),
        },
        cpu: {
          cores: os.cpus().length,
          model: os.cpus()[0]?.model || "Unknown",
        },
      },
    };

    // Check FFmpeg availability
    try {
      const ffmpegStatus = await VideoProcessor.checkFFmpegStatus();
      checks.ffmpeg = {
        available: ffmpegStatus.available,
        version: ffmpegStatus.version,
        path: ffmpegStatus.path,
        error: ffmpegStatus.error || null,
      };
    } catch (error) {
      checks.ffmpeg.error =
        error instanceof Error ? error.message : "FFmpeg check failed";
    }

    // Check processing queue
    try {
      const processingStatus = await VideoProcessor.getProcessingStatus();
      checks.processing = {
        active: processingStatus.filter((s) => s.status === "processing")
          .length,
        completed: processingStatus.filter((s) => s.status === "completed")
          .length,
        failed: processingStatus.filter((s) => s.status === "failed").length,
        queued: processingStatus.length,
      };
    } catch (error) {
      console.error("Processing status check failed:", error);
    }

    // Check directories exist and are writable
    try {
      const videosDir = path.join(process.cwd(), CONFIG.PATHS.VIDEOS_DIR);
      const hlsDir = path.join(process.cwd(), CONFIG.PATHS.HLS_DIR);
      const tempDir = path.join(process.cwd(), CONFIG.PATHS.TEMP_DIR);
      const uploadsDir = path.join(tempDir, "uploads");

      checks.directories.videosDir = await checkDirectoryWritable(videosDir);
      checks.directories.hlsDir = await checkDirectoryWritable(hlsDir);
      checks.directories.tempDir = await checkDirectoryWritable(tempDir);
      checks.directories.uploadsDir = await checkDirectoryWritable(uploadsDir);
    } catch (error) {
      console.error("Directory check failed:", error);
    }

    // Check disk space
    try {
      const diskSpace = await getDiskSpace(process.cwd());
      checks.disk = {
        available: true,
        free: formatBytes(diskSpace.available),
        total: formatBytes(diskSpace.total),
        used: formatBytes(diskSpace.used),
        percentUsed: Math.round(diskSpace.percentUsed),
        healthy: diskSpace.percentUsed < 90, // Warn if >90% full
      };
    } catch (error) {
      console.error("Disk space check failed:", error);
    }

    // Check Docker environment
    try {
      const isContainer =
        process.env.DOCKER_CONTAINER === "true" ||
        (await fs
          .access("/.dockerenv")
          .then(() => true)
          .catch(() => false));

      checks.docker = {
        isContainer,
        hostname: process.env.HOSTNAME || null,
        version: process.env.APP_VERSION || null,
        imageName: process.env.IMAGE_NAME || null,
      };
    } catch (error) {
      console.error("Docker check failed:", error);
    }

    // Determine overall health status
    const issues: string[] = [];

    if (!checks.ffmpeg.available) issues.push("FFmpeg not available");
    if (!checks.directories.videosDir)
      issues.push("Videos directory not writable");
    if (!checks.directories.hlsDir) issues.push("HLS directory not writable");
    if (!checks.directories.tempDir) issues.push("Temp directory not writable");
    if (!checks.disk.healthy)
      issues.push(`Disk usage critical: ${checks.disk.percentUsed}%`);
    if (checks.system.memory.percentUsed > 90)
      issues.push(`Memory usage high: ${checks.system.memory.percentUsed}%`);

    const healthy = issues.length === 0;
    const status = healthy
      ? "healthy"
      : issues.length > 2
        ? "unhealthy"
        : "degraded";
    const statusCode = healthy ? 200 : issues.length > 2 ? 503 : 200;

    json(statusCode, {
      status,
      timestamp: new Date().toISOString(),
      version: process.env.APP_VERSION || "1.0.0",
      uptime: `${Math.floor(process.uptime() / 3600)}h ${Math.floor((process.uptime() % 3600) / 60)}m`,
      issues: issues.length > 0 ? issues : undefined,
      checks,
    });
    return;
  } catch (error) {
    console.error("Health check error:", error);
    json(500, {
      status: "error",
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return;
  }
};

/**
 * Check if a directory is writable
 */
async function checkDirectoryWritable(dirPath: string): Promise<boolean> {
  try {
    // Check if directory exists
    await fs.access(dirPath);

    // Try to write a test file
    const testFile = path.join(dirPath, ".health-check");
    await fs.writeFile(testFile, "test");
    await fs.unlink(testFile);

    return true;
  } catch {
    return false;
  }
}
