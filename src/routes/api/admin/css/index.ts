import type { RequestHandler } from "@builder.io/qwik-city";
import { writeFileSync, readFileSync, existsSync } from "fs";
import { join } from "path";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-jwt-key";
const CONFIG_FILE_PATH = join(process.cwd(), "temp", "site-config.json");
const GLOBAL_CSS_PATH = join(process.cwd(), "src", "global.css");
const BACKUP_CSS_PATH = join(process.cwd(), "temp", "global.css.backup");

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

export const onPost: RequestHandler = async ({ json, request }) => {
  if (!verifyAdminToken(request)) {
    json(401, { message: "Unauthorized" });
    return;
  }

  try {
    const body = await request.json();
    const { cssContent } = body;

    if (typeof cssContent !== "string") {
      json(400, { message: "CSS content must be a string" });
      return;
    }

    // Create backup of current CSS if it doesn't exist
    if (!existsSync(BACKUP_CSS_PATH) && existsSync(GLOBAL_CSS_PATH)) {
      const currentCss = readFileSync(GLOBAL_CSS_PATH, "utf-8");
      writeFileSync(BACKUP_CSS_PATH, currentCss);
    }

    // Write the new CSS content
    writeFileSync(GLOBAL_CSS_PATH, cssContent);

    // Update the site config to store the custom CSS
    const config = loadSiteConfig();
    if (config) {
      config.customCss = cssContent;
      config.lastUpdated = new Date().toISOString();
      writeFileSync(CONFIG_FILE_PATH, JSON.stringify(config, null, 2));
    }

    json(200, {
      message: "CSS updated successfully",
    });
  } catch (error) {
    console.error("Error updating CSS:", error);
    json(500, { message: "Internal server error" });
  }
};

export const onGet: RequestHandler = async ({ json, request }) => {
  if (!verifyAdminToken(request)) {
    json(401, { message: "Unauthorized" });
    return;
  }

  try {
    // Return the current CSS content
    if (existsSync(GLOBAL_CSS_PATH)) {
      const currentCss = readFileSync(GLOBAL_CSS_PATH, "utf-8");
      json(200, { cssContent: currentCss });
    } else {
      json(404, { message: "CSS file not found" });
    }
  } catch (error) {
    console.error("Error reading CSS:", error);
    json(500, { message: "Internal server error" });
  }
};
