# System Update Documentation

## Overview

The system update feature allows administrators to automatically update the Prometheus application from GitHub releases directly through the admin interface.

## Features

### 1. Version Tracking

- **Current Version**: Displays the version from `package.json`
- **Latest Version**: Fetches the latest release from GitHub
- **Update Indicator**: Shows when updates are available

### 2. Update Process

The system performs a complete update workflow:

1. **Check for Updates**: Queries GitHub API for the latest release
2. **Download**: Downloads the release tarball from GitHub
3. **Extract**: Extracts files to a temporary directory
4. **Apply**: Copies new files while preserving:
   - `.env` configuration
   - `public/videos` content
   - `temp` and `data` directories
5. **Version Update**: Updates `package.json` with new version
6. **Rebuild**: Installs dependencies and rebuilds the application
7. **Restart**: Restarts the Docker container

### 3. API Endpoints

#### Check for Updates

```
GET /api/admin/system-update?action=check
```

Returns:

- Current version
- Latest available version
- Update availability status
- Release notes

#### Perform Update

```
GET /api/admin/system-update?action=update
```

Performs full update process and restarts container.

#### Restart Only

```
GET /api/admin/system-update?action=restart
```

Restarts container without updating.

#### Status

```
GET /api/admin/system-update?action=status
```

Returns system status and available actions.

## Configuration

### Environment Variables

Set these in your `.env` file or docker-compose:

```env
GITHUB_OWNER=ItsAshn
GITHUB_REPO=Prometheus
CONTAINER_NAME=prometheus
JWT_SECRET=your-secret-key
```

### Docker Requirements

The container needs:

1. Docker socket mounted: `/var/run/docker.sock:/var/run/docker.sock`
2. `tar` utility (included in Alpine base image)
3. Restart policy: `restart: unless-stopped`

## Usage

### Through Admin Interface

1. Navigate to Admin Panel → System Update
2. Click "Check for Updates" to see available versions
3. Review release notes if an update is available
4. Click "Update from GitHub" to perform the update
5. Wait for the container to restart

### Manual Update

You can also trigger updates via API:

```bash
curl -X GET "http://localhost:3000/api/admin/system-update?action=update" \
  -H "Cookie: admin-auth-token=YOUR_TOKEN"
```

## Security

### Authorization

All update endpoints require:

- Valid admin authentication token
- JWT verification with admin privileges

### File Preservation

The update process preserves:

- Environment configuration (`.env`)
- User data (`public/videos`, `data`, `temp`)
- Docker volumes

### Backup Strategy

Before each update:

- `.env` file is backed up to `temp/backup/`
- User can restore previous version manually if needed

## Troubleshooting

### Update Fails

1. Check container logs: `docker logs prometheus`
2. Verify GitHub API access (no rate limiting)
3. Ensure sufficient disk space
4. Check Docker socket permissions

### Container Won't Restart

1. Verify restart policy in docker-compose.yml
2. Check Docker service status
3. Review container health checks

### Version Mismatch

1. Clear temp directory: `rm -rf temp/update`
2. Manually update package.json version
3. Restart container

## Development Notes

### Version Format

- Releases should use semantic versioning: `v1.0.0`
- Development versions: `dev-{commit-hash}`

### Release Process

1. Create a GitHub release with tag (e.g., `v1.1.0`)
2. Add release notes describing changes
3. System will automatically detect new release

### Testing

Test the update system:

1. Check for updates in development
2. Verify version detection
3. Test update process in staging environment
4. Monitor logs during update

## Architecture

### Component Structure

```
Frontend: SimpleSystemUpdater component
    ↓ (server$ functions)
Backend: /api/admin/system-update endpoint
    ↓
Update Functions:
    - getLatestRelease()
    - downloadAndExtractUpdate()
    - applyUpdate()
    - rebuildApplication()
    - restartDockerContainer()
```

### Update Flow

```
Check GitHub → Download Tarball → Extract Files →
Apply Changes → Update package.json → Install Dependencies →
Build App → Restart Container
```

## Future Enhancements

- Rollback functionality
- Update scheduling
- Automatic update checks
- Update history/changelog
- Pre-update health checks
- Post-update verification
