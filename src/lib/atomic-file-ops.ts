/**
 * Atomic file operations utility
 * Prevents data corruption by writing to a temporary file first, then atomically renaming
 */

import { promises as fs } from "fs";
import path from "path";
import { logError } from "./errors";

/**
 * Atomically write data to a JSON file
 * Writes to a temp file first, then renames it to prevent corruption on crashes
 * 
 * @param filePath - Path to the target JSON file
 * @param data - Data to write (will be JSON.stringify'd)
 * @param pretty - Whether to pretty-print the JSON (default: true for readability)
 */
export async function atomicWriteJSON(
  filePath: string,
  data: any,
  pretty = true
): Promise<void> {
  const tempFilePath = `${filePath}.tmp.${Date.now()}`;
  
  try {
    // Ensure directory exists
    const dir = path.dirname(filePath);
    await fs.mkdir(dir, { recursive: true });

    // Write to temporary file first
    const jsonContent = pretty 
      ? JSON.stringify(data, null, 2)
      : JSON.stringify(data);
    
    await fs.writeFile(tempFilePath, jsonContent, "utf-8");

    // Verify the file was written correctly
    const written = await fs.readFile(tempFilePath, "utf-8");
    JSON.parse(written); // Throws if invalid JSON

    // Atomically rename temp file to target file
    // On most systems, this is an atomic operation that won't leave corrupted files
    await fs.rename(tempFilePath, filePath);
  } catch (error) {
    // Clean up temp file on error
    try {
      await fs.unlink(tempFilePath);
    } catch {
      // Ignore cleanup errors
    }
    
    logError("Atomic Write JSON", error, { filePath });
    throw error;
  }
}

/**
 * Safely read a JSON file with fallback to backup
 * If the main file is corrupted, attempts to read from .backup file
 * 
 * @param filePath - Path to the JSON file
 * @param defaultValue - Default value if file doesn't exist
 * @returns Parsed JSON data or default value
 */
export async function safeReadJSON<T = any>(
  filePath: string,
  defaultValue: T
): Promise<T> {
  const backupFilePath = `${filePath}.backup`;

  try {
    const content = await fs.readFile(filePath, "utf-8");
    
    // Try to parse the file
    try {
      return JSON.parse(content) as T;
    } catch (parseError) {
      logError("JSON Parse Error", parseError, { filePath });
      
      // File exists but is corrupted, try backup
      try {
        const backupContent = await fs.readFile(backupFilePath, "utf-8");
        const backupData = JSON.parse(backupContent) as T;
        
        // Restore from backup
        await fs.writeFile(filePath, backupContent, "utf-8");
        console.log(`[Atomic Read] Restored ${filePath} from backup`);
        
        return backupData;
      } catch {
        // Backup also failed, return default
        console.log(`[Atomic Read] Backup failed, using default for ${filePath}`);
        return defaultValue;
      }
    }
  } catch (error: any) {
    // File doesn't exist
    if (error.code === "ENOENT") {
      return defaultValue;
    }
    
    logError("Safe Read JSON", error, { filePath });
    return defaultValue;
  }
}

/**
 * Create a backup of a JSON file
 * Should be called before major operations or periodically
 * 
 * @param filePath - Path to the JSON file to backup
 */
export async function backupJSON(filePath: string): Promise<void> {
  const backupFilePath = `${filePath}.backup`;
  
  try {
    // Check if source file exists
    await fs.access(filePath);
    
    // Copy to backup
    await fs.copyFile(filePath, backupFilePath);
  } catch (error: any) {
    if (error.code !== "ENOENT") {
      logError("Backup JSON", error, { filePath });
    }
    // Silently fail if source doesn't exist
  }
}

/**
 * Atomically update a JSON file by reading, modifying, and writing it
 * Includes automatic backup before modification
 * 
 * @param filePath - Path to the JSON file
 * @param updateFn - Function that receives current data and returns updated data
 * @param defaultValue - Default value if file doesn't exist
 */
export async function atomicUpdateJSON<T = any>(
  filePath: string,
  updateFn: (current: T) => T,
  defaultValue: T
): Promise<void> {
  // Backup existing file before modification
  await backupJSON(filePath);
  
  // Read current data
  const currentData = await safeReadJSON<T>(filePath, defaultValue);
  
  // Apply update
  const updatedData = updateFn(currentData);
  
  // Write atomically
  await atomicWriteJSON(filePath, updatedData);
}

/**
 * Lock file to prevent concurrent writes
 * Simple file-based locking mechanism
 */
class FileLock {
  private locks = new Map<string, Promise<void>>();

  async acquire(filePath: string): Promise<() => void> {
    const existingLock = this.locks.get(filePath);
    
    if (existingLock) {
      await existingLock;
    }

    let releaseFn: () => void;
    const lockPromise = new Promise<void>((resolve) => {
      releaseFn = resolve;
    });

    this.locks.set(filePath, lockPromise);

    return () => {
      this.locks.delete(filePath);
      releaseFn!();
    };
  }
}

const fileLock = new FileLock();

/**
 * Perform an atomic operation with file locking
 * Ensures only one write happens at a time for a given file
 * 
 * @param filePath - Path to the file to lock
 * @param operation - Operation to perform while holding the lock
 */
export async function withFileLock<T>(
  filePath: string,
  operation: () => Promise<T>
): Promise<T> {
  const release = await fileLock.acquire(filePath);
  
  try {
    return await operation();
  } finally {
    release();
  }
}
