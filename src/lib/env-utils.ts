/**
 * Environment utilities for runtime validation and configuration
 */

import { randomBytes } from "crypto";

/**
 * Ensures JWT_SECRET exists and is secure
 * If missing or insecure, generates a secure secret for runtime use
 * Note: This is for runtime only. For persistent secrets, use scripts/ensure-jwt.js
 */
export function ensureJWTSecret(): string {
  const secret = process.env.JWT_SECRET;

  // Check if secret exists and is secure
  if (secret && isSecureSecret(secret)) {
    return secret;
  }

  // Generate a secure secret for this runtime session
  const generatedSecret = randomBytes(32).toString("hex");

  // Warn if using generated secret
  if (!secret) {
    console.warn(
      "⚠️  JWT_SECRET not found in environment. Using generated secret for this session."
    );
    console.warn("   For persistent secrets, run: npm run prebuild");
  } else {
    console.warn(
      "⚠️  JWT_SECRET is insecure. Using generated secret for this session."
    );
  }

  // Set the generated secret in process.env for this runtime
  process.env.JWT_SECRET = generatedSecret;

  return generatedSecret;
}

/**
 * Validates required environment variables and system requirements
 */
export function validateEnvironment(): void {
  const warnings: string[] = [];
  const errors: string[] = [];
  const info: string[] = [];

  // Check Node.js version
  const nodeVersion = process.version;
  const versionPart = nodeVersion.split('.')[0];
  const majorVersion = versionPart ? parseInt(versionPart.substring(1)) : 0;
  if (majorVersion < 18) {
    errors.push(`Node.js ${majorVersion} is not supported. Please use Node.js 18+ (current: ${nodeVersion})`);
  } else {
    info.push(`Node.js ${nodeVersion}`);
  }

  // Check for admin credentials
  if (!process.env.ADMIN_USERNAME) {
    warnings.push("ADMIN_USERNAME not set, using default 'admin'");
  }  else {
    info.push(`Admin username: ${process.env.ADMIN_USERNAME}`);
  }

  if (!process.env.ADMIN_PASSWORD) {
    warnings.push("ADMIN_PASSWORD not set, using default - CHANGE THIS FOR SECURITY!");
  } else if (process.env.ADMIN_PASSWORD === "changeme123" || process.env.ADMIN_PASSWORD === "test") {
    warnings.push("⚠️ SECURITY WARNING: ADMIN_PASSWORD is using a default/test value - please change it immediately!");
  } else if (process.env.ADMIN_PASSWORD.length < 8) {
    warnings.push("ADMIN_PASSWORD is too short (min 8 characters recommended)");
  }

  // Check JWT secret
  if (!process.env.JWT_SECRET) {
    warnings.push("JWT_SECRET not set, will be auto-generated (not persistent across restarts)");
  } else if (!isSecureSecret(process.env.JWT_SECRET)) {
    warnings.push("JWT_SECRET appears to be insecure or a default value");
  }

  // Check NODE_ENV
  const nodeEnv = process.env.NODE_ENV || "development";
  info.push(`Environment: ${nodeEnv}`);
  
  if (nodeEnv === "production" &&process.env.ADMIN_PASSWORD === "changeme123") {
    errors.push("Cannot run in production with default admin password!");
  }

  // Check Docker configuration if in container
  if (process.env.DOCKER_CONTAINER === "true") {
    info.push("Running in Docker container");
    if (process.env.IMAGE_NAME) {
      info.push(`Docker image: ${process.env.IMAGE_NAME}`);
    }
  }

  // Log info
  if (info.length > 0) {
    console.log("\n✓ Prometheus Video Platform");
    info.forEach((item) => console.log(`  ${item}`));
  }

  // Log warnings
  if (warnings.length > 0) {
    console.warn("\n⚠️  Environment Configuration Warnings:");
    warnings.forEach((warning) => console.warn(`   - ${warning}`));
    console.warn("");
  }

  // Log errors and exit if critical
  if (errors.length > 0) {
    console.error("\n❌ Environment Configuration Errors:");
    errors.forEach((error) => console.error(`   - ${error}`));
    console.error("");
    throw new Error("Invalid environment configuration");
  }
}

/**
 * Check if a JWT secret is secure
 */
function isSecureSecret(secret: string): boolean {
  if (!secret) return false;
  if (secret.length < 32) return false;

  // Check if it's a placeholder/default value
  const insecureDefaults = [
    "your-super-secret-jwt-key",
    "change-this",
    "auto-generated",
    "dev-secret-key",
    "test",
    "example",
  ];

  const lowerSecret = secret.toLowerCase();
  return !insecureDefaults.some((def) => lowerSecret.includes(def));
}
