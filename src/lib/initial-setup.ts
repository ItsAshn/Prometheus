import { writeFile, readFile, access } from "fs/promises";
import { join } from "path";
import bcrypt from "bcryptjs";
import { CONFIG } from "./constants";

const CREDENTIALS_FILE = join(process.cwd(), "temp", "admin-credentials.json");

interface StoredCredentials {
  username: string;
  passwordHash: string;
  setupComplete: boolean;
  setupDate: string;
}

/**
 * Check if initial setup has been completed
 */
export async function isSetupComplete(): Promise<boolean> {
  try {
    await access(CREDENTIALS_FILE);
    const data = await readFile(CREDENTIALS_FILE, "utf-8");
    const credentials: StoredCredentials = JSON.parse(data);
    return credentials.setupComplete === true;
  } catch {
    // Check if env variables are set (legacy setup)
    const envUsername = process.env.ADMIN_USERNAME;
    const envPassword = process.env.ADMIN_PASSWORD;
    
    if (envUsername && envPassword && 
        envPassword !== CONFIG.DEFAULTS.ADMIN_PASSWORD &&
        envUsername !== CONFIG.DEFAULTS.ADMIN_USERNAME) {
      return true;
    }
    return false;
  }
}

/**
 * Get stored credentials (from file or env)
 */
export async function getStoredCredentials(): Promise<{ username: string; passwordHash: string } | null> {
  try {
    // First try to load from file
    await access(CREDENTIALS_FILE);
    const data = await readFile(CREDENTIALS_FILE, "utf-8");
    const credentials: StoredCredentials = JSON.parse(data);
    if (credentials.setupComplete) {
      return {
        username: credentials.username,
        passwordHash: credentials.passwordHash,
      };
    }
  } catch {
    // File doesn't exist or is invalid, try env variables
    const envUsername = process.env.ADMIN_USERNAME;
    const envPassword = process.env.ADMIN_PASSWORD;
    
    if (envUsername && envPassword) {
      // Hash the password from env
      const passwordHash = await bcrypt.hash(envPassword, CONFIG.AUTH.SALT_ROUNDS);
      return {
        username: envUsername,
        passwordHash,
      };
    }
  }
  
  return null;
}

/**
 * Save initial credentials
 */
export async function saveInitialCredentials(
  username: string,
  password: string
): Promise<void> {
  // Validate username and password
  if (!username || username.length < 3) {
    throw new Error("Username must be at least 3 characters long");
  }
  
  if (!password || password.length < 8) {
    throw new Error("Password must be at least 8 characters long");
  }

  // Hash the password
  const passwordHash = await bcrypt.hash(password, CONFIG.AUTH.SALT_ROUNDS);

  const credentials: StoredCredentials = {
    username,
    passwordHash,
    setupComplete: true,
    setupDate: new Date().toISOString(),
  };

  // Save to file
  await writeFile(CREDENTIALS_FILE, JSON.stringify(credentials, null, 2), "utf-8");
}

/**
 * Verify credentials against stored values
 */
export async function verifyStoredCredentials(
  username: string,
  password: string
): Promise<boolean> {
  const stored = await getStoredCredentials();
  
  if (!stored) {
    return false;
  }

  if (username !== stored.username) {
    return false;
  }

  return bcrypt.compare(password, stored.passwordHash);
}
