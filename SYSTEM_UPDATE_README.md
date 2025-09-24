# System Update Feature

This feature allows administrators to update their Docker-based Prometheus application instance through the web interface.

## How it works

1. **Git Integration**: The system checks for updates by fetching from the configured Git repository
2. **Auto-Pull**: When updates are available, the admin can pull the latest changes with one click
3. **Container Restart**: The Docker container automatically restarts with new changes
4. **Status Monitoring**: Real-time status display shows current branch, commits, and update availability

## Security Features

- Admin authentication required for all update operations
- JWT token validation
- Docker socket access is controlled and limited

## Usage

1. Navigate to the Admin Dashboard
2. Go to "System Updates" section
3. Check current status and available updates
4. Click "Update & Restart" to apply updates
5. The container will restart automatically with new changes

## Environment Variables

- `CONTAINER_NAME`: Name of the Docker container (default: "prometheus")
- `DOCKER_CONTAINER`: Set to "true" to enable Docker-specific features

## Docker Configuration

The system requires:

- Git installed in the container
- Docker socket access for container management
- Proper restart policy in docker-compose.yml

## API Endpoints

- `GET /api/admin/system-update` - Get system status and update information
- `POST /api/admin/system-update` - Perform update operations

## Update Process

1. Fetch latest changes from Git repository
2. Pull new commits if available
3. Rebuild Docker container with new code
4. Restart application with updated version
5. Automatically redirect user after restart

## Limitations

- Only works with Git-based deployments
- Requires Docker environment for container restart
- Local changes may cause merge conflicts
- Update process takes a few minutes to complete

## Safety Features

- Automatic backup creation before updates
- Graceful container shutdown and restart
- Error handling and rollback capabilities
- User notification during update process
