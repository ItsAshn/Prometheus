# Use Node.js 22 LTS with Alpine for smaller image size and better security
FROM node:22-alpine

# Install ffmpeg for video processing, git for updates, and docker CLI for container management
RUN apk add --no-cache ffmpeg git docker-cli

# Verify ffmpeg and ffprobe are installed correctly
RUN ffmpeg -version && ffprobe -version

# Create app directory
WORKDIR /app

# Set version information (can be overridden during build)
ARG APP_VERSION=v1.0.0
ENV APP_VERSION=$APP_VERSION

# Create necessary directories for the application
RUN mkdir -p /app/public/videos/hls /app/temp /app/tmp /app/data

# Copy package files first for better Docker layer caching
COPY package.json pnpm-lock.yaml ./

# Install pnpm globally
RUN npm install -g pnpm

# Install dependencies
RUN pnpm install --frozen-lockfile --prod=false

# Copy source code and configuration files
COPY . .

# Clean any existing build artifacts and build fresh
RUN rm -rf dist server .qwik tmp node_modules/.vite node_modules/.cache || true

# Build the application for production with optimizations
RUN NODE_ENV=production pnpm build.client && NODE_ENV=production pnpm build.server

# Run cleanup to remove build artifacts and temp files
RUN node scripts/cleanup.js || true

# Ensure all files have correct permissions
RUN chmod -R 755 /app && chmod 666 /app/package.json

# Keep all dependencies since Qwik packages are needed at runtime
# Skip pruning: RUN pnpm prune --prod

# Expose the port the app runs on
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

# Start the Express server
CMD ["pnpm", "serve"]