import { server$ } from "@builder.io/qwik-city";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

/**
 * Server function to load site configuration without API calls
 */
export const loadSiteConfigServer = server$(async function () {
  try {
    const CONFIG_FILE_PATH = join(process.cwd(), "temp", "site-config.json");

    interface SiteConfig {
      channelName: string;
      channelDescription: string;
      aboutText: string;
      customCss: string;
      lastUpdated: string;
      selectedTemplate?: string;
      bannerImage?: string;
      avatarImage?: string;
    }

    // Default configuration
    const DEFAULT_CONFIG: SiteConfig = {
      channelName: "My Video Channel",
      channelDescription:
        "Welcome to my self-hosted video streaming platform. Here you can find all my videos and content.",
      aboutText:
        "Welcome to my channel! This is a self-hosted video streaming platform where I share my content. All videos are hosted on my own infrastructure, ensuring complete privacy and control.",
      customCss: "",
      lastUpdated: new Date().toISOString(),
    };

    let config = DEFAULT_CONFIG;

    if (existsSync(CONFIG_FILE_PATH)) {
      try {
        const configData = readFileSync(CONFIG_FILE_PATH, "utf-8");
        const loadedConfig = JSON.parse(configData);
        config = { ...DEFAULT_CONFIG, ...loadedConfig };
      } catch (error) {
        console.error("Error parsing site config:", error);
      }
    }

    // Don't expose custom CSS in public config for security
    return {
      channelName: config.channelName,
      channelDescription: config.channelDescription,
      aboutText: config.aboutText,
      lastUpdated: config.lastUpdated,
      selectedTemplate: config.selectedTemplate,
      bannerImage: config.bannerImage || "",
      avatarImage: config.avatarImage || "",
    };
  } catch (error) {
    console.error("Error loading site config:", error);
    return null;
  }
});

/**
 * Server function to get video list without API calls
 */
export const loadVideosServer = server$(async function () {
  try {
    const { VideoProcessor } = await import("~/lib/video/video-processor");
    const videos = await VideoProcessor.getVideoMetadata();
    return videos;
  } catch (error) {
    console.error("Error loading videos:", error);
    return [];
  }
});

/**
 * Server function to get video processing status without API calls
 */
export const loadProcessingStatusServer = server$(async function () {
  try {
    const { VideoProcessor } = await import("~/lib/video/video-processor");
    const processingStatus = await VideoProcessor.getProcessingStatus();
    return processingStatus;
  } catch (error) {
    console.error("Error loading processing status:", error);
    return [];
  }
});

/**
 * Server function to get app version without API calls
 */
export const loadVersionServer = server$(async function () {
  try {
    // Helper function to get GitHub repository info
    const getGitHubInfo = () => {
      const owner = process.env.GITHUB_OWNER || "ItsAshn";
      const repo = process.env.GITHUB_REPO || "Prometheus";
      return { owner, repo };
    };

    // First check if APP_VERSION is set in environment
    let version = process.env.APP_VERSION || "v1.0.0";
    let source = "environment";

    // Try to fetch the latest release from GitHub
    try {
      const { owner, repo } = getGitHubInfo();
      const response = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/releases/latest`,
        {
          headers: {
            "User-Agent": "Prometheus-App",
            Accept: "application/vnd.github.v3+json",
          },
        }
      );

      if (response.ok) {
        const release = await response.json();
        version = release.tag_name;
        source = "github_release";
      }
    } catch (error) {
      // If GitHub fetch fails, fall back to environment version
      console.warn(
        "Could not fetch GitHub release, using environment version:",
        error
      );
    }

    return {
      version,
      source,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Version loading error:", error);
    return {
      version: "v1.0.0",
      source: "fallback",
      timestamp: new Date().toISOString(),
    };
  }
});
