#!/usr/bin/env node

// @ts-nocheck

/**
 * Prebuild script - Ensures JWT_SECRET exists before build
 * Auto-generates a secure JWT secret if missing or insecure
 */

import { randomBytes } from "crypto";
import { writeFileSync, readFileSync, existsSync, appendFileSync } from "fs";
import { resolve } from "path";

const ENV_PATH = resolve(process.cwd(), ".env");
const EXAMPLE_ENV_PATH = resolve(process.cwd(), "example.env");

function generateSecureSecret(length = 32) {
  return randomBytes(length).toString("hex");
}

function isSecureSecret(secret) {
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

function ensureEnvFile() {
  // If .env doesn't exist, create it from example.env
  if (!existsSync(ENV_PATH)) {
    console.log("📝 .env file not found. Creating from example.env...");

    if (existsSync(EXAMPLE_ENV_PATH)) {
      const exampleContent = readFileSync(EXAMPLE_ENV_PATH, "utf-8");
      writeFileSync(ENV_PATH, exampleContent, "utf-8");
      console.log("✅ Created .env file from example.env");
    } else {
      // Create minimal .env file
      const minimalEnv = `# Admin Configuration
ADMIN_USERNAME=admin
ADMIN_PASSWORD=changeme123

# JWT Secret - Auto-generated
JWT_SECRET=

# Docker Container Configuration
CONTAINER_NAME=prometheus

# Environment
NODE_ENV=production
`;
      writeFileSync(ENV_PATH, minimalEnv, "utf-8");
      console.log("✅ Created minimal .env file");
    }
  }
}

function checkAndGenerateJWT() {
  console.log("\n🔐 Checking JWT_SECRET configuration...\n");

  ensureEnvFile();

  // Read .env file
  const envContent = readFileSync(ENV_PATH, "utf-8");
  const jwtMatch = envContent.match(/JWT_SECRET=(.*)$/m);
  const currentSecret = jwtMatch ? jwtMatch[1].trim() : "";

  if (isSecureSecret(currentSecret)) {
    console.log("✅ JWT_SECRET is already configured and secure.");
    console.log(`   Length: ${currentSecret.length} characters\n`);
    return;
  }

  // Generate new secure secret
  const newSecret = generateSecureSecret(32);

  console.log("⚠️  No secure JWT_SECRET found!");
  console.log("🔑 Generating a new secure JWT secret...");

  // Update .env file
  if (jwtMatch) {
    // Replace existing JWT_SECRET line
    const updatedContent = envContent.replace(
      /JWT_SECRET=.*/,
      `JWT_SECRET=${newSecret}`
    );
    writeFileSync(ENV_PATH, updatedContent, "utf-8");
  } else {
    // Append JWT_SECRET
    appendFileSync(ENV_PATH, `\nJWT_SECRET=${newSecret}\n`, "utf-8");
  }

  console.log("✅ Generated and saved secure JWT_SECRET to .env file!");
  console.log(`   JWT_SECRET=${newSecret}`);
  console.log(`   Length: ${newSecret.length} characters`);
  console.log("\n💾 Your JWT secret has been saved to .env file.");
  console.log(
    "⚠️  Keep this file secure and do not commit it to version control!\n"
  );
}

// Run the check
try {
  checkAndGenerateJWT();
} catch (error) {
  console.error("❌ Error ensuring JWT_SECRET:", error.message);
  console.error(
    "\n⚠️  Continuing with build, but you should set JWT_SECRET manually!\n"
  );
}
