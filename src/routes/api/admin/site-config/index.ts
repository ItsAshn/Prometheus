import type { RequestHandler } from "@builder.io/qwik-city";
import {
  readFileSync,
  writeFileSync,
  existsSync,
  mkdirSync,
  accessSync,
  constants,
} from "fs";
import { join } from "path";
import { AdminAuthService, ADMIN_COOKIE_NAME } from "~/lib/auth";

const CONFIG_FILE_PATH = join(process.cwd(), "temp", "site-config.json");

interface SiteConfig {
  channelName: string;
  channelDescription: string;
  aboutText?: string;
  customCss?: string;
  selectedTemplate?: string;
  bannerImage?: string;
  avatarImage?: string;
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
  bannerImage: "",
  avatarImage: "",
  lastUpdated: new Date().toISOString(),
};

function loadSiteConfig(): SiteConfig {
  try {
    console.log("[Site Config] Loading config from:", CONFIG_FILE_PATH);
    if (existsSync(CONFIG_FILE_PATH)) {
      const configData = readFileSync(CONFIG_FILE_PATH, "utf-8");
      console.log("[Site Config] Config file contents:", configData);

      if (!configData || configData.trim() === "") {
        console.log("[Site Config] Empty config file, using default");
        return DEFAULT_CONFIG;
      }

      const parsed = JSON.parse(configData);
      console.log("[Site Config] Config loaded successfully");
      return parsed;
    } else {
      console.log("[Site Config] Config file does not exist, using default");
    }
  } catch (error) {
    console.error("[Site Config] Error loading site config:", error);
    console.error("[Site Config] Error details:", {
      message: error instanceof Error ? error.message : String(error),
      configPath: CONFIG_FILE_PATH,
      exists: existsSync(CONFIG_FILE_PATH),
    });
  }
  return DEFAULT_CONFIG;
}

function saveSiteConfig(config: SiteConfig): void {
  try {
    // Ensure temp directory exists
    const tempDir = join(process.cwd(), "temp");
    console.log("[Site Config] Temp directory path:", tempDir);
    console.log("[Site Config] Config file path:", CONFIG_FILE_PATH);
    console.log("[Site Config] Current working directory:", process.cwd());

    // Check if temp directory exists
    if (!existsSync(tempDir)) {
      console.log("[Site Config] Creating temp directory...");
      try {
        mkdirSync(tempDir, { recursive: true, mode: 0o755 });
        console.log("[Site Config] Temp directory created successfully");
      } catch (mkdirError) {
        console.error(
          "[Site Config] Failed to create temp directory:",
          mkdirError
        );
        throw new Error(
          `Cannot create temp directory: ${mkdirError instanceof Error ? mkdirError.message : String(mkdirError)}`
        );
      }
    } else {
      console.log("[Site Config] Temp directory already exists");
    }

    // Verify directory is writable
    try {
      accessSync(tempDir, constants.W_OK);
      console.log("[Site Config] Temp directory is writable");
    } catch (accessError) {
      console.error(
        "[Site Config] Temp directory is not writable:",
        accessError
      );
      throw new Error("Temp directory is not writable. Check permissions.");
    }

    config.lastUpdated = new Date().toISOString();
    const jsonString = JSON.stringify(config, null, 2);
    console.log("[Site Config] Writing config:", jsonString);

    try {
      writeFileSync(CONFIG_FILE_PATH, jsonString, {
        encoding: "utf-8",
        mode: 0o644,
      });
      console.log("[Site Config] Config file written successfully");
    } catch (writeError) {
      console.error("[Site Config] Failed to write config file:", writeError);
      throw new Error(
        `Cannot write config file: ${writeError instanceof Error ? writeError.message : String(writeError)}`
      );
    }

    // Verify the file was written
    if (!existsSync(CONFIG_FILE_PATH)) {
      throw new Error("Config file was not created after write operation");
    }

    // Verify file content
    try {
      const writtenContent = readFileSync(CONFIG_FILE_PATH, "utf-8");
      console.log(
        "[Site Config] Verification: File size:",
        writtenContent.length,
        "bytes"
      );

      // Verify JSON is valid
      JSON.parse(writtenContent);
      console.log("[Site Config] Verification: File content is valid JSON");
    } catch (verifyError) {
      console.error("[Site Config] File verification failed:", verifyError);
      throw new Error(
        `File written but verification failed: ${verifyError instanceof Error ? verifyError.message : String(verifyError)}`
      );
    }
  } catch (error) {
    console.error("[Site Config] Error saving site config:", error);
    console.error("[Site Config] Error details:", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      cwd: process.cwd(),
      tempDir: join(process.cwd(), "temp"),
      configPath: CONFIG_FILE_PATH,
    });
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
  console.log(
    "[Site Config] Content-Type:",
    request.headers.get("content-type")
  );

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

  let body;
  try {
    const text = await request.text();
    console.log("[Site Config] Raw request body:", text);

    if (!text || text.trim() === "") {
      console.log("[Site Config] Empty request body");
      json(400, { message: "Request body is empty" });
      return;
    }

    body = JSON.parse(text);
    console.log("[Site Config] Parsed request body:", body);
  } catch (parseError) {
    console.error("[Site Config] JSON parse error:", parseError);
    json(400, {
      message: "Invalid JSON in request body",
      error:
        parseError instanceof Error ? parseError.message : String(parseError),
    });
    return;
  }

  try {
    const {
      channelName,
      channelDescription,
      aboutText,
      customCss,
      selectedTemplate,
      bannerImage,
      avatarImage,
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
      bannerImage: bannerImage || "",
      avatarImage: avatarImage || "",
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
