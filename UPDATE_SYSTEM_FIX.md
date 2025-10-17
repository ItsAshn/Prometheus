# Update System Fix & Enhancement

## Issue Fixed

**Error:** `Uncaught (in promise) ReferenceError: handleCheckUpdates is not defined`

**Root Cause:** The `handleCheckUpdates` function was being called in `useVisibleTask$` before it was defined in the component.

## Changes Made

### 1. Fixed Function Definition Order (`simple-system-updater.tsx`)

- Moved `handleCheckUpdates` function definition **before** `useVisibleTask$`
- This ensures the function exists when it's called during component initialization

### 2. Enhanced Version Comparison System (`system-update/index.ts`)

- Added `compareVersions()` function for intelligent version comparison
- Compares version numbers semantically (e.g., 1.2.0 vs 1.2.1)
- Handles versions with and without 'v' prefix
- Properly detects when updates are available

### 3. Pre-Release Support

- Modified `getLatestRelease()` to support fetching pre-release versions
- Added `includePrereleases` parameter to all update functions
- API now accepts `?prerelease=true` query parameter

### 4. Improved GitHub API Integration

- Fetches all releases instead of just `/releases/latest`
- Can filter for stable releases or include pre-releases
- Returns additional metadata (isPrerelease flag)
- Better error handling with detailed error messages

### 5. Enhanced UI (`simple-system-updater.tsx`)

- Added checkbox to "Include pre-release versions"
- Shows "PRE-RELEASE" badge next to pre-release versions
- UI disables pre-release checkbox while checking/updating
- Informational text about pre-release risks
- Styled with orange badge for pre-release identification

## How It Works Now

### Version Checking Flow

1. User visits admin panel → component auto-checks for updates
2. Gets current version from `package.json`
3. Queries GitHub API for latest release
4. If "Include pre-releases" is checked, considers pre-release versions
5. Compares versions semantically
6. Displays results with update badge if available

### Update Flow

1. User clicks "Update from GitHub"
2. Downloads release tarball from GitHub
3. Extracts to temporary directory
4. Backs up critical files (.env, etc.)
5. Copies new files (excluding node_modules, videos, data, etc.)
6. Updates package.json version to match GitHub release tag
7. Runs `pnpm install` and `pnpm build`
8. Restarts Docker container

### API Endpoints

#### Check for Updates

```
GET /api/admin/system-update?action=check
GET /api/admin/system-update?action=check&prerelease=true
```

Response:

```json
{
  "success": true,
  "currentVersion": "1.0.0",
  "latestVersion": "v1.1.0",
  "updateAvailable": true,
  "releaseNotes": "Release notes text...",
  "isPrerelease": false
}
```

#### Perform Update

```
GET /api/admin/system-update?action=update
GET /api/admin/system-update?action=update&prerelease=true
```

#### Restart Container

```
GET /api/admin/system-update?action=restart
```

## Configuration

### Environment Variables (in .env)

```bash
# GitHub repository details
GITHUB_OWNER=ItsAshn
GITHUB_REPO=Prometheus

# Docker container name for restarts
CONTAINER_NAME=prometheus

# Admin authentication
JWT_SECRET=your-super-secret-jwt-key
```

### package.json Version

The version in `package.json` should match your GitHub release tags:

- GitHub Tag: `v1.0.0` → package.json: `"version": "1.0.0"`
- The update system automatically syncs these during updates

## Version Comparison Examples

```
Current: 1.0.0, Latest: 1.0.1 → Update Available ✅
Current: 1.0.0, Latest: 1.0.0 → Up to Date ✅
Current: 1.2.3, Latest: 1.2.2 → Up to Date ✅
Current: v1.0.0, Latest: 1.0.1 → Update Available ✅ (handles 'v' prefix)
```

## Features

✅ **Automatic version checking** on admin panel load
✅ **Semantic version comparison** (not just string matching)
✅ **Pre-release support** with opt-in checkbox
✅ **Release notes display** from GitHub
✅ **One-click updates** from GitHub releases
✅ **Automatic rebuild** after update
✅ **Container restart** with graceful shutdown
✅ **Backup preservation** of .env and critical files
✅ **Video/data preservation** during updates

## Testing

To test the update system:

1. **Check Version Display**
   - Visit admin panel → System Updates section
   - Should show current version from package.json

2. **Check for Updates**
   - Click "Check for Updates"
   - Should query GitHub and display latest version

3. **Test Pre-release Toggle**
   - Check "Include pre-release versions"
   - Click "Check for Updates"
   - Should now include pre-release candidates

4. **Perform Update** (⚠️ Only in test environment)
   - Ensure proper backup exists
   - Click "Update from GitHub"
   - Monitor progress in UI
   - Container should restart automatically

## Security Notes

- All endpoints require admin authentication (JWT token)
- Updates only download from configured GitHub repository
- Critical files (.env) are backed up and restored
- User data directories are preserved during updates

## Troubleshooting

### "No releases found on GitHub"

- Check that GITHUB_OWNER and GITHUB_REPO are correct
- Ensure the repository has at least one release tagged

### "Failed to download/extract update"

- Check network connectivity to GitHub
- Verify `tar` command is available in container

### "Failed to rebuild application"

- Ensure `pnpm` is installed
- Check that all dependencies are in package.json
- Review build logs for specific errors

### Update doesn't reflect

- Check package.json version was updated
- Ensure container actually restarted
- Clear browser cache and refresh

## Future Enhancements

Potential improvements:

- Rollback functionality
- Detailed changelog view
- Update scheduling
- Automatic update checks (daily/weekly)
- Email notifications for new releases
- Dry-run mode to test updates
