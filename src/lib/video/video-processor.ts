import ffmpeg from "fluent-ffmpeg";
import ffmpegPath from "ffmpeg-static";
import { promises as fs } from "fs";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";
import { CONFIG } from "../constants";

const execAsync = promisify(exec);

// Function to find and set FFmpeg and FFprobe paths with multiple fallbacks
async function setupFFmpegPath() {
  // Setup FFmpeg
  const possibleFFmpegPaths = [
    "ffmpeg", // System PATH - try this first since we install via apk
    "/usr/bin/ffmpeg", // Common Linux path
    "/usr/local/bin/ffmpeg", // Another common Linux path
    ffmpegPath, // From ffmpeg-static package as fallback
  ];

  let ffmpegFound = false;
  for (const pathToTry of possibleFFmpegPaths) {
    if (!pathToTry) continue;
    
    try {
      // Test if ffmpeg is executable at this path
      const { stdout } = await execAsync(`"${pathToTry}" -version`);
      if (stdout.includes("ffmpeg version")) {
        ffmpeg.setFfmpegPath(pathToTry);
        console.log(`FFmpeg found at: ${pathToTry}`);
        ffmpegFound = true;
        break;
      }
    } catch (error) {
      continue;
    }
  }

  if (!ffmpegFound) {
    // If ffmpeg-static path exists but isn't executable, try to make it executable
    if (ffmpegPath) {
      try {
        await execAsync(`chmod +x "${ffmpegPath}"`);
        ffmpeg.setFfmpegPath(ffmpegPath);
        console.log(`FFmpeg made executable at: ${ffmpegPath}`);
        ffmpegFound = true;
      } catch (error) {
        console.error("Failed to make FFmpeg executable:", error);
      }
    }
  }

  // Setup FFprobe - it's usually in the same location as ffmpeg
  const possibleFFprobePaths = [
    "ffprobe", // System PATH - try this first since we install via apk
    "/usr/bin/ffprobe", // Common Linux path
    "/usr/local/bin/ffprobe", // Another common Linux path
  ];

  let ffprobeFound = false;
  for (const pathToTry of possibleFFprobePaths) {
    if (!pathToTry) continue;
    
    try {
      // Test if ffprobe is executable at this path
      const { stdout } = await execAsync(`"${pathToTry}" -version`);
      if (stdout.includes("ffprobe version")) {
        ffmpeg.setFfprobePath(pathToTry);
        console.log(`FFprobe found at: ${pathToTry}`);
        ffprobeFound = true;
        break;
      }
    } catch (error) {
      continue;
    }
  }

  if (!ffmpegFound) {
    throw new Error("FFmpeg not found in any of the expected locations");
  }

  if (!ffprobeFound) {
    console.warn("FFprobe not found - some features may be limited");
  }

  return ffmpegFound && ffprobeFound;
}

