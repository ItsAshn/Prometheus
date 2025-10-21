#!/bin/bash

# Version Check Script for Prometheus Qwik App
# This script checks if a new version is available on Docker Hub

set -e

IMAGE_NAME="${IMAGE_NAME:-itsashn/prometheus}"
IMAGE_TAG="${IMAGE_TAG:-latest}"

echo "🔍 Checking for updates..."
echo "Image: $IMAGE_NAME:$IMAGE_TAG"
echo ""

# Get current image digest if running in Docker
if [ -n "$DOCKER_CONTAINER" ]; then
    echo "📦 Current Version:"
    echo "  Version: ${APP_VERSION:-Unknown}"
    echo "  Build Date: ${BUILD_DATE:-Unknown}"
    echo "  Commit: ${VCS_REF:-Unknown}"
    echo ""
fi

# Fetch latest tag info from Docker Hub
echo "🌐 Fetching latest version from Docker Hub..."

DOCKER_HUB_URL="https://hub.docker.com/v2/repositories/$IMAGE_NAME/tags/$IMAGE_TAG"

# Try to fetch using curl
if command -v curl &> /dev/null; then
    RESPONSE=$(curl -s "$DOCKER_HUB_URL" 2>/dev/null || echo "")
elif command -v wget &> /dev/null; then
    RESPONSE=$(wget -qO- "$DOCKER_HUB_URL" 2>/dev/null || echo "")
else
    echo "❌ Error: Neither curl nor wget is available"
    exit 1
fi

if [ -z "$RESPONSE" ]; then
    echo "⚠️  Could not fetch information from Docker Hub"
    echo "   Check your internet connection or try again later"
    exit 1
fi

# Parse the response (basic parsing without jq dependency)
LAST_UPDATED=$(echo "$RESPONSE" | grep -o '"last_updated":"[^"]*"' | cut -d'"' -f4)

if [ -z "$LAST_UPDATED" ]; then
    echo "⚠️  Could not parse Docker Hub response"
    exit 1
fi

echo "📊 Latest Version on Docker Hub:"
echo "  Tag: $IMAGE_TAG"
echo "  Last Updated: $LAST_UPDATED"
echo ""

# Compare if running in Docker and BUILD_DATE is available
if [ -n "$BUILD_DATE" ] && [ -n "$LAST_UPDATED" ]; then
    CURRENT_TIMESTAMP=$(date -d "$BUILD_DATE" +%s 2>/dev/null || echo "0")
    LATEST_TIMESTAMP=$(date -d "$LAST_UPDATED" +%s 2>/dev/null || echo "0")
    
    if [ "$LATEST_TIMESTAMP" -gt "$CURRENT_TIMESTAMP" ]; then
        echo "🔄 UPDATE AVAILABLE!"
        echo ""
        echo "To update, run:"
        echo "  docker-compose pull"
        echo "  docker-compose up -d"
        echo ""
        echo "Or use the update script:"
        echo "  ./scripts/update-docker.sh"
        exit 0
    else
        echo "✅ You are running the latest version"
        exit 0
    fi
else
    echo "ℹ️  Cannot determine if update is available"
    echo "   (BUILD_DATE not set or comparison not possible)"
    echo ""
    echo "To ensure you have the latest version, run:"
    echo "  docker-compose pull"
    echo "  docker-compose up -d"
fi

exit 0
