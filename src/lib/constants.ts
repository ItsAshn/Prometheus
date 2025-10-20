/**
 * Centralized configuration constants for the Prometheus application
 * All magic numbers and configuration values should be defined here
 */

export const CONFIG = {
  /**
   * Video upload and processing configuration
   */
  VIDEO: {
    /**
     * Maximum file size for video uploads (in GB)
     */
    MAX_SIZE_GB: 2,
    
    /**
     * Maximum file size for video uploads (in bytes)
     */
    MAX_SIZE_BYTES: 2 * 1024 * 1024 * 1024, // 2GB
    
    /**
     * HLS segment duration (in seconds)
     */
    SEGMENT_DURATION: 2,
    
    /**
     * Number of videos to display on home page
     */
    HOME_PAGE_COUNT: 6,
    
    /**
     * Allowed video file extensions
     */
    ALLOWED_EXTENSIONS: ['mp4', 'avi', 'mov', 'mkv', 'webm'] as const,
    
    /**
     * Allowed video MIME types
     */
    ALLOWED_MIME_TYPES: [
      'video/mp4',
      'video/avi',
      'video/x-msvideo',
      'video/quicktime',
      'video/mov',
      'video/x-matroska',
      'video/mkv',
      'video/webm',
    ] as const,
    
    /**
     * Allowed thumbnail formats
     */
    THUMBNAIL_FORMATS: ['jpg', 'jpeg', 'png', 'webp'] as const,
  },

  /**
   * Authentication configuration
   */
  AUTH: {
    /**
     * JWT token expiry duration
     */
    JWT_EXPIRY: '24h',
    
    /**
     * JWT token expiry in milliseconds
     */
    JWT_EXPIRY_MS: 24 * 60 * 60 * 1000, // 24 hours
    
    /**
     * Cookie name for admin authentication
     */
    COOKIE_NAME: 'admin-auth-token',
    
    /**
     * Minimum password length
     */
    MIN_PASSWORD_LENGTH: 8,
    
    /**
     * Minimum JWT secret length
     */
    MIN_JWT_SECRET_LENGTH: 32,
    
    /**
     * Bcrypt salt rounds
     */
    SALT_ROUNDS: 12,
  },

  /**
   * FFmpeg and video processing configuration
   */
  FFMPEG: {
    /**
     * Threshold for large segment size (in bytes)
     * Segments larger than this should trigger reprocessing
     */
    LARGE_SEGMENT_THRESHOLD: 5 * 1024 * 1024, // 5MB
    
    /**
     * Maximum percentage of large segments allowed
     */
    MAX_LARGE_SEGMENT_PERCENTAGE: 0.3, // 30%
    
    /**
     * FFmpeg preset for encoding
     */
    ENCODING_PRESET: 'faster',
    
    /**
     * CRF value for video quality
     */
    CRF_VALUE: 23,
    
    /**
     * Frame rate for output videos
     */
    FRAME_RATE: 30,
    
    /**
     * Keyframe interval (in frames)
     */
    KEYFRAME_INTERVAL: 60,
  },

  /**
   * File paths and directories
   */
  PATHS: {
    /**
     * Public videos directory
     */
    VIDEOS_DIR: 'public/videos',
    
    /**
     * HLS output directory
     */
    HLS_DIR: 'public/videos/hls',
    
    /**
     * Thumbnails directory
     */
    THUMBNAILS_DIR: 'public/videos/thumbnails',
    
    /**
     * Temporary uploads directory
     */
    TEMP_DIR: 'temp',
    
    /**
     * Site configuration file
     */
    SITE_CONFIG_FILE: 'temp/site-config.json',
    
    /**
     * Processing status file
     */
    PROCESSING_STATUS_FILE: 'temp/processing-status.json',
    
    /**
     * Video metadata file
     */
    VIDEO_METADATA_FILE: 'public/videos/metadata.json',
  },

  /**
   * Quality levels for adaptive streaming
   */
  QUALITY_LEVELS: [
    { 
      name: '2160p', 
      width: 3840, 
      height: 2160, 
      bitrate: '8000k', 
      audioBitrate: '192k' 
    },
    { 
      name: '1440p', 
      width: 2560, 
      height: 1440, 
      bitrate: '6000k', 
      audioBitrate: '192k' 
    },
    { 
      name: '1080p', 
      width: 1920, 
      height: 1080, 
      bitrate: '4000k', 
      audioBitrate: '128k' 
    },
    { 
      name: '720p', 
      width: 1280, 
      height: 720, 
      bitrate: '2500k', 
      audioBitrate: '128k' 
    },
    { 
      name: '480p', 
      width: 854, 
      height: 480, 
      bitrate: '1200k', 
      audioBitrate: '96k' 
    },
    { 
      name: '360p', 
      width: 640, 
      height: 360, 
      bitrate: '800k', 
      audioBitrate: '96k' 
    },
  ] as const,

  /**
   * Default values
   */
  DEFAULTS: {
    /**
     * Default channel name
     */
    CHANNEL_NAME: 'My Video Channel',
    
    /**
     * Default channel description
     */
    CHANNEL_DESCRIPTION: 'Welcome to my self-hosted video streaming platform. Here you can find all my videos and content.',
    
    /**
     * Default about text
     */
    ABOUT_TEXT: 'Welcome to my channel! This is a self-hosted video streaming platform where I share my content. All videos are hosted on my own infrastructure, ensuring complete privacy and control.',
    
    /**
     * Default theme
     */
    DEFAULT_THEME: 'modern',
    
    /**
     * Default admin username
     */
    ADMIN_USERNAME: 'admin',
    
    /**
     * Default admin password (should be changed!)
     */
    ADMIN_PASSWORD: 'changeme123',
  },

  /**
   * UI Configuration
   */
  UI: {
    /**
     * Processing status cleanup age (in milliseconds)
     */
    PROCESSING_CLEANUP_AGE: 24 * 60 * 60 * 1000, // 24 hours
    
    /**
     * Polling interval for processing status (in ms)
     */
    PROCESSING_POLL_INTERVAL: 2000, // 2 seconds
    
    /**
     * Maximum number of results to display
     */
    MAX_DISPLAY_RESULTS: 100,
  },

  /**
   * Validation
   */
  VALIDATION: {
    /**
     * Maximum title length
     */
    MAX_TITLE_LENGTH: 200,
    
    /**
     * Minimum title length
     */
    MIN_TITLE_LENGTH: 1,
    
    /**
     * Maximum description length
     */
    MAX_DESCRIPTION_LENGTH: 2000,
  },
} as const;

/**
 * Helper function to format file size in bytes to human-readable format
 */
export function formatBytes(bytes: number): string {
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  if (bytes === 0) return '0 Bytes';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Helper function to format duration in seconds to HH:MM:SS or MM:SS
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}
