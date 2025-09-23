import type { RequestHandler } from "@builder.io/qwik-city";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-jwt-key";
const CONFIG_FILE_PATH = join(process.cwd(), "temp", "site-config.json");

interface SiteConfig {
  channelName: string;
  channelDescription: string;
  customCss?: string;
  selectedTemplate?: string;
  lastUpdated: string;
}

// Default configuration
const DEFAULT_CONFIG: SiteConfig = {
  channelName: "My Video Channel",
  channelDescription:
    "Welcome to my self-hosted video streaming platform. Here you can find all my videos and content.",
  customCss: "",
  selectedTemplate: "retro",
  lastUpdated: new Date().toISOString(),
};

function loadSiteConfig(): SiteConfig {
  try {
    if (existsSync(CONFIG_FILE_PATH)) {
      const configData = readFileSync(CONFIG_FILE_PATH, "utf-8");
      return JSON.parse(configData);
    }
  } catch (error) {
    console.error("Error loading site config:", error);
  }
  return DEFAULT_CONFIG;
}

function saveSiteConfig(config: SiteConfig): void {
  try {
    // Ensure temp directory exists
    const tempDir = join(process.cwd(), "temp");
    if (!existsSync(tempDir)) {
      mkdirSync(tempDir, { recursive: true });
    }

    config.lastUpdated = new Date().toISOString();
    writeFileSync(CONFIG_FILE_PATH, JSON.stringify(config, null, 2));
  } catch (error) {
    console.error("Error saving site config:", error);
    throw error;
  }
}

function verifyAdminToken(request: Request): boolean {
  try {
    const cookieHeader = request.headers.get("cookie");
    if (!cookieHeader) {
      return false;
    }

    const cookies = cookieHeader.split(";").reduce(
      (acc, cookie) => {
        const [key, value] = cookie.trim().split("=");
        acc[key] = value;
        return acc;
      },
      {} as Record<string, string>
    );

    const token = cookies["admin-auth-token"];
    if (!token) {
      return false;
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    return decoded && decoded.isAdmin;
  } catch {
    return false;
  }
}

export const onGet: RequestHandler = async ({ json, request }) => {
  if (!verifyAdminToken(request)) {
    json(401, { message: "Unauthorized" });
    return;
  }

  try {
    const config = loadSiteConfig();
    json(200, config);
  } catch (error) {
    console.error("Error getting site config:", error);
    json(500, { message: "Internal server error" });
  }
};

export const onPost: RequestHandler = async ({ json, request }) => {
  if (!verifyAdminToken(request)) {
    json(401, { message: "Unauthorized" });
    return;
  }

  try {
    const body = await request.json();
    const { channelName, channelDescription, customCss, selectedTemplate } =
      body;

    if (!channelName || !channelDescription) {
      json(400, { message: "Channel name and description are required" });
      return;
    }

    const config: SiteConfig = {
      channelName: channelName.trim(),
      channelDescription: channelDescription.trim(),
      customCss: customCss || "",
      selectedTemplate: selectedTemplate || "retro",
      lastUpdated: new Date().toISOString(),
    };

    saveSiteConfig(config);

    json(200, {
      message: "Site configuration updated successfully",
      config,
    });
  } catch (error) {
    console.error("Error updating site config:", error);
    if (error instanceof Response) {
      throw error;
    }
    json(500, { message: "Internal server error" });
  }
};
