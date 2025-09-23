import type { RequestHandler } from "@builder.io/qwik-city";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

const CONFIG_FILE_PATH = join(process.cwd(), "temp", "site-config.json");

interface SiteConfig {
  channelName: string;
  channelDescription: string;
  customCss?: string;
  lastUpdated: string;
}

// Default configuration
const DEFAULT_CONFIG: SiteConfig = {
  channelName: "My Video Channel",
  channelDescription:
    "Welcome to my self-hosted video streaming platform. Here you can find all my videos and content.",
  customCss: "",
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

export const onGet: RequestHandler = async ({ json }) => {
  try {
    const config = loadSiteConfig();
    // Don't expose the custom CSS in public API for security
    const publicConfig = {
      channelName: config.channelName,
      channelDescription: config.channelDescription,
      lastUpdated: config.lastUpdated,
    };
    json(200, publicConfig);
  } catch (error) {
    console.error("Error getting site config:", error);
    json(500, { message: "Internal server error" });
  }
};
