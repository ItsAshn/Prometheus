#!/usr/bin/env node

// @ts-nocheck

/**
 * Interactive setup script for Prometheus environment configuration
 * Makes it easy for admins to configure their .env file
 */

import { createInterface } from "readline";
import { writeFileSync, readFileSync, existsSync } from "fs";
import { randomBytes } from "crypto";
import { resolve } from "path";

const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

function generateSecureSecret(length = 32) {
  return randomBytes(length).toString("hex");
}

async function setup() {
  console.log("\n🚀 Prometheus Environment Setup\n");
  console.log("This script will help you configure your .env file.\n");

  const envPath = resolve(process.cwd(), ".env");
  const exampleEnvPath = resolve(process.cwd(), "example.env");

  // Check if .env already exists
  let existingEnv = "";
  if (existsSync(envPath)) {
    console.log("⚠️  .env file already exists.");
    const overwrite = await question("Do you want to overwrite it? (y/N): ");
    if (overwrite.toLowerCase() !== "y" && overwrite.toLowerCase() !== "yes") {
      console.log("Setup cancelled.");
      rl.close();
      return;
    }
    existingEnv = readFileSync(envPath, "utf-8");
  }

  console.log("\n📝 Please provide the following configuration:\n");

  // Admin Username
  const defaultUsername =
    existingEnv.match(/ADMIN_USERNAME=(.+)/)?.[1] || "admin";
  const username =
    (await question(`Admin Username (default: ${defaultUsername}): `)) ||
    defaultUsername;

  // Admin Password
  let password = await question(
    "Admin Password (leave empty to auto-generate): "
  );
  if (!password) {
    password = generateSecureSecret(16);
    console.log(`✅ Generated password: ${password}`);
  }

  // JWT Secret
  console.log("\n🔑 JWT Secret Configuration:");
  console.log("   This is used to secure authentication tokens.");
  const useAutoGenerate = await question(
    "Auto-generate secure JWT secret? (Y/n): "
  );

  let jwtSecret;
  if (
    useAutoGenerate.toLowerCase() === "n" ||
    useAutoGenerate.toLowerCase() === "no"
  ) {
    jwtSecret = await question("Enter JWT Secret (minimum 32 characters): ");
    while (jwtSecret.length < 32) {
      console.log("❌ JWT Secret must be at least 32 characters long.");
      jwtSecret = await question("Enter JWT Secret (minimum 32 characters): ");
    }
  } else {
    jwtSecret = generateSecureSecret(32);
    console.log("✅ Generated secure JWT secret.");
  }

  // Container Name
  const defaultContainer =
    existingEnv.match(/CONTAINER_NAME=(.+)/)?.[1] || "prometheus";
  const containerName =
    (await question(
      `\nDocker Container Name (default: ${defaultContainer}): `
    )) || defaultContainer;

  // Environment
  const defaultEnv = existingEnv.match(/NODE_ENV=(.+)/)?.[1] || "production";
  const nodeEnv =
    (await question(
      `Environment (development/production, default: ${defaultEnv}): `
    )) || defaultEnv;

  // Create .env content
  const envContent = `# Admin Configuration
# Change these values for your deployment
ADMIN_USERNAME=${username}
ADMIN_PASSWORD=${password}

# JWT Secret - Auto-generated secure string
JWT_SECRET=${jwtSecret}

# Docker Container Configuration (for auto-restart after updates)
CONTAINER_NAME=${containerName}

# Environment
NODE_ENV=${nodeEnv}

# Optional: Add other environment variables here
# DATABASE_URL=...
# API_KEYS=...
`;

  // Write to .env file
  try {
    writeFileSync(envPath, envContent, "utf-8");
    console.log("\n✅ Configuration saved to .env file!");
    console.log("\n📋 Your configuration:");
    console.log(`   Admin Username: ${username}`);
    console.log(`   Admin Password: ${password}`);
    console.log(
      `   JWT Secret: ${jwtSecret.substring(0, 16)}... (${jwtSecret.length} chars)`
    );
    console.log(`   Container Name: ${containerName}`);
    console.log(`   Environment: ${nodeEnv}`);
    console.log("\n⚠️  IMPORTANT: Keep these credentials safe!");
    console.log("   Do not commit the .env file to version control.\n");
  } catch (error) {
    console.error("\n❌ Error writing .env file:", error.message);
  }

  rl.close();
}

// Run setup
setup().catch((error) => {
  console.error("Setup failed:", error);
  process.exit(1);
});
