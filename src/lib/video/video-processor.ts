import ffmpeg from "fluent-ffmpeg";
import ffmpegPath from "ffmpeg-static";
import { promises as fs } from "fs";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

// Function to find and set FFmpeg path with multiple fallbacks
async function setupFFmpegPath() {
  const possiblePaths = [
    "ffmpeg", // System PATH - try this first since we install via apk
    "/usr/bin/ffmpeg", // Common Linux path
    "/usr/local/bin/ffmpeg", // Another common Linux path
    ffmpegPath, // From ffmpeg-static package as fallback
  ];

  console.log("FFmpeg static path:", ffmpegPath);

  for (const pathToTry of possiblePaths) {
    if (!pathToTry) continue;
    
    try {
      // Test if ffmpeg is executable at this path
      const { stdout } = await execAsync(`"${pathToTry}" -version`);
      if (stdout.includes("ffmpeg version")) {
        console.log(`FFmpeg found at: ${pathToTry}`);
        ffmpeg.setFfmpegPath(pathToTry);
        return pathToTry;
      }
    } catch (error) {
      console.log(`FFmpeg not found at: ${pathToTry}`);
      continue;
    }
  }

  // If ffmpeg-static path exists but isn't executable, try to make it executable
  if (ffmpegPath) {
    try {
      await execAsync(`chmod +x "${ffmpegPath}"`);
      console.log(`Made FFmpeg executable: ${ffmpegPath}`);
      ffmpeg.setFfmpegPath(ffmpegPath);
      return ffmpegPath;
    } catch (error) {
      console.error("Failed to make FFmpeg executable:", error);
    }
  }

  throw new Error("FFmpeg not found in any of the expected locations");
}

// Initialize FFmpeg path on module load
let ffmpegReady = false;
setupFFmpegPath()
  .then((path) => {
    console.log(`FFmpeg setup successful: ${path}`);
    ffmpegReady = true;
  })
  .catch((error) => {
    console.error("FFmpeg setup failed:", error);
    ffmpegReady = false;
  });

export interface VideoMetadata {
  id: string;
  title: string;
  duration: number;
  resolution: string;
  fileSize: number;
  createdAt: string;
  hlsPath: string;
  status?: "processing" | "completed" | "failed";
  processingProgress?: number;
}

export interface ProcessingStatus {
  videoId: string;
  status: "processing" | "completed" | "failed";
  progress: number;
  title: string;
  startTime: string;
}

export class VideoProcessor {
  private static videosDir = path.join(process.cwd(), "public", "videos");
  private static hlsDir = path.join(process.cwd(), "public", "videos", "hls");
  private static processingStatusFile = path.join(
    process.cwd(),
    "temp",
    "processing-status.json"
  );

