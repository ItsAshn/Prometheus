import ffmpeg from "fluent-ffmpeg";
import ffmpegPath from "ffmpeg-static";
import { promises as fs } from "fs";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";

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

<<<<<<< Updated upstream
=======
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
    const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp'];

    if (!fileExtension || !allowedExtensions.includes(fileExtension)) {
      throw new Error('Invalid thumbnail format. Use JPG, PNG, or WebP');
    }

    const thumbnailPath = path.join(this.thumbnailsDir, `${videoId}.${fileExtension}`);
    const arrayBuffer = await thumbnailFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    await fs.writeFile(thumbnailPath, buffer);
    
    return `/videos/thumbnails/${videoId}.${fileExtension}`;
  }

>>>>>>> Stashed changes
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

    const masterPlaylistPath = path.join(outputDir, "playlist.m3u8");
    
    // Get video metadata first to determine appropriate quality levels
    const videoInfo = await this.getVideoInfo(inputPath);
    const sourceWidth = videoInfo.width || 1920;
    const sourceHeight = videoInfo.height || 1080;
    
    // Define quality levels based on source resolution
    const qualityLevels = this.determineQualityLevels(sourceWidth, sourceHeight);
    
    console.log(`Source resolution: ${sourceWidth}x${sourceHeight}`);
    console.log(`Generating ${qualityLevels.length} quality levels:`, qualityLevels.map(q => q.name));

    // Process each quality level
    const processingPromises = qualityLevels.map((quality, index) => {
      return this.processQualityLevel(
        inputPath,
        outputDir,
        quality,
        index,
        qualityLevels.length,
        videoId,
        title
      );
    });

    try {
      await Promise.all(processingPromises);
      
      // Generate master playlist
      await this.generateMasterPlaylist(masterPlaylistPath, qualityLevels);
      
      console.log("All quality levels processed successfully");
    } catch (error) {
      console.error("Error processing quality levels:", error);
      throw error;
    }

    return new Promise((resolve, reject) => {
      // Get final metadata after processing
      this.getVideoInfo(inputPath)
        .then(async (info) => {
          let duration = info.duration || 0;
          let resolution = `${sourceWidth}x${sourceHeight}`;
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
            duration,
            resolution,
            fileSize,
            createdAt: new Date().toISOString(),
            hlsPath: `/videos/hls/${videoId}/playlist.m3u8`,
            thumbnail: thumbnailPath,
            status: "completed",
            processingProgress: 100,
          };

          await this.saveVideoMetadata(metadata);
          resolve(metadata);
        })
        .catch(async (error) => {
          await this.updateProcessingStatus(videoId, "failed", 0, title);
          reject(error);
        });
    });
  }

  private static determineQualityLevels(sourceWidth: number, sourceHeight: number) {
    const levels = [];
    
    // Define all possible quality levels
    const allLevels = [
      { name: "2160p", width: 3840, height: 2160, bitrate: "8000k", audioBitrate: "192k" },
      { name: "1440p", width: 2560, height: 1440, bitrate: "6000k", audioBitrate: "192k" },
      { name: "1080p", width: 1920, height: 1080, bitrate: "4000k", audioBitrate: "128k" },
      { name: "720p", width: 1280, height: 720, bitrate: "2500k", audioBitrate: "128k" },
      { name: "480p", width: 854, height: 480, bitrate: "1200k", audioBitrate: "96k" },
      { name: "360p", width: 640, height: 360, bitrate: "800k", audioBitrate: "96k" },
    ];
    
    // Only include quality levels at or below source resolution
    for (const level of allLevels) {
      if (level.width <= sourceWidth && level.height <= sourceHeight) {
        levels.push(level);
      }
    }
    
    // Always include at least 360p as minimum quality
    if (levels.length === 0) {
      levels.push(allLevels[allLevels.length - 1]); // 360p
    }
    
    return levels;
  }

  private static async getVideoInfo(inputPath: string): Promise<{
    width?: number;
    height?: number;
    duration?: number;
  }> {
    return new Promise((resolve, reject) => {
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
<<<<<<< Updated upstream
          // Video encoding settings
          "-c:v libx264",
          "-preset medium", // Better compression than 'fast'
          "-crf 25", // Slightly higher CRF for smaller files (was 23)
          "-profile:v main", // Use main profile instead of baseline for better quality
          "-level 4.0", // Higher level for better compatibility
          "-pix_fmt yuv420p", // Ensure compatible pixel format
          "-maxrate 5000k", // Limit bitrate to 5Mbps for smaller segments
          "-bufsize 10000k", // Buffer size for rate control
=======
          // Video encoding
          "-c:v libx264",
          "-preset faster",
          "-crf 23",
          "-profile:v main",
          "-level 4.0",
          "-pix_fmt yuv420p",
          `-maxrate ${quality.bitrate}`,
          `-bufsize ${parseInt(quality.bitrate) * 2}k`,
          `-vf scale=${quality.width}:${quality.height}:force_original_aspect_ratio=decrease,pad=${quality.width}:${quality.height}:(ow-iw)/2:(oh-ih)/2`,
>>>>>>> Stashed changes
          
          // Audio encoding
          "-c:a aac",
<<<<<<< Updated upstream
          "-ac 2", // Force stereo audio
          "-ar 48000", // Use 48kHz sample rate (more standard for video)
          "-b:a 128k", // Set audio bitrate
          "-profile:a aac_low", // Use AAC-LC profile for better compatibility
          
          // HLS-specific settings
          "-f hls",
          "-hls_time 4", // 4-second segments for better streaming and smaller file sizes
          "-hls_list_size 0", // Keep all segments in playlist
          "-hls_segment_filename", segmentPattern,
          
          // Key frame and GOP settings for better HLS compatibility
          "-g 60", // Set GOP size to 60 frames (2 seconds at 30fps)
          "-keyint_min 60", // Minimum keyframe interval
          "-sc_threshold 0", // Disable scene change detection to ensure regular keyframes
          
          // Timing and synchronization improvements
          "-avoid_negative_ts make_zero", // Fix negative timestamps
          "-vsync cfr", // Use constant frame rate
          "-r 30", // Force 30fps output for consistency
          
          // Additional HLS flags for better compatibility
=======
          "-ac 2",
          "-ar 48000",
          `-b:a ${quality.audioBitrate}`,
          "-profile:a aac_low",
          
          // HLS settings
          "-f hls",
          "-hls_time 2",
          "-hls_list_size 0",
          "-hls_segment_filename", segmentPattern,
          "-g 60",
          "-keyint_min 60",
          "-sc_threshold 0",
          "-force_key_frames expr:gte(t,n_forced*2)",
          "-avoid_negative_ts make_zero",
          "-vsync cfr",
          "-r 30",
>>>>>>> Stashed changes
          "-hls_flags independent_segments+program_date_time",
          "-max_muxing_queue_size 1024",
          "-threads 0",
        ])
        .output(playlistPath)
        .on("start", (commandLine) => {
          console.log(`FFmpeg ${quality.name}:`, commandLine.substring(0, 200));
        })
        .on("progress", async (progress) => {
<<<<<<< Updated upstream
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
=======
          if (progress.percent && !isNaN(progress.percent)) {
            const overallProgress = ((index + progress.percent / 100) / total) * 100;
            await this.updateProcessingStatus(
              videoId,
              "processing",
              Math.round(overallProgress),
              title
            );
>>>>>>> Stashed changes
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
      const LARGE_SEGMENT_THRESHOLD = 5 * 1024 * 1024; // 5MB threshold
      
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
      const needsReprocessing = averageSegmentSize > LARGE_SEGMENT_THRESHOLD || largeSegmentCount > segmentFiles.length * 0.3;
      
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
