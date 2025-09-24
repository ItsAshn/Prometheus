#!/bin/bash

# Prometheus System Update Script
# This script can be used to update the system manually if needed

echo "🔄 Starting Prometheus system update..."

# Check if we're in the right directory
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ Error: docker-compose.yml not found. Please run this script from the project root."
    exit 1
fi

# Check if Git repository exists
if [ ! -d ".git" ]; then
    echo "❌ Error: Not a Git repository. Cannot perform update."
    exit 1
fi

echo "📥 Fetching latest changes..."
git fetch origin

# Check if there are updates available
BEHIND=$(git rev-list --count HEAD..origin/main 2>/dev/null || git rev-list --count HEAD..origin/master 2>/dev/null || echo "0")

if [ "$BEHIND" -eq "0" ]; then
    echo "✅ Already up to date. No updates available."
    exit 0
fi

echo "📊 Found $BEHIND new commit(s) available"

# Show what will be updated
echo "📋 Changes to be applied:"
git log --oneline HEAD..origin/main 2>/dev/null || git log --oneline HEAD..origin/master 2>/dev/null

# Ask for confirmation
read -p "🤔 Do you want to proceed with the update? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Update cancelled."
    exit 0
fi

echo "📥 Pulling latest changes..."
git pull origin main 2>/dev/null || git pull origin master 2>/dev/null

if [ $? -ne 0 ]; then
    echo "❌ Error: Failed to pull changes. Please resolve conflicts manually."
    exit 1
fi

echo "🐳 Stopping current containers..."
docker-compose down

echo "🔨 Building and starting updated containers..."
docker-compose up -d --build

if [ $? -eq 0 ]; then
    echo "✅ Update completed successfully!"
    echo "🌐 Application should be available at your configured URL in a few moments."
else
    echo "❌ Error: Failed to start updated containers."
    exit 1
fi

echo "🎉 System update complete!"