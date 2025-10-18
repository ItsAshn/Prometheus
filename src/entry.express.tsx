/*
 * WHAT IS THIS FILE?
 *
 * It's the entry point for the Express HTTP server when building for production.
 *
 * Learn more about Node.js server integrations here:
 * - https://qwik.dev/docs/deployments/node/
 *
 */
import {
  createQwikCity,
  type PlatformNode,
} from "@builder.io/qwik-city/middleware/node";
import "dotenv/config";
import qwikCityPlan from "@qwik-city-plan";
import render from "./entry.ssr";
import express from "express";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { ensureJWTSecret, validateEnvironment } from "./lib/env-utils";

// Ensure JWT secret exists and validate environment on startup
ensureJWTSecret();
validateEnvironment();

declare global {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface QwikCityPlatform extends PlatformNode {}
}

// Directories where the static assets are located
const distDir = join(fileURLToPath(import.meta.url), "..", "..", "dist");
const buildDir = join(distDir, "build");
const assetsDir = join(distDir, "assets");

// Allow for dynamic port
const PORT = process.env.PORT ?? 3000;

// Create the Qwik City Node middleware
const { router, notFound } = createQwikCity({
  render,
  qwikCityPlan,
  getOrigin(req) {
    // Handle proxy headers for production deployment
    const protocol =
      (req.headers["x-forwarded-proto"] ??
      req.headers["x-forwarded-ssl"] === "on")
        ? "https"
        : "http";
    const host =
      req.headers["x-forwarded-host"] ??
      req.headers["x-real-ip"] ??
      req.headers.host;
    return `${protocol}://${host}`;
  },
});

// Create the express server
// https://expressjs.com/
const app = express();

// Trust proxy for production deployment
app.set("trust proxy", true);

// Enable gzip compression for better performance
import compression from "compression";
app.use(
  compression({
    level: 6, // Compression level (1-9, 6 is good balance)
    threshold: 1024, // Only compress responses larger than 1KB
    filter: (req, res) => {
      // Don't compress if request doesn't accept encoding
      if (req.headers["x-no-compression"]) return false;
      // Use compression filter
      return compression.filter(req, res);
    },
  })
);

// Configure body parsing limits for large file uploads
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

// Static asset handlers
// https://expressjs.com/en/starter/static-files.html
app.use(`/build`, express.static(buildDir, { immutable: true, maxAge: "1y" }));
app.use(
  `/assets`,
  express.static(assetsDir, { immutable: true, maxAge: "1y" })
);

// Optimize video file serving with aggressive caching and range support
// This serves HLS playlists and segments directly without API overhead
const publicDir = join(distDir, "..", "public");

// HLS video segments (.ts, .mp4) - immutable, cache forever
app.use(
  "/videos/hls",
  express.static(join(publicDir, "videos", "hls"), {
    immutable: true,
    maxAge: "1y", // 1 year cache for segments (they never change)
    etag: true,
    lastModified: true,
    setHeaders: (res, path) => {
      // Enable range requests for video streaming
      res.setHeader("Accept-Ranges", "bytes");
      res.setHeader("Access-Control-Allow-Origin", "*");

      // Different caching for playlists vs segments
      if (path.endsWith(".m3u8")) {
        // Playlists should be cached briefly (they might update)
        res.setHeader("Cache-Control", "public, max-age=10");
      } else if (path.endsWith(".ts") || path.endsWith(".mp4")) {
        // Segments are immutable - aggressive caching
        res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      }
    },
  })
);

app.use(express.static(distDir, { redirect: false }));

// Use Qwik City's page and endpoint request handler
app.use(router);

// Use Qwik City's 404 handler
app.use(notFound);

// Start the express server
app.listen(PORT, () => {
  // Server started on port ${PORT}
});
