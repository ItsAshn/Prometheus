# Version Check Script for Prometheus Qwik App (PowerShell)
# This script checks if a new version is available on Docker Hub

$ErrorActionPreference = "Stop"

$IMAGE_NAME = if ($env:IMAGE_NAME) { $env:IMAGE_NAME } else { "itsashn/prometheus" }
$IMAGE_TAG = if ($env:IMAGE_TAG) { $env:IMAGE_TAG } else { "latest" }

Write-Host "🔍 Checking for updates..." -ForegroundColor Cyan
Write-Host "Image: ${IMAGE_NAME}:${IMAGE_TAG}"
Write-Host ""

# Get current image digest if running in Docker
if ($env:DOCKER_CONTAINER) {
    Write-Host "📦 Current Version:" -ForegroundColor Yellow
    Write-Host "  Version: $(if ($env:APP_VERSION) { $env:APP_VERSION } else { 'Unknown' })"
    Write-Host "  Build Date: $(if ($env:BUILD_DATE) { $env:BUILD_DATE } else { 'Unknown' })"
    Write-Host "  Commit: $(if ($env:VCS_REF) { $env:VCS_REF } else { 'Unknown' })"
    Write-Host ""
}

# Fetch latest tag info from Docker Hub
Write-Host "🌐 Fetching latest version from Docker Hub..." -ForegroundColor Yellow

$DOCKER_HUB_URL = "https://hub.docker.com/v2/repositories/$IMAGE_NAME/tags/$IMAGE_TAG"

try {
    $response = Invoke-RestMethod -Uri $DOCKER_HUB_URL -Method Get -ErrorAction Stop
    
    Write-Host "📊 Latest Version on Docker Hub:" -ForegroundColor Yellow
    Write-Host "  Tag: $($response.name)"
    Write-Host "  Last Updated: $($response.last_updated)"
    Write-Host ""
    
    # Compare if running in Docker and BUILD_DATE is available
    if ($env:BUILD_DATE -and $response.last_updated) {
        try {
            $currentDate = [DateTime]::Parse($env:BUILD_DATE)
            $latestDate = [DateTime]::Parse($response.last_updated)
            
            if ($latestDate -gt $currentDate) {
                Write-Host "🔄 UPDATE AVAILABLE!" -ForegroundColor Green
                Write-Host ""
                Write-Host "To update, run:" -ForegroundColor Cyan
                Write-Host "  docker-compose pull"
                Write-Host "  docker-compose up -d"
                Write-Host ""
                Write-Host "Or use the update script:" -ForegroundColor Cyan
                Write-Host "  .\scripts\update-docker.ps1"
            } else {
                Write-Host "✅ You are running the latest version" -ForegroundColor Green
            }
        } catch {
            Write-Host "ℹ️  Cannot determine if update is available" -ForegroundColor Yellow
            Write-Host "   (Date comparison failed)"
        }
    } else {
        Write-Host "ℹ️  Cannot determine if update is available" -ForegroundColor Yellow
        Write-Host "   (BUILD_DATE not set or comparison not possible)"
        Write-Host ""
        Write-Host "To ensure you have the latest version, run:" -ForegroundColor Cyan
        Write-Host "  docker-compose pull"
        Write-Host "  docker-compose up -d"
    }
} catch {
    Write-Host "⚠️  Could not fetch information from Docker Hub" -ForegroundColor Red
    Write-Host "   Error: $_"
    Write-Host "   Check your internet connection or try again later"
    exit 1
}
