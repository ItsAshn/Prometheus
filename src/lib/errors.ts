/**
 * Error utility functions for the Prometheus application
 * Provides consistent error creation and messaging
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
