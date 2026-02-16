/**
 * Cleanup utility for temporary files and orphaned data
 * Helps prevent disk space issues in self-hosted setups
 */

import { promises as fs } from "fs";
import path from "path";
import { CONFIG } from "./constants";
import { logError } from "./errors";

const TEMP_DIR = path.join(process.cwd(), CONFIG.PATHS.TEMP_DIR);
const UPLOADS_DIR = path.join(process.cwd(), CONFIG.PATHS.TEMP_DIR, "uploads");

interface CleanupStats {
  filesDeleted: number;
  bytesFreed: number;
  errors: number;
}

/**
 * Clean up temporary files older than the specified age
 * @param maxAgeHours - Maximum age in hours (default: 24 hours)
 * @returns Cleanup statistics
 */
export async function cleanupTempFiles(maxAgeHours = 24): Promise<CleanupStats> {
  const stats: CleanupStats = {
    filesDeleted: 0,
    bytesFreed: 0,
    errors: 0,
  };

  const maxAgeMs = maxAgeHours * 60 * 60 * 1000;
  const now = Date.now();

  try {
    // Ensure directories exist
    await fs.mkdir(TEMP_DIR, { recursive: true });
    
    // Clean temp directory
    await cleanDirectory(TEMP_DIR, maxAgeMs, now, stats);
    
    // Clean uploads directory if it exists
    try {
      await fs.access(UPLOADS_DIR);
      await cleanDirectory(UPLOADS_DIR, maxAgeMs, now, stats);
    } catch {
      // Uploads directory doesn't exist, skip it
    }

    console.log(`[Cleanup] Removed ${stats.filesDeleted} files, freed ${formatBytes(stats.bytesFreed)}`);
  } catch (error) {
    logError("Cleanup Temp Files", error);
    stats.errors++;
  }

  return stats;
}

/**
 * Clean files in a directory recursively
 */
async function cleanDirectory(
  dirPath: string,
  maxAgeMs: number,
  now: number,
  stats: CleanupStats
): Promise<void> {
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);

      try {
        if (entry.isDirectory()) {
          // Recursively clean subdirectories
          await cleanDirectory(fullPath, maxAgeMs, now, stats);
          
          // Try to remove empty directories
          try {
            const remainingFiles = await fs.readdir(fullPath);
            if (remainingFiles.length === 0) {
              await fs.rmdir(fullPath);
              console.log(`[Cleanup] Removed empty directory: ${fullPath}`);
            }
          } catch {
            // Directory not empty or can't be removed
          }
        } else if (entry.isFile()) {
          // Check file age
          const fileStat = await fs.stat(fullPath);
          const fileAge = now - fileStat.mtimeMs;

          // Don't delete important config files
          const isProtected = entry.name.endsWith("credentials.json") ||
                            entry.name.endsWith("site-config.json") ||
                            entry.name.endsWith("-status.json");

          if (!isProtected && fileAge > maxAgeMs) {
            // Delete old file
            await fs.unlink(fullPath);
            stats.filesDeleted++;
            stats.bytesFreed += fileStat.size;
            console.log(`[Cleanup] Deleted old file: ${entry.name} (${formatBytes(fileStat.size)}, ${Math.round(fileAge / 3600000)}h old)`);
          }
        }
      } catch (error) {
        logError("Cleanup File", error, { filePath: fullPath });
        stats.errors++;
      }
    }
  } catch (error) {
    logError("Cleanup Directory", error, { dirPath });
    stats.errors++;
  }
}

/**
 * Clean up orphaned upload chunks
 * Removes incomplete chunked uploads that were never assembled
 */
export async function cleanupOrphanedChunks(maxAgeHours = 6): Promise<CleanupStats> {
  const stats: CleanupStats = {
    filesDeleted: 0,
    bytesFreed: 0,
    errors: 0,
  };

  const maxAgeMs = maxAgeHours * 60 * 60 * 1000;
  const now = Date.now();

  try {
    await fs.access(UPLOADS_DIR);
    
    const entries = await fs.readdir(UPLOADS_DIR, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isDirectory()) {
        const uploadDir = path.join(UPLOADS_DIR, entry.name);
        
        try {
          // Check if this is an incomplete upload
          const uploadStat = await fs.stat(uploadDir);
          const uploadAge = now - uploadStat.mtimeMs;

          if (uploadAge > maxAgeMs) {
            // Count files and size before deletion
            const files = await fs.readdir(uploadDir);
            let totalSize = 0;

            for (const file of files) {
              const filePath = path.join(uploadDir, file);
              const fileStat = await fs.stat(filePath);
              totalSize += fileStat.size;
            }

            // Delete the entire upload directory
            await fs.rm(uploadDir, { recursive: true, force: true });
            
            stats.filesDeleted += files.length;
            stats.bytesFreed += totalSize;
            
            console.log(`[Cleanup] Removed orphaned upload: ${entry.name} (${files.length} chunks, ${formatBytes(totalSize)})`);
          }
        } catch (error) {
          logError("Cleanup Orphaned Chunk", error, { uploadDir });
          stats.errors++;
        }
      }
    }

    console.log(`[Cleanup Chunks] Removed ${stats.filesDeleted} orphaned chunks, freed ${formatBytes(stats.bytesFreed)}`);
  } catch (error) {
    // Uploads directory doesn't exist, nothing to clean
  }

  return stats;
}