  static async checkFFmpegStatus(): Promise<{
    available: boolean;
    path: string | null;
    version: string | null;
    error?: string;
  }> {
    try {
      if (!ffmpegReady) {
        await setupFFmpegPath();
        ffmpegReady = true;
      }

      const currentPath = ffmpegPath || "ffmpeg";
      const { stdout } = await execAsync(`"${currentPath}" -version`);
      
      const versionMatch = stdout.match(/ffmpeg version ([^\s]+)/);
      const version = versionMatch ? versionMatch[1] : "unknown";

      return {
        available: true,
        path: currentPath,
        version,
      };
    } catch (error) {
      return {
        available: false,
        path: null,
        version: null,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  static async ensureDirectories() {
    await fs.mkdir(this.videosDir, { recursive: true });
    await fs.mkdir(this.hlsDir, { recursive: true });
    await fs.mkdir(path.join(process.cwd(), "temp"), { recursive: true });
  }

  static async processVideoToHLS(
    inputPath: string,
    videoId: string,
    title: string
  ): Promise<VideoMetadata> {
    await this.ensureDirectories();

    // Check if FFmpeg is ready
    if (!ffmpegReady) {
      console.log("FFmpeg not ready, attempting to setup again...");
      try {
        await setupFFmpegPath();
        ffmpegReady = true;
        console.log("FFmpeg setup successful on retry");
      } catch (error) {
        console.error("FFmpeg setup failed on retry:", error);
        await this.updateProcessingStatus(videoId, "failed", 0, title);
        throw new Error(`FFmpeg not available: ${error}`);
      }
    }

    // Initialize processing status
    await this.updateProcessingStatus(videoId, "processing", 0, title);

    const outputDir = path.join(this.hlsDir, videoId);
    await fs.mkdir(outputDir, { recursive: true });

    const playlistPath = path.join(outputDir, "playlist.m3u8");
    const segmentPattern = path.join(outputDir, "segment_%03d.ts");

    return new Promise((resolve, reject) => {
      let duration = 0;
      let resolution = "";
      let fileSize = 0;
      let lastProgressLog = 0; // Track last progress log time

      ffmpeg(inputPath)
        .inputOptions([
          "-avoid_negative_ts make_zero", // Fix timing issues with some containers
          "-fflags +genpts+discardcorrupt", // Handle corrupted frames better
          "-analyzeduration 100M", // Analyze more of the file to get better metadata
          "-probesize 100M", // Probe more of the file for format detection
        ])
        .outputOptions([
          "-c:v libx264",
          "-c:a aac",
          "-ac 2", // Force stereo audio
          "-ar 44100", // Force 44.1kHz sample rate
          "-b:a 128k", // Set audio bitrate
          "-profile:a aac_low", // Use AAC-LC profile for better compatibility
          "-f hls",
          "-hls_time 30", // Increased from 10 to 30 seconds for larger segments
          "-hls_list_size 0",
          "-hls_segment_filename",
          segmentPattern,
          "-preset fast",
          "-crf 23",
          "-profile:v baseline", // Use H.264 baseline profile for better compatibility
          "-level 3.0", // Set H.264 level for compatibility
          "-pix_fmt yuv420p", // Ensure compatible pixel format
          "-movflags +faststart", // Optimize for streaming
          "-max_muxing_queue_size 1024", // Handle complex files better
        ])
        .output(playlistPath)
        .on("start", (commandLine) => {
          console.log("FFmpeg process started:", commandLine);
          console.log("Input file:", inputPath);
        })
        .on("progress", async (progress) => {
          // Debug: log the full progress object to understand what's available
          console.log("Progress data:", {
            percent: progress.percent,
            frames: progress.frames,
            currentFps: progress.currentFps,
            currentKbps: progress.currentKbps,
            targetSize: progress.targetSize,
            timemark: progress.timemark,
          });

          // Update processing status
          let progressPercent = 0;
          if (progress.percent !== undefined && !isNaN(progress.percent)) {
            progressPercent = Math.round(progress.percent);
            console.log(`Processing: ${progressPercent}% done`);
          } else if (progress.frames) {
            // If percentage is unavailable, show frame count instead
            console.log(`Processing: ${progress.frames} frames processed`);
          } else if (progress.timemark) {
            // Show timemark if available
            console.log(`Processing: ${progress.timemark} processed`);
          } else {
            // Fallback: just show that processing is ongoing (but limit spam)
            if (!lastProgressLog || Date.now() - lastProgressLog > 5000) {
              console.log("Processing: video conversion in progress...");
              lastProgressLog = Date.now();
            }
          }

          // Update processing status with progress
          await this.updateProcessingStatus(
            videoId,
            "processing",
            progressPercent,
            title
          );
        })
        .on("codecData", (data) => {
          duration = this.parseFFmpegDuration(data.duration);
          // Extract resolution from video details if available
          if (data.video && typeof data.video === "string") {
            const resMatch = data.video.match(/(\d+)x(\d+)/);
            resolution = resMatch
              ? `${resMatch[1]}x${resMatch[2]}`
              : "1920x1080";
          } else {
            resolution = "1920x1080"; // default resolution
          }
        })
        .on("end", async () => {
          try {
            // Update status to completed
            await this.updateProcessingStatus(videoId, "completed", 100, title);

            // Get file size before cleaning up
            let fileSize = 0;
            try {
              const stats = await fs.stat(inputPath);
              fileSize = stats.size;
            } catch (error) {
              console.warn(
                `Could not get file size for ${inputPath}, using 0:`,
                error
              );
              fileSize = 0;
            }

            // Clean up original file safely (ignore if already deleted)
            try {
              await fs.unlink(inputPath);
              console.log(`Cleaned up input file: ${inputPath}`);
            } catch (error) {
              console.warn(
                `Input file already cleaned up or moved: ${inputPath}`
              );
            }

            // Clean up any temp files in the temp directory that match this video ID
            try {
              const tempDir = path.join(process.cwd(), "temp");
              const tempFiles = await fs.readdir(tempDir);
              for (const file of tempFiles) {
                if (file.includes(videoId) && file.endsWith('.mkv')) {
                  const tempFilePath = path.join(tempDir, file);
                  await fs.unlink(tempFilePath);
                  console.log(`Cleaned up temp file: ${tempFilePath}`);
                }
              }
            } catch (error) {
              console.warn("Error cleaning up temp files:", error);
            }

            const metadata: VideoMetadata = {
              id: videoId,
              title,
              duration,
              resolution,
              fileSize,
              createdAt: new Date().toISOString(),
              hlsPath: `/videos/hls/${videoId}/playlist.m3u8`,
              status: "completed",
              processingProgress: 100,
            };

            // Save metadata
            await this.saveVideoMetadata(metadata);

            resolve(metadata);
          } catch (error) {
            await this.updateProcessingStatus(videoId, "failed", 0, title);
            reject(error);
          }
        })
        .on("error", async (error) => {
          console.error("FFmpeg error:", error);
          await this.updateProcessingStatus(videoId, "failed", 0, title);
          reject(error);
        })
        .run();
    });
  }

  private static parseFFmpegDuration(duration: string): number {
    const parts = duration.split(":");
    const hours = parseFloat(parts[0]) || 0;
    const minutes = parseFloat(parts[1]) || 0;
    const seconds = parseFloat(parts[2]) || 0;
    return hours * 3600 + minutes * 60 + seconds;
  }

  static async saveVideoMetadata(metadata: VideoMetadata) {
    const metadataPath = path.join(this.videosDir, "metadata.json");

    let existingData: VideoMetadata[] = [];
    try {
      const data = await fs.readFile(metadataPath, "utf-8");
      existingData = JSON.parse(data);
    } catch {
      // File doesn't exist yet
    }

    existingData.push(metadata);
    await fs.writeFile(metadataPath, JSON.stringify(existingData, null, 2));
  }

  static async getVideoMetadata(): Promise<VideoMetadata[]> {
    const metadataPath = path.join(this.videosDir, "metadata.json");

    try {
      const data = await fs.readFile(metadataPath, "utf-8");
      const metadata = JSON.parse(data);
      
      // Validate that HLS files still exist and mark videos as available
      const validatedMetadata = await Promise.all(
        metadata.map(async (video: VideoMetadata) => {
          try {
            const hlsPath = path.join(process.cwd(), "public", video.hlsPath);
            await fs.access(hlsPath);
            return { ...video, status: "completed" as const };
          } catch {
            // Mark as failed if HLS files are missing
            return { ...video, status: "failed" as const };
          }
        })
      );
      
      return validatedMetadata;
    } catch {
      return [];
    }
  }

  static async deleteVideo(videoId: string): Promise<boolean> {
    try {
      // Remove HLS files
      const hlsDir = path.join(this.hlsDir, videoId);
      await fs.rmdir(hlsDir, { recursive: true });

      // Update metadata
      const metadata = await this.getVideoMetadata();
      const updatedMetadata = metadata.filter((video) => video.id !== videoId);

      const metadataPath = path.join(this.videosDir, "metadata.json");
      await fs.writeFile(
        metadataPath,
        JSON.stringify(updatedMetadata, null, 2)
      );

      // Remove from processing status if exists
      await this.removeProcessingStatus(videoId);

      return true;
    } catch (error) {
      console.error("Error deleting video:", error);
      return false;
    }
  }

  // Processing status management methods
  static async updateProcessingStatus(
    videoId: string,
    status: "processing" | "completed" | "failed",
    progress: number,
    title: string
  ): Promise<void> {
    try {
      let statusData: ProcessingStatus[] = [];

      try {
        const data = await fs.readFile(this.processingStatusFile, "utf-8");
        statusData = JSON.parse(data);
      } catch {
        // File doesn't exist yet
      }

      // Update existing or add new
      const existingIndex = statusData.findIndex(
        (item) => item.videoId === videoId
      );
      const statusItem: ProcessingStatus = {
        videoId,
        status,
        progress,
        title,
        startTime:
          existingIndex >= 0
            ? statusData[existingIndex].startTime
            : new Date().toISOString(),
      };

      if (existingIndex >= 0) {
        statusData[existingIndex] = statusItem;
      } else {
        statusData.push(statusItem);
      }

      // Clean up completed/failed items older than 24 hours
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      statusData = statusData.filter((item) => {
        if (item.status === "processing") return true;
        return new Date(item.startTime) > oneDayAgo;
      });

      await fs.writeFile(
        this.processingStatusFile,
        JSON.stringify(statusData, null, 2)
      );
    } catch (error) {
      console.error("Error updating processing status:", error);
    }
  }

  static async getProcessingStatus(): Promise<ProcessingStatus[]> {
    try {
      const data = await fs.readFile(this.processingStatusFile, "utf-8");
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  static async removeProcessingStatus(videoId: string): Promise<void> {
    try {
      const statusData = await this.getProcessingStatus();
      const filteredData = statusData.filter(
        (item) => item.videoId !== videoId
      );
      await fs.writeFile(
        this.processingStatusFile,
        JSON.stringify(filteredData, null, 2)
      );
    } catch (error) {
      console.error("Error removing processing status:", error);
    }
  }
}
