/**
 * Disk space utilities for checking available storage
 */

import { exec } from "child_process";
import { promisify } from "util";
import { statfs } from "fs";
import { promisify as promisifyCallback } from "util";

const execAsync = promisify(exec);
const statfsAsync = promisifyCallback(statfs);

export interface DiskSpaceInfo {
  available: number; // Available bytes
  total: number; // Total bytes
  used: number; // Used bytes
  percentUsed: number; // Percentage used
}

/**
 * Get disk space information for a given path
 * Works cross-platform (Windows, Linux, macOS)
 */
export async function getDiskSpace(path: string): Promise<DiskSpaceInfo> {
  try {
    // Try Node.js built-in statfs (available in Node 18+)
    if (typeof statfs !== 'undefined') {
      try {
        const stats = await statfsAsync(path);
        const available = stats.bavail * stats.bsize;
        const total = stats.blocks * stats.bsize;
        const used = total - available;
        const percentUsed = (used / total) * 100;

        return {
          available,
          total,
          used,
          percentUsed,
        };
      } catch {
        // Fall through to platform-specific methods
      }
    }

    // Platform-specific fallbacks
    if (process.platform === "win32") {
      return await getWindowsDiskSpace(path);
    } else {
      return await getUnixDiskSpace(path);
    }
  } catch (error) {
    console.error("Error getting disk space:", error);
    // Return conservative estimates if we can't get real data
    return {
      available: 0,
      total: 0,
      used: 0,
      percentUsed: 100,
    };
  }
}

/**
 * Get disk space on Windows using wmic
 */
async function getWindowsDiskSpace(path: string): Promise<DiskSpaceInfo> {
  // Extract drive letter (e.g., "C:" from "C:\\path\\to\\file")
  const driveLetter = path.match(/^([A-Za-z]:)/)?.[1] || "C:";

  const { stdout } = await execAsync(
    `wmic logicaldisk where "DeviceID='${driveLetter}'" get Size,FreeSpace /format:csv`
  );

  // Parse CSV output
  const lines = stdout.trim().split("\n").filter(line => line.trim().length > 0);
  const dataLine = lines[lines.length - 1]; // Last non-empty line
  
  if (!dataLine) {
    throw new Error("No data returned from wmic");
  }
  
  const parts = dataLine.split(",");

  if (parts.length < 3) {
    throw new Error("Failed to parse wmic output");
  }

  const available = parseInt(parts[1] || "0") || 0;
  const total = parseInt(parts[2] || "0") || 0;
  const used = total - available;
  const percentUsed = total > 0 ? (used / total) * 100 : 0;

  return {
    available,
    total,
    used,
    percentUsed,
  };
}

/**
 * Get disk space on Unix-like systems (Linux, macOS) using df
 */
async function getUnixDiskSpace(pathToCheck: string): Promise<DiskSpaceInfo> {
  const { stdout } = await execAsync(`df -k "${pathToCheck}"`);

  // Parse df output
  // Format: Filesystem 1K-blocks Used Available Use% Mounted
  const lines = stdout.trim().split("\n");
  if (lines.length < 2) {
    throw new Error("Failed to parse df output - insufficient lines");
  }
  
  const dataLine = lines[1]; // Second line contains the data
  
  if (!dataLine) {
    throw new Error("No data returned from df");
  }
  
  const parts = dataLine.split(/\s+/);

  if (parts.length < 4) {
    throw new Error("Failed to parse df output - insufficient columns");
  }

  const totalK = parts[1]?.trim() || "0";
  const usedK = parts[2]?.trim() || "0";
  const availableK = parts[3]?.trim() || "0";
  
  const total = parseInt(totalK) * 1024; // Convert from KB to bytes
  const used = parseInt(usedK) * 1024;
  const available = parseInt(availableK) * 1024;
  const percentUsed = total > 0 ? (used / total) * 100 : 0;

  return {
    available,
    total,
    used,
    percentUsed,
  };
}

/**
 * Check if there's enough disk space for an operation
 * @param path - Path to check
 * @param requiredBytes - Required bytes
 * @param bufferPercent - Additional buffer percentage (default 10%)
 * @returns true if enough space is available
 */
export async function hasEnoughDiskSpace(
  path: string,
  requiredBytes: number,
  bufferPercent = 10
): Promise<boolean> {
  const diskSpace = await getDiskSpace(path);
  const requiredWithBuffer = requiredBytes * (1 + bufferPercent / 100);
  return diskSpace.available >= requiredWithBuffer;
}

/**
 * Format bytes to human-readable format
 */
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB"];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

/**
 * Get disk space as human-readable string
 */
export async function getDiskSpaceString(path: string): Promise<string> {
  const info = await getDiskSpace(path);
  return `${formatBytes(info.available)} available of ${formatBytes(info.total)} (${info.percentUsed.toFixed(1)}% used)`;
}
