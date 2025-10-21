import type { RequestHandler } from "@builder.io/qwik-city";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";
import { AdminAuthService, ADMIN_COOKIE_NAME } from "~/lib/auth";

const CONFIG_FILE_PATH = join(process.cwd(), "temp", "site-config.json");

interface SiteConfig {
  channelName: string;
  channelDescription: string;
  aboutText?: string;
  customCss?: string;
  selectedTemplate?: string;
  lastUpdated: string;
}

// Default configuration
const DEFAULT_CONFIG: SiteConfig = {
  channelName: "My Video Channel",
  channelDescription:
    "Welcome to my self-hosted video streaming platform. Here you can find all my videos and content.",
  aboutText:
    "Welcome to my channel! This is a self-hosted video streaming platform where I share my content. All videos are hosted on my own infrastructure, ensuring complete privacy and control.",
  customCss: "",
  selectedTemplate: "modern",
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
    writeFileSync(CONFIG_FILE_PATH, JSON.stringify(config, null, 2), "utf-8");
  } catch (error) {
    console.error("Error saving site config:", error);
    throw new Error(
      `Failed to save site config: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

export const onGet: RequestHandler = async ({ json, cookie }) => {
  const authCookie = cookie.get(ADMIN_COOKIE_NAME);
  if (!authCookie?.value) {
    json(401, { message: "Unauthorized" });
    return;
  }

  const isValidToken = AdminAuthService.verifyToken(authCookie.value);
  if (!isValidToken) {
    json(401, { message: "Unauthorized" });
    return;
  }

  try {
    const config = loadSiteConfig();
    json(200, config);
    return;
  } catch (error) {
    console.error("Error getting site config:", error);
    json(500, { message: "Internal server error" });
    return;
  }
};

export const onPost: RequestHandler = async ({ json, request, cookie }) => {
  console.log("[Site Config] POST request received");

  const authCookie = cookie.get(ADMIN_COOKIE_NAME);
  if (!authCookie?.value) {
    console.log("[Site Config] Unauthorized access attempt - no cookie");
    json(401, { message: "Unauthorized" });
    return;
  }

  const isValidToken = AdminAuthService.verifyToken(authCookie.value);
  if (!isValidToken) {
    console.log("[Site Config] Unauthorized access attempt - invalid token");
    json(401, { message: "Unauthorized" });
    return;
  }

  try {
    const body = await request.json();
    console.log("[Site Config] Request body:", body);

    const {
      channelName,
      channelDescription,
      aboutText,
      customCss,
      selectedTemplate,
    } = body;

    if (!channelName || !channelDescription) {
      console.log("[Site Config] Missing required fields");
      json(400, { message: "Channel name and description are required" });
      return;
    }

    const config: SiteConfig = {
      channelName: channelName.trim(),
      channelDescription: channelDescription.trim(),
      aboutText: aboutText ? aboutText.trim() : "",
      customCss: customCss || "",
      selectedTemplate: selectedTemplate || "modern",
      lastUpdated: new Date().toISOString(),
    };

    console.log("[Site Config] Saving config:", config);
    saveSiteConfig(config);
    console.log("[Site Config] Config saved successfully");

    json(200, {
      message: "Site configuration updated successfully",
      config,
    });
    return;
  } catch (error) {
    console.error("[Site Config] Error updating site config:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Internal server error";
    json(500, { message: errorMessage });
    return;
  }
};
