#!/bin/bash

# Docker Update Script for Prometheus Qwik App
# This script pulls the latest Docker image and restarts the container

set -e

CONTAINER_NAME="${CONTAINER_NAME:-prometheus}"
IMAGE_NAME="${IMAGE_NAME:-itsashn/prometheus}"
IMAGE_TAG="${IMAGE_TAG:-latest}"

echo "🔄 Updating Prometheus Qwik App..."
echo "Container: $CONTAINER_NAME"
echo "Image: $IMAGE_NAME:$IMAGE_TAG"
echo ""

# Pull latest image
echo "📦 Pulling latest image from Docker Hub..."
docker pull "$IMAGE_NAME:$IMAGE_TAG"

if [ $? -ne 0 ]; then
    echo "❌ Failed to pull image"
    exit 1
fi

# Stop current container
echo "⏹️  Stopping current container..."
docker-compose down

if [ $? -ne 0 ]; then
    echo "⚠️  Failed to stop container gracefully, forcing..."
    docker stop "$CONTAINER_NAME" || true
    docker rm "$CONTAINER_NAME" || true
fi

# Start with new image
echo "▶️  Starting updated container..."
docker-compose up -d

if [ $? -ne 0 ]; then
    echo "❌ Failed to start container"
    exit 1
fi

# Wait for health check
echo "🏥 Waiting for health check..."
MAX_RETRIES=30
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    sleep 2
    
    # Check if container is running
    if docker ps | grep -q "$CONTAINER_NAME"; then
        # Check health status
        HEALTH_STATUS=$(docker inspect --format='{{.State.Health.Status}}' "$CONTAINER_NAME" 2>/dev/null || echo "none")
        
        if [ "$HEALTH_STATUS" = "healthy" ]; then
            echo "✅ Update successful! Container is healthy."
            echo ""
            echo "📊 Container Info:"
            docker ps --filter "name=$CONTAINER_NAME" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
            echo ""
            echo "📜 Recent logs:"
            docker-compose logs --tail=20
            exit 0
        elif [ "$HEALTH_STATUS" = "unhealthy" ]; then
            echo "❌ Health check failed. Container is unhealthy."
            echo ""
            echo "📜 Container logs:"
            docker-compose logs --tail=50
            exit 1
        fi
    else
        echo "❌ Container is not running"
        exit 1
    fi
    
    RETRY_COUNT=$((RETRY_COUNT + 1))
    echo "⏳ Waiting for health check... ($RETRY_COUNT/$MAX_RETRIES)"
done

echo "⚠️  Health check timeout. Container may still be starting."
echo ""
echo "📜 Recent logs:"
docker-compose logs --tail=50

exit 1
