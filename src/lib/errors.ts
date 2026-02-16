/**
 * User-friendly error messages and utilities for the Prometheus application
 * Provides clear, actionable feedback for common error scenarios
 */

export class Errors {
  static validationError(field: string, message: string): Error {
    return new Error(`Validation error: ${field} ${message}`);
  }

  static missingField(field: string): Error {
    return new Error(`Missing required field: ${field}`);
  }

  static videoInvalidFormat(allowedExtensions: readonly string[]): Error {
    return new Error(
      `Invalid video format. Allowed formats: ${allowedExtensions.join(", ")}`
    );
  }

  static videoTooLarge(size: number, maxSizeGB: number): Error {
    const sizeMB = Math.round(size / 1024 / 1024);
    return new Error(
      `Video file too large (${sizeMB}MB). Maximum size is ${maxSizeGB}GB`
    );
  }
}

/**
 * User-friendly error messages
 */
export const ErrorMessages = {
  // Authentication errors
  AUTH: {
    INVALID_CREDENTIALS: "Invalid username or password. Please check your credentials and try again.",
    REQUIRED: "You must be logged in to perform this action.",
    TOKEN_EXPIRED: "Your session has expired. Please log in again to continue.",
    TOKEN_INVALID: "Authentication failed. Please log in again.",
    RATE_LIMIT: "Too many login attempts. Please wait 15 minutes before trying again.",
  },

  // Upload errors
  UPLOAD: {
    FILE_REQUIRED: "Please select a video file to upload.",
    TITLE_REQUIRED: "Please enter a title for your video.",
    FILE_TOO_LARGE: (sizeGB: number, limitGB: number) =>
      `Your video (${sizeGB.toFixed(2)} GB) exceeds the ${limitGB}GB limit. Try compressing the video or splitting it into smaller files.`,
    INVALID_FORMAT: (allowedFormats: string[]) =>
      `This video format is not supported. Please use one of these formats: ${allowedFormats.map(f => f.toUpperCase()).join(", ")}.`,
    PARSE_FAILED: "Unable to read the video file. The file may be corrupted, incomplete, or in an unsupported format.",
    RATE_LIMIT: "You've reached the upload limit (10 per hour). Please try again later.",
    DISK_FULL: (availableGB: number) =>
      `Not enough disk space available to upload this file. Only ${availableGB.toFixed(2)} GB free.`,
    CHUNK_FAILED: "Failed to upload part of your video. Please check your connection and try again.",
    ASSEMBLY_FAILED: "Failed to combine video chunks. Please try uploading the file again.",
  },

  // Video processing errors
  PROCESSING: {
    FAILED: (reason?: string) =>
      reason
        ? `Video processing failed: ${reason}. Try converting the video to MP4 format first.`
        : "Video processing failed. The video format may not be compatible. Try using MP4 format.",
    FFMPEG_NOT_FOUND: "Video processing tools are not available on the server. Please contact the administrator.",
    INVALID_VIDEO: "This file doesn't appear to be a valid video. Please verify the file and try again.",
    TIMEOUT: "Video processing is taking longer than expected. Large videos may take several minutes. Please check back later.",
    ALREADY_PROCESSING: "This video is already being processed. Please wait for it to complete.",
  },

  // Video management errors
  VIDEO: {
    NOT_FOUND: "Video not found. It may have been deleted or the link is incorrect.",
    ALREADY_EXISTS: "A video with this ID already exists.",
    DELETE_FAILED: "Failed to delete the video. Please try again or contact the administrator.",
    UPDATE_FAILED: "Failed to update video information. Please try again.",
  },

  // File system errors
  FILESYSTEM: {
    READ_FAILED: "Failed to read file from disk. The file may have been deleted or moved.",
    WRITE_FAILED: "Failed to save file to disk. The disk may be full or permissions may be insufficient.",
    DELETE_FAILED: "Failed to delete file. It may still be in use by another process.",
    CREATE_DIR_FAILED: "Failed to create directory. Please check disk space and permissions.",
    PERMISSIONS: "Insufficient permissions to perform this operation. Please ensure the application has proper file system access.",
  },

  // Configuration errors
  CONFIG: {
    LOAD_FAILED: "Failed to load configuration. Using default settings instead.",
    SAVE_FAILED: "Failed to save configuration changes. Please verify disk space and try again.",
    INVALID: "Invalid configuration values. Please check your settings and try again.",
  },

  // General errors
  GENERAL: {
    SERVER_ERROR: "Something went wrong on our end. Please try again in a moment. If the problem persists, contact the administrator.",
    BAD_REQUEST: "Invalid request. Please check your input and try again.",
    NOT_FOUND: "The requested resource was not found.",
    METHOD_NOT_ALLOWED: "This operation is not allowed.",
    UNKNOWN: "An unexpected error occurred. Please try again.",
  },

  // Validation errors
  VALIDATION: {
    MISSING_FIELD: (field: string) => `${field} is required.`,
    INVALID_FORMAT: (field: string) => `${field} format is invalid.`,
    TOO_LONG: (field: string, max: number) =>
      `${field} must be ${max} characters or less.`,
    TOO_SHORT: (field: string, min: number) =>
      `${field} must be at least ${min} characters.`,
  },
} as const;

/**
 * Format a system error into a user-friendly message
 */
export function formatSystemError(error: unknown): string {
  if (!error) return ErrorMessages.GENERAL.UNKNOWN;

  const message = error instanceof Error ? error.message : String(error);

  // Disk space errors
  if (message.includes("ENOSPC") || message.toLowerCase().includes("no space")) {
    return "Not enough disk space available. Please free up some space and try again.";
  }

  // Permission errors
  if (message.includes("EACCES") || message.includes("EPERM")) {
    return ErrorMessages.FILESYSTEM.PERMISSIONS;
  }

  // File not found
  if (message.includes("ENOENT")) {
    return "File or directory not found. It may have been deleted or moved.";
  }

  // Connection errors
  if (message.includes("ECONNREFUSED") || message.includes("ETIMEDOUT")) {
    return "Connection failed. Please check your network and try again.";
  }

  // FFmpeg errors
  if (message.toLowerCase().includes("ffmpeg") || message.toLowerCase().includes("codec")) {
    return ErrorMessages.PROCESSING.FAILED();
  }

  // File type errors
  if (message.toLowerCase().includes("invalid") && message.toLowerCase().includes("format")) {
    return ErrorMessages.UPLOAD.INVALID_FORMAT(["MP4", "MOV", "AVI", "MKV", "WEBM"]);
  }

  // Default to the original message if it's user-readable
  if (message.length < 100 && !message.includes(" at ") && !message.startsWith("Error:")) {
    return message;
  }

  return ErrorMessages.GENERAL.SERVER_ERROR;
}

/**
 * Create a standardized error response
 */
export interface ErrorResponse {
  success: false;
  message: string;
  details?: string;
  code?: string;
}

export function createErrorResponse(
  message: string,
  details?: string,
  code?: string
): ErrorResponse {
  const response: ErrorResponse = {
    success: false,
    message,
  };

  if (details) response.details = details;
  if (code) response.code = code;

  return response;
}

/**
 * Log error with context (for development/debugging)
 */
export function logError(
  context: string,
  error: unknown,
  additionalInfo?: Record<string, any>
): void {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : undefined;

  console.error(`[${context}] Error:`, errorMessage);
  
  if (errorStack && process.env.NODE_ENV !== "production") {
    console.error(`[${context}] Stack:`, errorStack);
  }

  if (additionalInfo) {
    console.error(`[${context}] Additional info:`, additionalInfo);
  }
}
