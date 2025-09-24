# Use Node.js 20 with Alpine for smaller image size
FROM node:20-alpine

# Install ffmpeg for video processing, git for updates, and docker CLI for container management
RUN apk add --no-cache ffmpeg git docker-cli

# Create app directory
WORKDIR /app

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

# Build the application for production with Express
RUN pnpm build.server

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