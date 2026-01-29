#!/bin/bash

# Prometheus Update Script
# Pulls the latest Docker image and updates the running container

set -e

echo "🔄 Prometheus Update Script"
echo "=========================="
echo ""

# Check if docker-compose exists
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ docker-compose.yml not found. Run this from the project root."
    exit 1
fi

CONTAINER_NAME="${CONTAINER_NAME:-prometheus}"
IMAGE_NAME="${IMAGE_NAME:-itsashn/prometheus}"
IMAGE_TAG="${IMAGE_TAG:-latest}"

echo "Container: $CONTAINER_NAME"
echo "Image: $IMAGE_NAME:$IMAGE_TAG"
echo ""

# Pull latest image
echo "📥 Pulling latest image..."
docker-compose pull prometheus

if [ $? -ne 0 ]; then
    echo "❌ Failed to pull image"
    exit 1
fi

# Stop and recreate containers
echo "🔄 Updating container..."
docker-compose up -d --force-recreate prometheus

if [ $? -ne 0 ]; then
    echo "❌ Failed to start container"
    exit 1
fi

# Wait for service to be healthy
echo "⏳ Waiting for service to be healthy..."
MAX_RETRIES=30
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    sleep 2
    
    # Check if container is running
    if docker ps | grep -q "$CONTAINER_NAME"; then
        # Check health status if healthcheck is configured
        HEALTH_STATUS=$(docker inspect --format='{{.State.Health.Status}}' "$CONTAINER_NAME" 2>/dev/null || echo "none")
        
        if [ "$HEALTH_STATUS" = "healthy" ]; then
            echo "✅ Update successful!"
            echo "🌐 Prometheus is running at http://localhost:3000"
            echo ""
            echo "📊 Container Info:"
            docker ps --filter "name=$CONTAINER_NAME" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
            echo ""
            echo "💡 Rollback instructions:"
            echo "   If something went wrong, you can rollback by:"
            echo "   1. docker-compose down"
            echo "   2. Edit docker-compose.yml to use a specific version tag"
            echo "   3. docker-compose up -d"
            exit 0
        elif [ "$HEALTH_STATUS" = "unhealthy" ]; then
            echo "❌ Health check failed. Container is unhealthy."
            echo "Check logs with: docker-compose logs prometheus"
            exit 1
        elif [ "$HEALTH_STATUS" = "none" ]; then
            # No healthcheck configured, just verify it's running
            echo "✅ Update successful!"
            echo "🌐 Prometheus is running at http://localhost:3000"
            echo ""
            echo "📊 Container Info:"
            docker ps --filter "name=$CONTAINER_NAME" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
            echo ""
            echo "💡 Rollback instructions:"
            echo "   If something went wrong, you can rollback by:"
            echo "   1. docker-compose down"
            echo "   2. Edit docker-compose.yml to use a specific version tag"
            echo "   3. docker-compose up -d"
            exit 0
        fi
    else
        echo "❌ Container is not running"
        exit 1
    fi
    
    RETRY_COUNT=$((RETRY_COUNT + 1))
    echo "⏳ Waiting for container to be healthy... ($RETRY_COUNT/$MAX_RETRIES)"
done

echo "⚠️  Health check timeout. Container may still be starting."
echo "Check logs with: docker-compose logs prometheus"
exit 1
