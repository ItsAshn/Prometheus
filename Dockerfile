# ============================================
# Build Stage
# ============================================
FROM node:22-alpine AS builder

# Set build arguments for version tracking
ARG APP_VERSION=1.0.0
ARG BUILD_DATE
ARG VCS_REF

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files for dependency installation
COPY package.json pnpm-lock.yaml ./

# Install all dependencies (including devDependencies for build)
RUN pnpm install --frozen-lockfile

# Copy source code and configuration
COPY . .

# Clean any existing build artifacts
RUN rm -rf dist server .qwik tmp node_modules/.vite node_modules/.cache || true

# Build the application for production
RUN NODE_ENV=production pnpm build.client && \
    NODE_ENV=production pnpm build.server

# Run cleanup script to remove build artifacts
RUN node scripts/cleanup.js || true

# ============================================
# Production Stage
# ============================================
FROM node:22-alpine AS runner

# Install runtime dependencies (FFmpeg for video processing)
RUN apk add --no-cache \
    ffmpeg \
    wget \
    ca-certificates

# Verify FFmpeg installation
RUN ffmpeg -version && ffprobe -version

# Set environment variables
ARG APP_VERSION=1.0.0
ARG BUILD_DATE
ARG VCS_REF

ENV NODE_ENV=production \
    APP_VERSION=$APP_VERSION \
    BUILD_DATE=$BUILD_DATE \
    VCS_REF=$VCS_REF

# Add labels for metadata
LABEL org.opencontainers.image.title="Prometheus Video Platform" \
      org.opencontainers.image.description="Self-hosted video streaming platform built with Qwik" \
      org.opencontainers.image.version="${APP_VERSION}" \
      org.opencontainers.image.created="${BUILD_DATE}" \
      org.opencontainers.image.revision="${VCS_REF}" \
      org.opencontainers.image.source="https://github.com/ItsAshn/Prometheus" \
      org.opencontainers.image.authors="ItsAshn"

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install only production dependencies
# Note: Qwik requires some dev dependencies at runtime, so we keep all
RUN pnpm install --frozen-lockfile

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server ./server
COPY --from=builder /app/public ./public

# Copy scripts and configuration files
COPY scripts ./scripts
COPY qwik.env.d.ts tsconfig.json ./

# Create necessary directories with proper permissions
RUN mkdir -p /app/public/videos/hls /app/temp /app/tmp /app/data && \
    chmod -R 755 /app && \
    chmod 755 /app/scripts/*.js

# Expose the application port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

# Start the Express server
CMD ["pnpm", "serve"]