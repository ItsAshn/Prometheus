/**
 * Input validation utilities for the Prometheus application
 * Provides reusable validation functions with consistent error messages
 */

import { CONFIG } from "./constants";
import { Errors } from "./errors";

/**
 * Validates and sanitizes a video title
 * @throws AppError if validation fails
 */
export function validateVideoTitle(title: unknown): string {
  if (typeof title !== 'string') {
    throw Errors.validationError('title', 'must be a string');
  }
  
  const trimmed = title.trim();
  
  if (trimmed.length < CONFIG.VALIDATION.MIN_TITLE_LENGTH) {
    throw Errors.validationError(
      'title',
      `must be at least ${CONFIG.VALIDATION.MIN_TITLE_LENGTH} character`
    );
  }
  
  if (trimmed.length > CONFIG.VALIDATION.MAX_TITLE_LENGTH) {
    throw Errors.validationError(
      'title',
      `must not exceed ${CONFIG.VALIDATION.MAX_TITLE_LENGTH} characters`
    );
  }
  
  // Sanitize: Remove potentially dangerous characters
  const sanitized = trimmed.replace(/[<>]/g, '');
  
  return sanitized;
}

/**
 * Validates a video file extension
 * @throws AppError if invalid
 */
export function validateVideoExtension(filename: string): string {
  const extension = filename.toLowerCase().split('.').pop();
  
  if (!extension) {
    throw Errors.videoInvalidFormat(CONFIG.VIDEO.ALLOWED_EXTENSIONS);
  }
  
  if (!CONFIG.VIDEO.ALLOWED_EXTENSIONS.includes(extension as any)) {
    throw Errors.videoInvalidFormat(CONFIG.VIDEO.ALLOWED_EXTENSIONS);
  }
  
  return extension;
}

/**
 * Validates a video file MIME type
 */
export function isValidVideoMimeType(mimeType: string): boolean {
  return CONFIG.VIDEO.ALLOWED_MIME_TYPES.includes(mimeType as any);
}

/**
 * Validates file size
 * @throws AppError if file is too large
 */
export function validateFileSize(size: number): void {
  if (size > CONFIG.VIDEO.MAX_SIZE_BYTES) {
    throw Errors.videoTooLarge(size, CONFIG.VIDEO.MAX_SIZE_GB);
  }
}

/**
 * Validates a description field
 */
export function validateDescription(description: unknown): string | undefined {
  if (description === null || description === undefined || description === '') {
    return undefined;
  }
  
  if (typeof description !== 'string') {
    throw Errors.validationError('description', 'must be a string');
  }
  
  const trimmed = description.trim();
  
  if (trimmed.length > CONFIG.VALIDATION.MAX_DESCRIPTION_LENGTH) {
    throw Errors.validationError(
      'description',
      `must not exceed ${CONFIG.VALIDATION.MAX_DESCRIPTION_LENGTH} characters`
    );
  }
  
  // Sanitize HTML/script tags
  const sanitized = trimmed.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  return sanitized;
}

/**
 * Validates username for login
 */
export function validateUsername(username: unknown): string {
  if (typeof username !== 'string') {
    throw Errors.validationError('username', 'must be a string');
  }
  
  const trimmed = username.trim();
  
  if (trimmed.length === 0) {
    throw Errors.missingField('username');
  }
  
  if (trimmed.length > 50) {
    throw Errors.validationError('username', 'must not exceed 50 characters');
  }
  
  // Only allow alphanumeric, underscore, and hyphen
  if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
    throw Errors.validationError(
      'username',
      'can only contain letters, numbers, underscores, and hyphens'
    );
  }
  
  return trimmed;
}

/**
 * Validates password (doesn't check strength, just format)
 */
export function validatePassword(password: unknown): string {
  if (typeof password !== 'string') {
    throw Errors.validationError('password', 'must be a string');
  }
  
  if (password.length === 0) {
    throw Errors.missingField('password');
  }
  
  if (password.length < CONFIG.AUTH.MIN_PASSWORD_LENGTH) {
    throw Errors.validationError(
      'password',
      `must be at least ${CONFIG.AUTH.MIN_PASSWORD_LENGTH} characters`
    );
  }
  
  return password;
}

/**
 * Validates a video ID format
 */
export function validateVideoId(videoId: unknown): string {
  if (typeof videoId !== 'string') {
    throw Errors.validationError('videoId', 'must be a string');
  }
  
  const trimmed = videoId.trim();
  
  if (trimmed.length === 0) {
    throw Errors.missingField('videoId');
  }
  
  // Video IDs should match the pattern: video_timestamp_randomstring
  if (!/^video_\d+_[a-z0-9]+$/.test(trimmed)) {
    throw Errors.validationError('videoId', 'has invalid format');
  }
  
  return trimmed;
}

/**
 * Sanitizes HTML content (removes scripts and dangerous tags)
 */
export function sanitizeHTML(html: string): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '') // Remove inline event handlers
    .replace(/javascript:/gi, '');
}

/**
 * Validates CSS content (basic validation)
 */
export function validateCSS(css: unknown): string {
  if (typeof css !== 'string') {
    throw Errors.validationError('css', 'must be a string');
  }
  
  // Check for potentially dangerous patterns
  if (css.includes('<script') || css.includes('javascript:')) {
    throw Errors.validationError('css', 'contains forbidden content');
  }
  
  return css;
}

/**
 * Validates channel name
 */
export function validateChannelName(name: unknown): string {
  if (typeof name !== 'string') {
    throw Errors.validationError('channelName', 'must be a string');
  }
  
  const trimmed = name.trim();
  
  if (trimmed.length === 0) {
    throw Errors.missingField('channelName');
  }
  
  if (trimmed.length > 100) {
    throw Errors.validationError('channelName', 'must not exceed 100 characters');
  }
  
  return trimmed.replace(/[<>]/g, '');
}
