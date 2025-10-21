# Docker Update Script for Prometheus Qwik App (PowerShell)
# This script pulls the latest Docker image and restarts the container

$ErrorActionPreference = "Stop"

$CONTAINER_NAME = if ($env:CONTAINER_NAME) { $env:CONTAINER_NAME } else { "prometheus" }
$IMAGE_NAME = if ($env:IMAGE_NAME) { $env:IMAGE_NAME } else { "itsashn/prometheus" }
$IMAGE_TAG = if ($env:IMAGE_TAG) { $env:IMAGE_TAG } else { "latest" }

Write-Host "🔄 Updating Prometheus Qwik App..." -ForegroundColor Cyan
Write-Host "Container: $CONTAINER_NAME"
Write-Host "Image: ${IMAGE_NAME}:${IMAGE_TAG}"
Write-Host ""

# Pull latest image
Write-Host "📦 Pulling latest image from Docker Hub..." -ForegroundColor Yellow
try {
    docker pull "${IMAGE_NAME}:${IMAGE_TAG}"
    if ($LASTEXITCODE -ne 0) { throw "Failed to pull image" }
} catch {
    Write-Host "❌ Failed to pull image: $_" -ForegroundColor Red
    exit 1
}

# Stop current container
Write-Host "⏹️  Stopping current container..." -ForegroundColor Yellow
try {
    docker-compose down
    if ($LASTEXITCODE -ne 0) {
        Write-Host "⚠️  Failed to stop container gracefully, forcing..." -ForegroundColor Yellow
        docker stop $CONTAINER_NAME 2>$null
        docker rm $CONTAINER_NAME 2>$null
    }
} catch {
    Write-Host "⚠️  Error stopping container: $_" -ForegroundColor Yellow
}

# Start with new image
Write-Host "▶️  Starting updated container..." -ForegroundColor Yellow
try {
    docker-compose up -d
    if ($LASTEXITCODE -ne 0) { throw "Failed to start container" }
} catch {
    Write-Host "❌ Failed to start container: $_" -ForegroundColor Red
    exit 1
}

# Wait for health check
Write-Host "🏥 Waiting for health check..." -ForegroundColor Yellow
$MAX_RETRIES = 30
$RETRY_COUNT = 0

while ($RETRY_COUNT -lt $MAX_RETRIES) {
    Start-Sleep -Seconds 2
    
    # Check if container is running
    $containerRunning = docker ps | Select-String $CONTAINER_NAME
    
    if ($containerRunning) {
        # Check health status
        try {
            $healthStatus = docker inspect --format='{{.State.Health.Status}}' $CONTAINER_NAME 2>$null
            
            if ($healthStatus -eq "healthy") {
                Write-Host "✅ Update successful! Container is healthy." -ForegroundColor Green
                Write-Host ""
                Write-Host "📊 Container Info:" -ForegroundColor Cyan
                docker ps --filter "name=$CONTAINER_NAME" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
                Write-Host ""
                Write-Host "📜 Recent logs:" -ForegroundColor Cyan
                docker-compose logs --tail=20
                exit 0
            } elseif ($healthStatus -eq "unhealthy") {
                Write-Host "❌ Health check failed. Container is unhealthy." -ForegroundColor Red
                Write-Host ""
                Write-Host "📜 Container logs:" -ForegroundColor Yellow
                docker-compose logs --tail=50
                exit 1
            }
        } catch {
            # Health check not available yet, continue waiting
        }
    } else {
        Write-Host "❌ Container is not running" -ForegroundColor Red
        exit 1
    }
    
    $RETRY_COUNT++
    Write-Host "⏳ Waiting for health check... ($RETRY_COUNT/$MAX_RETRIES)" -ForegroundColor Yellow
}

Write-Host "⚠️  Health check timeout. Container may still be starting." -ForegroundColor Yellow
Write-Host ""
Write-Host "📜 Recent logs:" -ForegroundColor Cyan
docker-compose logs --tail=50

exit 1
