#!/usr/bin/env node

/**
 * Cleanup script for Prometheus Video Platform
 * Removes old temporary files and orphaned processing status entries
 */

import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, "..");
const tempDir = path.join(rootDir, "temp");
const processingStatusFile = path.join(tempDir, "processing-status.json");

async function cleanupTempFiles() {
  try {
    console.log("🧹 Cleaning up temporary files...");

    const tempFiles = await fs.readdir(tempDir);
    let removedCount = 0;
    let removedSize = 0;

    for (const file of tempFiles) {
      const filePath = path.join(tempDir, file);
      const stats = await fs.stat(filePath);

      // Skip directories and processing status file
      if (
        stats.isDirectory() ||
        file === "processing-status.json" ||
        file === "site-config.json"
      ) {
        continue;
      }

      // Remove assembled video files and old uploads
      if (
        file.startsWith("assembled_") ||
        file.endsWith(".mkv") ||
        file.endsWith(".mp4")
      ) {
        const ageHours =
          (Date.now() - stats.mtime.getTime()) / (1000 * 60 * 60);

        // Remove files older than 2 hours
        if (ageHours > 2) {
          await fs.unlink(filePath);
          removedCount++;
          removedSize += stats.size;
          console.log(
            `  ✅ Removed: ${file} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`
          );
        }
      }
    }

    console.log(
      `🎉 Cleanup complete: ${removedCount} files removed, ${(removedSize / 1024 / 1024).toFixed(2)} MB freed`
    );
  } catch (error) {
    console.error("❌ Error during cleanup:", error);
  }
}

async function cleanupProcessingStatus() {
  try {
    console.log("🔄 Cleaning up processing status...");

    const data = await fs.readFile(processingStatusFile, "utf-8");
    const statusData = JSON.parse(data);

    // Remove completed/failed items older than 24 hours
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const originalCount = statusData.length;

    const filteredData = statusData.filter((item) => {
      if (item.status === "processing") return true;
      return new Date(item.startTime) > oneDayAgo;
    });

    if (filteredData.length !== originalCount) {
      await fs.writeFile(
        processingStatusFile,
        JSON.stringify(filteredData, null, 2)
      );
      console.log(
        `  ✅ Removed ${originalCount - filteredData.length} old processing status entries`
      );
    } else {
      console.log("  ℹ️ No old processing status entries to remove");
    }
  } catch (error) {
    if (error.code !== "ENOENT") {
      console.error("❌ Error cleaning processing status:", error);
    }
  }
}

async function main() {
  console.log("🚀 Starting Prometheus cleanup...");

  await cleanupTempFiles();
  await cleanupProcessingStatus();

  console.log("✨ Cleanup complete!");
}

main().catch(console.error);
