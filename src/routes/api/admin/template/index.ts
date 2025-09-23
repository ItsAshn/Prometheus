import type { RequestHandler } from "@builder.io/qwik-city";
import { writeFileSync, readFileSync, existsSync } from "fs";
import { join } from "path";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-jwt-key";
const CONFIG_FILE_PATH = join(process.cwd(), "temp", "site-config.json");
const GLOBAL_CSS_PATH = join(process.cwd(), "src", "global.css");
const BACKUP_CSS_PATH = join(process.cwd(), "temp", "global.css.backup");

// Template file paths
const RETRO_TEMPLATE_PATH = join(process.cwd(), "src", "global.css.original");
const MODERN_TEMPLATE_PATH = join(process.cwd(), "src", "themes", "modern.css");

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

function loadSiteConfig(): any {
  try {
    if (existsSync(CONFIG_FILE_PATH)) {
      const configData = readFileSync(CONFIG_FILE_PATH, "utf-8");
      return JSON.parse(configData);
    }
  } catch (error) {
    console.error("Error loading site config:", error);
  }
  return null;
}

function getTemplateContent(templateName: string): string | null {
  try {
    let templatePath: string;

    switch (templateName) {
      case "retro":
        // Use the original global.css if available, otherwise use current
        templatePath = existsSync(RETRO_TEMPLATE_PATH)
          ? RETRO_TEMPLATE_PATH
          : GLOBAL_CSS_PATH;
        break;
      case "modern":
        templatePath = MODERN_TEMPLATE_PATH;
        break;
      default:
        return null;
    }

    if (existsSync(templatePath)) {
      return readFileSync(templatePath, "utf-8");
    }

    return null;
  } catch (error) {
    console.error(`Error reading template ${templateName}:`, error);
    return null;
  }
}

export const onPost: RequestHandler = async ({ json, request }) => {
  if (!verifyAdminToken(request)) {
    json(401, { message: "Unauthorized" });
    return;
  }

  try {
    const body = await request.json();
    const { templateName } = body;

    if (!templateName || typeof templateName !== "string") {
      json(400, { message: "Template name is required" });
      return;
    }

    const templateContent = getTemplateContent(templateName);

    if (!templateContent) {
      json(404, { message: `Template "${templateName}" not found` });
      return;
    }

    // Create backup of current CSS if it doesn't exist
    if (!existsSync(BACKUP_CSS_PATH) && existsSync(GLOBAL_CSS_PATH)) {
      const currentCss = readFileSync(GLOBAL_CSS_PATH, "utf-8");
      writeFileSync(BACKUP_CSS_PATH, currentCss);
    }

    // Apply the template
    writeFileSync(GLOBAL_CSS_PATH, templateContent);

    // Update the site config to store the selected template
    const config = loadSiteConfig();
    if (config) {
      config.selectedTemplate = templateName;
      config.customCss = ""; // Clear custom CSS when applying template
      config.lastUpdated = new Date().toISOString();
      writeFileSync(CONFIG_FILE_PATH, JSON.stringify(config, null, 2));
    }

    json(200, {
      message: `Template "${templateName}" applied successfully`,
      templateName,
    });
  } catch (error) {
    console.error("Error applying template:", error);
    json(500, { message: "Internal server error" });
  }
};

export const onGet: RequestHandler = async ({ json, request }) => {
  if (!verifyAdminToken(request)) {
    json(401, { message: "Unauthorized" });
    return;
  }

  try {
    const templates = [
      {
        name: "retro",
        displayName: "Retro Theme",
        description:
          "Pixelated retro gaming aesthetic with bold colors and sharp edges",
        available:
          existsSync(RETRO_TEMPLATE_PATH) || existsSync(GLOBAL_CSS_PATH),
      },
      {
        name: "modern",
        displayName: "Modern Theme",
        description:
          "Sleek minimalist design with rounded corners and subtle shadows",
        available: existsSync(MODERN_TEMPLATE_PATH),
      },
    ];

    json(200, { templates });
  } catch (error) {
    console.error("Error getting templates:", error);
    json(500, { message: "Internal server error" });
  }
};
