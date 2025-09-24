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

# Build the application
RUN pnpm build

# Remove dev dependencies to reduce image size
RUN pnpm prune --prod

# Create a non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S qwik -u 1001

# Change ownership of app directory to the nodejs user
RUN chown -R qwik:nodejs /app

# Switch to non-root user
USER qwik

# Expose the port the app runs on
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

# Start the application in preview mode (production build)
CMD ["pnpm", "preview"]