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
const RETRO_TEMPLATE_PATH = join(process.cwd(), "src", "themes", "retro.css");
const MODERN_TEMPLATE_PATH = join(process.cwd(), "src", "themes", "modern.css");
const CYBERPUNK_TEMPLATE_PATH = join(
  process.cwd(),
  "src",
  "themes",
  "cyberpunk.css"
);

interface ThemeConfig {
  selectedTemplate?: string;
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
    selectedTemplate: "modern",
    customCss: "",
    lastUpdated: new Date().toISOString(),
  };
}

function getThemeContent(themeName: string): string | null {
  try {
    let themePath: string;

    switch (themeName) {
      case "retro":
        themePath = RETRO_TEMPLATE_PATH;
        break;
      case "modern":
        themePath = MODERN_TEMPLATE_PATH;
        break;
      case "cyberpunk":
        themePath = CYBERPUNK_TEMPLATE_PATH;
        break;
      default:
        return null;
    }

    if (existsSync(themePath)) {
      return readFileSync(themePath, "utf-8");
    }

    return null;
  } catch (error) {
    console.error(`Error reading theme ${themeName}:`, error);
    return null;
  }
}

/**
 * Get the current theme CSS content
 * This returns either the selected template CSS or custom CSS
 */
export const getCurrentThemeCSS = server$(async function () {
  try {
    const config = loadSiteConfig();
    console.log("[Theme Utils] Loading theme config:", {
      selectedTemplate: config.selectedTemplate,
      hasCustomCss: !!config.customCss
    });
    
    // If custom CSS exists, use it
    if (config.customCss && config.customCss.trim()) {
      console.log("[Theme Utils] Using custom CSS");
      return config.customCss;
    }
    
    // Otherwise, load the selected template
    const themeName = config.selectedTemplate || "modern";
    console.log("[Theme Utils] Loading theme template:", themeName);
    const themeContent = getThemeContent(themeName);
    
    if (themeContent) {
      console.log("[Theme Utils] Theme content loaded, length:", themeContent.length);
      return themeContent;
    }
    
    // Fallback to modern theme
    console.log("[Theme Utils] Falling back to modern theme");
    return getThemeContent("modern") || "";
  } catch (error) {
    console.error("Error getting current theme CSS:", error);
    return "";
  }
});

/**
 * Apply a theme template
 */
export const applyThemeTemplate = server$(async function (themeName: string) {
  try {
    console.log("[Theme Utils] Applying theme:", themeName);
    
    // Verify theme exists
    const themeContent = getThemeContent(themeName);
    
    if (!themeContent) {
      console.error("[Theme Utils] Theme not found:", themeName);
      return {
        success: false,
        error: `Theme "${themeName}" not found`,
      };
    }
    
    // Load current config
    const config = loadSiteConfig();
    console.log("[Theme Utils] Current config:", config);
    
    // Update config with new theme and clear custom CSS
    config.selectedTemplate = themeName;
    config.customCss = "";
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
      message: `Theme "${themeName}" applied successfully`,
    };
  } catch (error) {
    console.error("Error applying theme template:", error);
    return {
      success: false,
      error: `Failed to apply theme: ${error instanceof Error ? error.message : String(error)}`,
    };
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
    config.selectedTemplate = ""; // Clear template selection when using custom CSS
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
 * Get available themes
 */
export const getAvailableThemes = server$(async function () {
  return [
    {
      name: "retro",
      displayName: "Retro Theme",
      description:
        "Pixelated retro gaming aesthetic with bold colors and sharp edges",
      available: existsSync(RETRO_TEMPLATE_PATH),
    },
    {
      name: "modern",
      displayName: "Modern Theme",
      description:
        "Sleek minimalist design with rounded corners and subtle shadows",
      available: existsSync(MODERN_TEMPLATE_PATH),
    },
    {
      name: "cyberpunk",
      displayName: "Cyberpunk Theme",
      description:
        "Futuristic neon-lit aesthetic with glowing effects and dark backgrounds",
      available: existsSync(CYBERPUNK_TEMPLATE_PATH),
    },
  ];
});

/**
 * Get theme configuration
 */
export const getThemeConfig = server$(async function (): Promise<ThemeConfig> {
  try {
    const config = loadSiteConfig();
    return {
      selectedTemplate: config.selectedTemplate || "modern",
      customCss: config.customCss || "",
    };
  } catch (error) {
    console.error("Error getting theme config:", error);
    return {
      selectedTemplate: "modern",
      customCss: "",
    };
  }
});
