import crypto from "crypto";
import fs from "fs";
import path from "path";

/**
 * Generates a secure random JWT secret
 * @param length - Length of the secret in bytes (default: 32)
 * @returns A secure random string in hexadecimal format
 */
export function generateSecureSecret(length: number = 32): string {
  return crypto.randomBytes(length).toString("hex");
}

/**
 * Ensures a JWT secret exists in the environment
 * In production: Fails if not provided
 * In development: Generates temporary secret and optionally saves to .env
 * @returns The JWT secret to use
 */
export function ensureJWTSecret(): string {
  const existingSecret = process.env.JWT_SECRET;

  // If a valid secret exists, use it
  if (existingSecret && existingSecret.length >= 32 && 
      existingSecret !== "your-super-secret-jwt-key-change-this-in-production" &&
      existingSecret !== "your-super-secret-jwt-key-change-this-to-something-random") {
    return existingSecret;
  }

  // In production, fail hard if no valid secret exists
  if (process.env.NODE_ENV === "production") {
    console.error("❌ CRITICAL: No valid JWT_SECRET found in production environment!");
    console.error("   JWT_SECRET must be set to a secure random string of at least 32 characters.");
    console.error("   Generate one with: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\"");
    throw new Error("JWT_SECRET is required in production but was not found or is using a default value");
  }

  // Development mode: Generate a new secure secret
  const newSecret = generateSecureSecret(32);
  
  console.warn("⚠️  WARNING: No secure JWT_SECRET found in environment!");
  console.log("🔑 Auto-generated a secure JWT secret for this session.");
  console.log("📝 To persist this secret, add it to your .env file:");
  console.log(`\n   JWT_SECRET=${newSecret}\n`);
  
  // Try to write to .env file in development
  try {
    const envPath = path.resolve(process.cwd(), ".env");
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, "utf-8");
      
      // Check if JWT_SECRET line exists
      if (envContent.includes("JWT_SECRET=")) {
        // Update existing JWT_SECRET
        const updatedContent = envContent.replace(
          /JWT_SECRET=.*/,
          `JWT_SECRET=${newSecret}`
        );
        fs.writeFileSync(envPath, updatedContent, "utf-8");
        console.log("✅ Updated JWT_SECRET in .env file automatically!");
      } else {
        // Append JWT_SECRET
        fs.appendFileSync(envPath, `\nJWT_SECRET=${newSecret}\n`, "utf-8");
        console.log("✅ Added JWT_SECRET to .env file automatically!");
      }
    }
  } catch (error) {
    console.error("❌ Could not auto-update .env file:", error);
    console.log("   Please add the JWT_SECRET manually to your .env file.");
  }

  // Set it in the current process environment for this session
  process.env.JWT_SECRET = newSecret;
  
  return newSecret;
}

/**
 * Validates environment configuration and provides helpful warnings
 */
export function validateEnvironment(): void {
  const warnings: string[] = [];
  const errors: string[] = [];

  // Check JWT Secret
  const jwtSecret = process.env.JWT_SECRET;
  const isProduction = process.env.NODE_ENV === "production";
  
  if (!jwtSecret || jwtSecret.length < 32) {
    const msg = "JWT_SECRET is missing or too short (minimum 32 characters required)";
    if (isProduction) {
      errors.push(msg);
    } else {
      warnings.push(msg);
    }
  } else if (
    jwtSecret === "your-super-secret-jwt-key-change-this-in-production" ||
    jwtSecret === "your-super-secret-jwt-key-change-this-to-something-random"
  ) {
    const msg = "JWT_SECRET is using the default value - MUST be changed!";
    if (isProduction) {
      errors.push(msg);
    } else {
      warnings.push(msg);
    }
  }

  // Check Admin Password
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword || adminPassword === "test" || adminPassword === "changeme123") {
    const msg = "ADMIN_PASSWORD is missing or using a weak default value";
    if (isProduction) {
      errors.push(msg);
    } else {
      warnings.push(msg);
    }
  } else if (adminPassword.length < 8) {
    const msg = "ADMIN_PASSWORD should be at least 8 characters";
    if (isProduction) {
      errors.push(msg);
    } else {
      warnings.push(msg);
    }
  }

  // Check Admin Username
  const adminUsername = process.env.ADMIN_USERNAME;
  if (!adminUsername) {
    warnings.push("ADMIN_USERNAME not set, using default 'admin'");
  }

  // Print warnings
  if (warnings.length > 0) {
    console.warn("\n⚠️  Environment Configuration Warnings:");
    warnings.forEach(warning => console.warn(`   - ${warning}`));
  }

  // Print errors
  if (errors.length > 0) {
    console.error("\n❌ Environment Configuration Errors:");
    errors.forEach(error => console.error(`   - ${error}`));
    
    if (isProduction) {
      console.error("\n🛑 CRITICAL: Cannot start in production with invalid configuration!");
      console.error("   Please set proper values for JWT_SECRET and ADMIN_PASSWORD");
      process.exit(1);
    }
  }

  if (warnings.length === 0 && errors.length === 0) {
    console.log("✅ Environment configuration validated successfully!");
  }
}
