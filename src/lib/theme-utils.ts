import { server$ } from "@builder.io/qwik-city";
import {
  readFileSync,
  writeFileSync,
  existsSync,
  mkdirSync,
  accessSync,
  constants,
} from "fs";
import { join } from "path";

const CONFIG_FILE_PATH = join(process.cwd(), "temp", "site-config.json");

interface ThemeConfig {
  customCss?: string;
}

function loadSiteConfig(): any {
  try {
    if (existsSync(CONFIG_FILE_PATH)) {
      const configData = readFileSync(CONFIG_FILE_PATH, "utf-8");
      return JSON.parse(configData);
    }
  } catch (error) {
    console.error("Error loading site config:", error);
  }
  
  // Return default config if file doesn't exist
  return {
    channelName: "Prometheus",
    channelDescription: "Your self-hosted video platform",
    customCss: "",
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Get the current custom CSS content
 * Custom CSS is injected to override the default global.css styles
 */
export const getCurrentThemeCSS = server$(async function () {
  try {
    const config = loadSiteConfig();
    
    // Return custom CSS if it exists, otherwise empty string (global.css will be used)
    if (config.customCss && config.customCss.trim()) {
      console.log("[Theme Utils] Using custom CSS");
      return config.customCss;
    }
    
    return "";
  } catch (error) {
    console.error("Error getting custom CSS:", error);
    return "";
  }
});

/**
 * Apply custom CSS
 */
export const applyCustomCSS = server$(async function (cssContent: string) {
  try {
    console.log("[Theme Utils] Applying custom CSS");
    
    // Load current config
    const config = loadSiteConfig();
    
    // Update config with custom CSS
    config.customCss = cssContent;
    config.lastUpdated = new Date().toISOString();
    
    // Ensure temp directory exists
    const tempDir = join(process.cwd(), "temp");
    if (!existsSync(tempDir)) {
      console.log("[Theme Utils] Creating temp directory...");
      mkdirSync(tempDir, { recursive: true, mode: 0o755 });
    }
    
    // Verify directory is writable
    try {
      accessSync(tempDir, constants.W_OK);
    } catch (accessError) {
      console.error("[Theme Utils] Temp directory not writable:", accessError);
      return {
        success: false,
        error: "Cannot write to temp directory. Check permissions.",
      };
    }
    
    // Save updated config
    try {
      writeFileSync(CONFIG_FILE_PATH, JSON.stringify(config, null, 2), {
        encoding: "utf-8",
        mode: 0o644,
      });
      console.log("[Theme Utils] Config saved successfully");
    } catch (writeError) {
      console.error("[Theme Utils] Failed to write config:", writeError);
      return {
        success: false,
        error: `Failed to save config: ${writeError instanceof Error ? writeError.message : String(writeError)}`,
      };
    }
    
    return {
      success: true,
      message: "Custom CSS applied successfully",
    };
  } catch (error) {
    console.error("Error applying custom CSS:", error);
    return {
      success: false,
      error: `Failed to apply custom CSS: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
});

/**
 * Get theme configuration (custom CSS only)
 */
export const getThemeConfig = server$(async function (): Promise<ThemeConfig> {
  try {
    const config = loadSiteConfig();
    return {
      customCss: config.customCss || "",
    };
  } catch (error) {
    console.error("Error getting theme config:", error);
    return {
      customCss: "",
    };
  }
});

