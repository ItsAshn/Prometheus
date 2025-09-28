import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// Get admin credentials from environment variables
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "changeme123";
const JWT_SECRET =
  process.env.JWT_SECRET ||
  "your-super-secret-jwt-key-change-this-in-production";
const SALT_ROUNDS = 12;

export interface AdminUser {
  username: string;
  isAdmin: boolean;
}

export interface JWTPayload {
  username: string;
  isAdmin: boolean;
  iat?: number;
  exp?: number;
}

// Store hashed admin password (computed once at startup)
let adminPasswordHash: string | null = null;

export class AdminAuthService {
  static async initializeAdminPassword(): Promise<void> {
    if (!adminPasswordHash) {
      adminPasswordHash = await bcrypt.hash(ADMIN_PASSWORD, SALT_ROUNDS);
    }
  }

  static async verifyAdminCredentials(
    username: string,
    password: string
  ): Promise<boolean> {
    if (!adminPasswordHash) {
      await this.initializeAdminPassword();
    }

    if (username !== ADMIN_USERNAME || !adminPasswordHash) {
      return false;
    }

    return bcrypt.compare(password, adminPasswordHash);
  }

  static generateToken(payload: JWTPayload): string {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: "24h" });
  }

  static verifyToken(token: string): JWTPayload | null {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
      return decoded;
    } catch (error) {
      return null;
    }
  }

  static getAdminUser(): AdminUser {
    return {
      username: ADMIN_USERNAME,
      isAdmin: true,
    };
  }
}

export const ADMIN_COOKIE_NAME = "admin-auth-token";
export const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production", // Secure in production
  sameSite: "lax" as const,
  maxAge: 24 * 60 * 60 * 1000, // 24 hours
  path: "/",
};
