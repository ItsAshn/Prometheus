# Quick Update System Guide

## 🚀 For Users

### Checking for Updates

1. Go to Admin Panel → System Updates
2. Current version displays automatically
3. Click "**Check for Updates**" to see if new version exists
4. Check "**Include pre-release versions**" if you want cutting-edge features

### Installing Updates

1. After checking, if update is available, click "**Update from GitHub**"
2. Wait for the update process (download → apply → rebuild → restart)
3. The page will show progress messages
4. Container will restart automatically
5. Refresh your browser after restart completes

### Restarting Container

- Click "**Restart Container**" to restart without updating
- Useful for applying configuration changes

---

## 🔧 For Developers

### Creating a New Release

#### 1. Update package.json

```bash
# Edit package.json
{
  "version": "1.1.0"  # Increment this
}
```

#### 2. Commit and Tag

```bash
git add package.json
git commit -m "Bump version to 1.1.0"
git tag v1.1.0
git push origin master
git push origin v1.1.0
```

#### 3. Create GitHub Release

- Go to GitHub → Releases → Create new release
- Choose tag: `v1.1.0`
- Release title: `Version 1.1.0`
- Description: Write release notes
- Check "**Set as a pre-release**" if it's not stable
- Click "**Publish release**"

### Version Numbering

Follow Semantic Versioning (semver):

- **Major** (1.x.x): Breaking changes
- **Minor** (x.1.x): New features, backward compatible
- **Patch** (x.x.1): Bug fixes

Examples:

- `v1.0.0` → First stable release
- `v1.1.0` → Added new feature
- `v1.1.1` → Fixed bug
- `v2.0.0` → Major changes (breaking)
- `v1.2.0-beta.1` → Pre-release/beta version

### Pre-release Tags

For beta/RC versions:

- `v1.2.0-beta.1`
- `v1.2.0-beta.2`
- `v1.2.0-rc.1`
- Then final: `v1.2.0`

---

## 📋 Update System Features

✅ Automatic version checking
✅ One-click updates from GitHub
✅ Pre-release support (opt-in)
✅ Release notes display
✅ Automatic rebuild
✅ Container restart
✅ Preserves .env and user data

---

## 🛡️ Safety

### What's Preserved During Updates

- ✅ `.env` file (backed up and restored)
- ✅ `public/videos/` (your uploaded videos)
- ✅ `temp/` (user data and configs)
- ✅ `data/` (any persistent data)

### What Gets Updated

- ✅ Source code (`src/`)
- ✅ Dependencies (`package.json`, `pnpm-lock.yaml`)
- ✅ Configuration files
- ✅ Build files

---

## 🐛 Troubleshooting

### Update fails

1. Check GitHub repository is accessible
2. Verify GITHUB_OWNER and GITHUB_REPO in .env
3. Ensure container has write permissions
4. Check disk space

### Version doesn't change

1. Clear browser cache
2. Ensure container restarted successfully
3. Check `package.json` was updated

### Can't see pre-releases

1. Make sure "Include pre-release versions" is checked
2. Verify GitHub releases are marked as pre-release
3. Click "Check for Updates" after toggling checkbox

---

## 📱 Environment Variables

Add to your `.env`:

```bash
# Required
GITHUB_OWNER=ItsAshn
GITHUB_REPO=Prometheus

# Optional
CONTAINER_NAME=prometheus  # Docker container name
```

---

## 🔄 Update Flow Diagram

```
User Action → Check Updates → GitHub API
                                  ↓
                           Compare Versions
                                  ↓
                          Display Update Badge
                                  ↓
User Action → Update Button → Download Release
                                  ↓
                            Extract Files
                                  ↓
                          Backup Critical Files
                                  ↓
                            Copy New Files
                                  ↓
                        Update package.json
                                  ↓
                          pnpm install
                                  ↓
                          pnpm build
                                  ↓
                        Restart Container
                                  ↓
                          Success! ✅
```

---

## 💡 Tips

- **Always test updates in a staging environment first**
- **Create backups before major updates**
- **Read release notes before updating**
- **Avoid pre-releases in production unless necessary**
- **Tag releases consistently (always use `v` prefix)**
