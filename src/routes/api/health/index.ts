import type { RequestHandler } from "@builder.io/qwik-city";
import { VideoProcessor } from "~/lib/video/video-processor";
import { promises as fs } from "fs";
import path from "path";
import { CONFIG } from "~/lib/constants";

/**
 * Health check endpoint
 * Returns system status including FFmpeg availability, disk space, and processing queue
 */
export const onGet: RequestHandler = async ({ json }) => {
  try {
    const checks = {
      ffmpeg: {
        available: false,
        version: null as string | null,
        path: null as string | null,
      },
      disk: { available: true, free: 0, total: 0, used: 0, percentUsed: 0 },
      processing: { active: 0, queued: 0 },
      directories: { videosDir: false, hlsDir: false, tempDir: false },
    };

    // Check FFmpeg availability
    try {
      const ffmpegStatus = await VideoProcessor.checkFFmpegStatus();
      checks.ffmpeg = {
        available: ffmpegStatus.available,
        version: ffmpegStatus.version,
        path: ffmpegStatus.path,
      };
    } catch (error) {
      console.error("FFmpeg check failed:", error);
    }

    // Check processing queue
    try {
      const processingStatus = await VideoProcessor.getProcessingStatus();
      checks.processing = {
        active: processingStatus.filter((s) => s.status === "processing")
          .length,
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

      checks.directories.videosDir = await checkDirectoryWritable(videosDir);
      checks.directories.hlsDir = await checkDirectoryWritable(hlsDir);
      checks.directories.tempDir = await checkDirectoryWritable(tempDir);
    } catch (error) {
      console.error("Directory check failed:", error);
    }

    // Check disk space
    try {
      const diskSpace = await getDiskSpace(process.cwd());
      checks.disk = diskSpace;
    } catch (error) {
      console.error("Disk space check failed:", error);
      checks.disk.available = false;
    }

    // Determine overall health status
    const healthy =
      checks.ffmpeg.available &&
      checks.directories.videosDir &&
      checks.directories.hlsDir &&
      checks.directories.tempDir &&
      checks.disk.percentUsed < 95; // Alert if disk is >95% full

    const status = healthy ? "healthy" : "degraded";
    const statusCode = healthy ? 200 : 503;

    json(statusCode, {
      status,
      timestamp: new Date().toISOString(),
      version: process.env.APP_VERSION || "unknown",
      uptime: process.uptime(),
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

/**
 * Get disk space information
 * Note: This is a basic implementation. For production, consider using a library like 'check-disk-space'
 */
async function getDiskSpace(dirPath: string): Promise<{
  available: boolean;
  free: number;
  total: number;
  used: number;
  percentUsed: number;
}> {
  try {
    // This is platform-dependent and basic
    // For a more robust solution, you'd want to use a library
    const stats = await fs.statfs(dirPath);

    const total = stats.blocks * stats.bsize;
    const free = stats.bfree * stats.bsize;
    const used = total - free;
    const percentUsed = Math.round((used / total) * 100);

    return {
      available: true,
      free,
      total,
      used,
      percentUsed,
    };
  } catch {
    // Fallback if statfs is not available
    return {
      available: false,
      free: 0,
      total: 0,
      used: 0,
      percentUsed: 0,
    };
  }
}