// Initialize FFmpeg path on module load
let ffmpegReady = false;
setupFFmpegPath()
  .then((path) => {
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
  thumbnail?: string;
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
  private static videosDir = path.join(process.cwd(), CONFIG.PATHS.VIDEOS_DIR);
  private static hlsDir = path.join(process.cwd(), CONFIG.PATHS.HLS_DIR);
  private static thumbnailsDir = path.join(process.cwd(), CONFIG.PATHS.THUMBNAILS_DIR);
  private static processingStatusFile = path.join(
    process.cwd(),
    CONFIG.PATHS.PROCESSING_STATUS_FILE
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
      const version = versionMatch?.[1] ?? "unknown";

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
    await fs.mkdir(this.thumbnailsDir, { recursive: true });
    await fs.mkdir(path.join(process.cwd(), "temp"), { recursive: true });
  }

  static async generateThumbnail(
    inputPath: string,
    videoId: string
  ): Promise<string> {
    await this.ensureDirectories();

    if (!ffmpegReady) {
      console.log("FFmpeg not ready for thumbnail generation, attempting setup...");
      try {
        await setupFFmpegPath();
        ffmpegReady = true;
      } catch (error) {
        console.error("FFmpeg setup failed for thumbnail generation:", error);
        throw new Error(`FFmpeg not available: ${error}`);
      }
    }

    const thumbnailPath = path.join(this.thumbnailsDir, `${videoId}.jpg`);

    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .screenshots({
          timestamps: ['10%'], // Capture at 10% of video duration
          filename: `${videoId}.jpg`,
          folder: this.thumbnailsDir,
          size: '1920x1080', // Support full HD thumbnails
        })
        .on('end', () => {
          console.log(`Thumbnail generated: ${thumbnailPath}`);
          resolve(`/videos/thumbnails/${videoId}.jpg`);
        })
        .on('error', (error) => {
          console.error('Thumbnail generation error:', error);
          reject(error);
        });
    });
  }

  static async saveThumbnail(
    thumbnailFile: File,
    videoId: string
  ): Promise<string> {
    await this.ensureDirectories();

    const fileExtension = thumbnailFile.name.toLowerCase().split('.').pop();
    const allowedExtensions = CONFIG.VIDEO.THUMBNAIL_FORMATS;

    if (!fileExtension || !allowedExtensions.includes(fileExtension as any)) {
      throw new Error(`Invalid thumbnail format. Use ${allowedExtensions.join(', ')}`);
    }

    const thumbnailPath = path.join(this.thumbnailsDir, `${videoId}.${fileExtension}`);
    const arrayBuffer = await thumbnailFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    await fs.writeFile(thumbnailPath, buffer);
    
    return `/videos/thumbnails/${videoId}.${fileExtension}`;
  }

  static async processVideoToHLS(
    inputPath: string,
    videoId: string,
    title: string,
    customThumbnail?: string
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

    // Generate or use custom thumbnail
    let thumbnailPath = customThumbnail;
    if (!thumbnailPath) {
      try {
        console.log("Generating thumbnail from video...");
        thumbnailPath = await this.generateThumbnail(inputPath, videoId);
        console.log("Thumbnail generated successfully:", thumbnailPath);
      } catch (error) {
        console.warn("Failed to generate thumbnail, continuing without:", error);
        thumbnailPath = undefined;
      }
    }

    const outputDir = path.join(this.hlsDir, videoId);
    await fs.mkdir(outputDir, { recursive: true });

    const masterPlaylistPath = path.join(outputDir, "playlist.m3u8");
    
    // Get video metadata first to determine appropriate quality levels
    const videoInfo = await this.getVideoInfo(inputPath);
    const sourceWidth = videoInfo.width || 1920;
    const sourceHeight = videoInfo.height || 1080;
    
    // Define quality levels based on source resolution
    const qualityLevels = this.determineQualityLevels(sourceWidth, sourceHeight);
    
    console.log(`Source resolution: ${sourceWidth}x${sourceHeight}`);
    console.log(`Generating ${qualityLevels.length} quality levels:`, qualityLevels.map(q => q?.name ?? "unknown"));

    // Process each quality level
    const processingPromises = qualityLevels
      .map((quality, index) => {
        if (!quality) return null;
        return this.processQualityLevel(
          inputPath,
          outputDir,
          quality,
          index,
          qualityLevels.length,
          videoId,
          title
        );
      })
      .filter((p): p is Promise<void> => p !== null);

    try {
      await Promise.all(processingPromises);
      
      // Generate master playlist (filter out any undefined entries)
      const filteredQualityLevels = qualityLevels.filter((q) => q !== undefined) as Array<{
        name: string;
        width: number;
        height: number;
        bitrate: string;
        audioBitrate: string;
      }>;
      await this.generateMasterPlaylist(
        masterPlaylistPath,
        filteredQualityLevels
      );
      
      console.log("All quality levels processed successfully");
    } catch (error) {
      console.error("Error processing quality levels:", error);
      await this.updateProcessingStatus(videoId, "failed", 0, title);
      throw error;
    }

    // Get file size
    let fileSize = 0;
    try {
      const stats = await fs.stat(inputPath);
      fileSize = stats.size;
    } catch (error) {
      console.warn(`Could not get file size for ${inputPath}:`, error);
    }

    // Update status to completed
    await this.updateProcessingStatus(videoId, "completed", 100, title);

    // Clean up original file
    try {
      await fs.unlink(inputPath);
      console.log(`Cleaned up input file: ${inputPath}`);
    } catch (error) {
      console.warn(`Input file already cleaned up: ${inputPath}`);
    }

    const metadata: VideoMetadata = {
      id: videoId,
      title,
      duration: videoInfo.duration || 0,
      resolution: `${sourceWidth}x${sourceHeight}`,
      fileSize,
      createdAt: new Date().toISOString(),
      hlsPath: `/videos/hls/${videoId}/playlist.m3u8`,
      thumbnail: thumbnailPath,
      status: "completed",
      processingProgress: 100,
    };

    await this.saveVideoMetadata(metadata);
    return metadata;
  }

  private static determineQualityLevels(sourceWidth: number, sourceHeight: number) {
    const levels = [];
    
    // Only include quality levels at or below source resolution
    for (const level of CONFIG.QUALITY_LEVELS) {
      if (level.width <= sourceWidth && level.height <= sourceHeight) {
        levels.push(level);
      }
    }
    
    // Always include at least 360p as minimum quality
    if (levels.length === 0) {
      levels.push(CONFIG.QUALITY_LEVELS[CONFIG.QUALITY_LEVELS.length - 1]); // 360p
    }
    
    return levels;
  }

  private static async getVideoInfo(inputPath: string): Promise<{
    width?: number;
    height?: number;
    duration?: number;
  }> {
    return new Promise((resolve) => {
      ffmpeg.ffprobe(inputPath, (err, metadata) => {
        if (err) {
          console.error("FFprobe error:", err);
          console.warn("Could not probe video, using default values");
          // Return default values instead of rejecting
          resolve({
            width: 1920,
            height: 1080,
            duration: 0,
          });
          return;
        }
        
        const videoStream = metadata.streams.find(s => s.codec_type === 'video');
        
        if (!videoStream) {
          console.warn("No video stream found, using default values");
          resolve({
            width: 1920,
            height: 1080,
            duration: metadata.format.duration || 0,
          });
          return;
        }
        
        resolve({
          width: videoStream.width || 1920,
          height: videoStream.height || 1080,
          duration: metadata.format.duration || 0,
        });
      });
    });
  }

  private static async processQualityLevel(
    inputPath: string,
    outputDir: string,
    quality: { name: string; width: number; height: number; bitrate: string; audioBitrate: string },
    index: number,
    total: number,
    videoId: string,
    title: string
  ): Promise<void> {
    const qualityDir = path.join(outputDir, quality.name);
    await fs.mkdir(qualityDir, { recursive: true });

    const playlistPath = path.join(qualityDir, "playlist.m3u8");
    const segmentPattern = path.join(qualityDir, "segment_%03d.ts");

    return new Promise((resolve, reject) => {
      console.log(`Processing ${quality.name} (${index + 1}/${total})...`);

      ffmpeg(inputPath)
        .inputOptions([
          "-fflags +genpts",
          "-analyzeduration 100M",
          "-probesize 100M",
        ])
        .outputOptions([
          // Video encoding
          "-c:v libx264",
          `-preset ${CONFIG.FFMPEG.ENCODING_PRESET}`,
          `-crf ${CONFIG.FFMPEG.CRF_VALUE}`,
          "-profile:v main",
          "-level 4.0",
          "-pix_fmt yuv420p",
          `-maxrate ${quality.bitrate}`,
          `-bufsize ${parseInt(quality.bitrate) * 2}k`,
          `-vf scale=${quality.width}:${quality.height}:force_original_aspect_ratio=decrease,pad=${quality.width}:${quality.height}:(ow-iw)/2:(oh-ih)/2`,
          
          // Audio encoding
          "-c:a aac",
          "-ac 2",
          "-ar 48000",
          `-b:a ${quality.audioBitrate}`,
          "-profile:a aac_low",
          
          // HLS settings
          "-f hls",
          `-hls_time ${CONFIG.VIDEO.SEGMENT_DURATION}`,
          "-hls_list_size 0",
          "-hls_segment_filename", segmentPattern,
          `-g ${CONFIG.FFMPEG.KEYFRAME_INTERVAL}`,
          `-keyint_min ${CONFIG.FFMPEG.KEYFRAME_INTERVAL}`,
          "-sc_threshold 0",
          `-force_key_frames expr:gte(t,n_forced*${CONFIG.VIDEO.SEGMENT_DURATION})`,
          "-avoid_negative_ts make_zero",
          "-vsync cfr",
          `-r ${CONFIG.FFMPEG.FRAME_RATE}`,
          "-hls_flags independent_segments+program_date_time",
          "-max_muxing_queue_size 1024",
          "-threads 0",
        ])
        .output(playlistPath)
        .on("start", (commandLine) => {
          console.log(`FFmpeg ${quality.name}:`, commandLine.substring(0, 200));
        })
        .on("progress", async (progress) => {
          if (progress.percent && !isNaN(progress.percent)) {
            const overallProgress = ((index + progress.percent / 100) / total) * 100;
            await this.updateProcessingStatus(
              videoId,
              "processing",
              Math.round(overallProgress),
              title
            );
          }
        })
        .on("end", () => {
          console.log(`✅ ${quality.name} completed`);
          resolve();
        })
        .on("error", (error) => {
          console.error(`❌ ${quality.name} failed:`, error);
          reject(error);
        })
        .run();
    });
  }

  private static async generateMasterPlaylist(
    masterPath: string,
    qualityLevels: Array<{ name: string; width: number; height: number; bitrate: string; audioBitrate: string }>
  ): Promise<void> {
    let masterContent = "#EXTM3U\n#EXT-X-VERSION:3\n\n";
    
    for (const quality of qualityLevels) {
      const bandwidth = parseInt(quality.bitrate) * 1000 + parseInt(quality.audioBitrate) * 1000;
      masterContent += `#EXT-X-STREAM-INF:BANDWIDTH=${bandwidth},RESOLUTION=${quality.width}x${quality.height},NAME="${quality.name}"\n`;
      masterContent += `${quality.name}/playlist.m3u8\n\n`;
    }
    
    await fs.writeFile(masterPath, masterContent);
    console.log("Master playlist generated:", masterPath);
  }

  private static parseFFmpegDuration(duration: string): number {
    const parts = duration.split(":");
    const [hoursStr = "0", minutesStr = "0", secondsStr = "0"] = parts;
    const hours = parseFloat(hoursStr) || 0;
    const minutes = parseFloat(minutesStr) || 0;
    const seconds = parseFloat(secondsStr) || 0;
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
      await fs.rm(hlsDir, { recursive: true, force: true });

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
            ? (statusData[existingIndex]?.startTime ?? new Date().toISOString())
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

  // Check if a video needs re-processing due to large segments
  static async analyzeVideoSegments(videoId: string): Promise<{
    needsReprocessing: boolean;
    averageSegmentSize: number;
    largeSegmentCount: number;
    totalSegments: number;
    recommendation: string;
  }> {
    try {
      const hlsDir = path.join(this.hlsDir, videoId);
      const files = await fs.readdir(hlsDir);
      const segmentFiles = files.filter(file => file.endsWith('.ts'));
      
      let totalSize = 0;
      let largeSegmentCount = 0;
      const LARGE_SEGMENT_THRESHOLD = CONFIG.FFMPEG.LARGE_SEGMENT_THRESHOLD;
      
      for (const file of segmentFiles) {
        const filePath = path.join(hlsDir, file);
        const stats = await fs.stat(filePath);
        totalSize += stats.size;
        
        if (stats.size > LARGE_SEGMENT_THRESHOLD) {
          largeSegmentCount++;
          console.log(`Large segment detected: ${file} (${Math.round(stats.size / 1024 / 1024 * 100) / 100}MB)`);
        }
      }
      
      const averageSegmentSize = totalSize / segmentFiles.length;
      const averageSegmentSizeMB = Math.round(averageSegmentSize / 1024 / 1024 * 100) / 100;
      const needsReprocessing = averageSegmentSize > LARGE_SEGMENT_THRESHOLD || 
        largeSegmentCount > segmentFiles.length * CONFIG.FFMPEG.MAX_LARGE_SEGMENT_PERCENTAGE;
      
      let recommendation = "";
      if (needsReprocessing) {
        if (averageSegmentSizeMB > 10) {
          recommendation = "URGENT: Average segment size is very large, causing timeout issues. Re-process immediately with smaller segments.";
        } else if (largeSegmentCount > segmentFiles.length * 0.5) {
          recommendation = "HIGH: Many large segments detected. Re-processing recommended for better streaming performance.";
        } else {
          recommendation = "MEDIUM: Some large segments detected. Consider re-processing for optimal performance.";
        }
      } else {
        recommendation = "OK: Segment sizes are optimal for streaming.";
      }
      
      return {
        needsReprocessing,
        averageSegmentSize: averageSegmentSizeMB,
        largeSegmentCount,
        totalSegments: segmentFiles.length,
        recommendation
      };
    } catch (error) {
      console.error("Error analyzing video segments:", error);
      return {
        needsReprocessing: false,
        averageSegmentSize: 0,
        largeSegmentCount: 0,
        totalSegments: 0,
        recommendation: "Error: Could not analyze segments"
      };
    }
  }
}
