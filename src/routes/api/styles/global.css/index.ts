import type { RequestHandler } from "@builder.io/qwik-city";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

const GLOBAL_CSS_PATH = join(process.cwd(), "src", "global.css");

export const onGet: RequestHandler = async ({ send, headers }) => {
  try {
    if (existsSync(GLOBAL_CSS_PATH)) {
      const cssContent = readFileSync(GLOBAL_CSS_PATH, "utf-8");

      // Set proper headers for CSS
      headers.set("Content-Type", "text/css");
      headers.set("Cache-Control", "no-cache, no-store, must-revalidate");

      send(200, cssContent);
    } else {
      send(404, "CSS file not found");
    }
  } catch (error) {
    console.error("Error reading CSS:", error);
    send(500, "Internal server error");
  }
};
