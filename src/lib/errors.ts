/**
 * Custom error class for application-specific errors
 * Provides consistent error handling across the application
 */
export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public details?: unknown
  ) {
    super(message);
    this.name = 'AppError';
    
    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }

  /**
   * Converts the error to a JSON-serializable object
   */
  toJSON() {
    const result: { success: false; error: { message: string; code: string; details?: unknown } } = {
      success: false,
      error: {
        message: this.message,
        code: this.code,
      },
    };
    
    if (this.details) {
      result.error.details = this.details;
    }
    
    return result;
  }
}

/**
 * Standard error codes for the application
 */
export const ErrorCode = {
  // Authentication & Authorization
  AUTH_REQUIRED: 'AUTH_REQUIRED',
  AUTH_INVALID: 'AUTH_INVALID',
  AUTH_EXPIRED: 'AUTH_EXPIRED',
  AUTH_FAILED: 'AUTH_FAILED',
  
  // Video Processing
  VIDEO_NOT_FOUND: 'VIDEO_NOT_FOUND',
  VIDEO_UPLOAD_FAILED: 'VIDEO_UPLOAD_FAILED',
  VIDEO_PROCESSING_FAILED: 'VIDEO_PROCESSING_FAILED',
  VIDEO_INVALID_FORMAT: 'VIDEO_INVALID_FORMAT',
  VIDEO_TOO_LARGE: 'VIDEO_TOO_LARGE',
  VIDEO_DELETE_FAILED: 'VIDEO_DELETE_FAILED',
  
  // Validation
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  
  // System
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  FFMPEG_NOT_AVAILABLE: 'FFMPEG_NOT_AVAILABLE',
  FILE_SYSTEM_ERROR: 'FILE_SYSTEM_ERROR',
  
  // Configuration
  CONFIG_ERROR: 'CONFIG_ERROR',
  CONFIG_SAVE_FAILED: 'CONFIG_SAVE_FAILED',
} as const;

/**
 * Pre-defined error factory functions for common errors
 */
export const Errors = {
  authRequired: () => 
    new AppError('Authentication required', ErrorCode.AUTH_REQUIRED, 401),
    
  authInvalid: () => 
    new AppError('Invalid or expired authentication token', ErrorCode.AUTH_INVALID, 401),
    
  authFailed: (message = 'Authentication failed') => 
    new AppError(message, ErrorCode.AUTH_FAILED, 401),
    
  videoNotFound: (videoId?: string) => 
    new AppError(
      `Video not found${videoId ? `: ${videoId}` : ''}`, 
      ErrorCode.VIDEO_NOT_FOUND, 
      404,
      { videoId }
    ),
    
  videoTooLarge: (size: number, maxSize: number) => 
    new AppError(
      `File size (${(size / 1024 / 1024 / 1024).toFixed(2)}GB) exceeds maximum allowed size (${maxSize}GB)`,
      ErrorCode.VIDEO_TOO_LARGE,
      413,
      { size, maxSize }
    ),
    
  videoInvalidFormat: (allowedFormats: readonly string[]) => 
    new AppError(
      `Invalid file format. Allowed formats: ${allowedFormats.join(', ')}`,
      ErrorCode.VIDEO_INVALID_FORMAT,
      400,
      { allowedFormats }
    ),
    
  validationError: (field: string, message: string) => 
    new AppError(
      `Validation error: ${field} - ${message}`,
      ErrorCode.VALIDATION_ERROR,
      400,
      { field, message }
    ),
    
  missingField: (field: string) => 
    new AppError(
      `Missing required field: ${field}`,
      ErrorCode.MISSING_REQUIRED_FIELD,
      400,
      { field }
    ),
    
  ffmpegNotAvailable: () => 
    new AppError(
      'FFmpeg is not available. Video processing is disabled.',
      ErrorCode.FFMPEG_NOT_AVAILABLE,
      503
    ),
    
  internalError: (message = 'An internal error occurred', details?: unknown) => 
    new AppError(message, ErrorCode.INTERNAL_ERROR, 500, details),
};

/**
 * Type guard to check if an error is an AppError
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

/**
 * Handles errors and returns a standardized response
 * Logs errors appropriately based on severity
 */
export function handleError(error: unknown): {
  success: false;
  error: {
    message: string;
    code: string;
    details?: unknown;
  };
  statusCode: number;
} {
  if (isAppError(error)) {
    // Log application errors at appropriate level
    if (error.statusCode >= 500) {
      console.error(`[AppError ${error.code}]:`, error.message, error.details);
      console.error(error.stack);
    } else {
      console.warn(`[AppError ${error.code}]:`, error.message);
    }
    
    const jsonResponse = error.toJSON();
    return {
      ...jsonResponse,
      statusCode: error.statusCode,
    };
  }
  
  // Handle unknown errors
  console.error('[Unhandled Error]:', error);
  
  // Don't leak internal error details in production
  const message = process.env.NODE_ENV === 'production'
    ? 'An internal error occurred'
    : error instanceof Error ? error.message : String(error);
  
  return {
    success: false,
    error: {
      message,
      code: ErrorCode.INTERNAL_ERROR,
    },
    statusCode: 500,
  };
}

/**
 * Async wrapper to catch errors in route handlers
 * Usage: export const onPost = catchErrors(async ({ request, json }) => { ... });
 */
export function catchErrors<T extends (...args: any[]) => Promise<any>>(
  handler: T
): T {
  return (async (...args: any[]) => {
    try {
      return await handler(...args);
    } catch (error) {
      const { statusCode, ...errorResponse } = handleError(error);
      const json = args[0]?.json;
      if (json) {
        json(statusCode, errorResponse);
      } else {
        throw error;
      }
    }
  }) as T;
}