/**
 * Clean up failed video processing artifacts
 * Removes HLS directories for videos that failed processing
 */
export async function cleanupFailedVideos(): Promise<CleanupStats> {
  const stats: CleanupStats = {
    filesDeleted: 0,
    bytesFreed: 0,
    errors: 0,
  };

  const hlsDir = path.join(process.cwd(), CONFIG.PATHS.HLS_DIR);

  try {
    // Read processing status to find failed videos
    const statusFile = path.join(process.cwd(), CONFIG.PATHS.PROCESSING_STATUS_FILE);
    
    let failedVideos: Set<string> = new Set();
    
    try {
      const statusContent = await fs.readFile(statusFile, "utf-8");
      const statusData = JSON.parse(statusContent);
      
      if (Array.isArray(statusData)) {
        for (const video of statusData) {
          if (video.status === "failed") {
            failedVideos.add(video.videoId);
          }
        }
      }
    } catch {
      // No status file or can't read it
    }

    // Check HLS directory for failed videos
    try {
      const hlsEntries = await fs.readdir(hlsDir, { withFileTypes: true });
      
      for (const entry of hlsEntries) {
        if (entry.isDirectory() && failedVideos.has(entry.name)) {
          const videoDir = path.join(hlsDir, entry.name);
          
          // Calculate size before deletion
          let totalSize = 0;
          try {
            const files = await getAllFiles(videoDir);
            for (const file of files) {
              const fileStat = await fs.stat(file);
              totalSize += fileStat.size;
            }
          } catch {
            // Can't calculate size
          }

          // Delete the failed video directory
          await fs.rm(videoDir, { recursive: true, force: true });
          
          stats.filesDeleted++;
          stats.bytesFreed += totalSize;
          
          console.log(`[Cleanup] Removed failed video: ${entry.name} (${formatBytes(totalSize)})`);
        }
      }
    } catch {
      // HLS directory doesn't exist
    }

    if (stats.filesDeleted > 0) {
      console.log(`[Cleanup Failed] Removed ${stats.filesDeleted} failed videos, freed ${formatBytes(stats.bytesFreed)}`);
    }
  } catch (error) {
    logError("Cleanup Failed Videos", error);
    stats.errors++;
  }

  return stats;
}

/**
 * Run all cleanup tasks
 * @returns Combined cleanup statistics
 */
export async function runFullCleanup(): Promise<CleanupStats> {
  console.log("[Cleanup] Starting full cleanup...");
  
  const tempStats = await cleanupTempFiles(24);
  const chunkStats = await cleanupOrphanedChunks(6);
  const failedStats = await cleanupFailedVideos();

  const totalStats: CleanupStats = {
    filesDeleted: tempStats.filesDeleted + chunkStats.filesDeleted + failedStats.filesDeleted,
    bytesFreed: tempStats.bytesFreed + chunkStats.bytesFreed + failedStats.bytesFreed,
    errors: tempStats.errors + chunkStats.errors + failedStats.errors,
  };

  console.log(`[Cleanup] Total: ${totalStats.filesDeleted} files removed, ${formatBytes(totalStats.bytesFreed)} freed, ${totalStats.errors} errors`);
  
  return totalStats;
}

/**
 * Get all files in a directory recursively
 */
async function getAllFiles(dirPath: string): Promise<string[]> {
  const files: string[] = [];
  const entries = await fs.readdir(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    
    if (entry.isDirectory()) {
      const subFiles = await getAllFiles(fullPath);
      files.push(...subFiles);
    } else {
      files.push(fullPath);
    }
  }

  return files;
}

/**
 * Format bytes to human-readable format
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}
