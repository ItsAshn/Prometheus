# Environment Variables Reference

## Required Variables

### Admin Authentication

```bash
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-secure-password
```

- Used for admin panel login
- **⚠️ IMPORTANT:** Change these in production!

### JWT Secret

```bash
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long
```

- Used to sign authentication tokens
- **⚠️ CRITICAL:** Must be a strong random string (32+ characters)
- Generate with: `openssl rand -base64 32` or similar

### Application Environment

```bash
NODE_ENV=production
```

- Values: `development` | `production`
- Controls app behavior and optimizations

## Update System Variables (NEW!)

### GitHub Repository

```bash
GITHUB_OWNER=ItsAshn
GITHUB_REPO=Prometheus
```

- **Required for update functionality**
- Specifies which GitHub repo to check for releases
- Must match your actual GitHub repository

### Docker Container

```bash
CONTAINER_NAME=prometheus
```

- **Required for auto-restart after updates**
- Name of your Docker container
- Used by the update system to restart the container
- Default: `prometheus`

## Complete Example (.env.production)

```bash
# Admin Configuration
ADMIN_USERNAME=admin
ADMIN_PASSWORD=SuperSecurePassword123!

# JWT Secret (generate a random string)
JWT_SECRET=a8f2c9e7b4d1f6a3e8c2b5d9f7a4e1c6b3d8f5a2e9c7b4d1f6a3e8c2b5d9f7a4

# GitHub Configuration for Update System
GITHUB_OWNER=ItsAshn
GITHUB_REPO=Prometheus

# Docker Container Configuration
CONTAINER_NAME=prometheus

# Application Settings
NODE_ENV=production
```

## Development Example (.env)

```bash
# Admin Configuration
ADMIN_USERNAME=admin
ADMIN_PASSWORD=test

# JWT Secret
JWT_SECRET=dev-secret-key-not-for-production

# GitHub Configuration for Update System
GITHUB_OWNER=ItsAshn
GITHUB_REPO=Prometheus

# Docker Container Configuration
CONTAINER_NAME=prometheus

# Environment
NODE_ENV=development
```

## Security Best Practices

### 🔒 JWT_SECRET

- **Minimum 32 characters**
- Use random, unpredictable characters
- Never commit the production secret to git
- Rotate periodically

**Generate a secure secret:**

```bash
# Using OpenSSL
openssl rand -base64 32

# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Using PowerShell
[Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
```

### 🔐 ADMIN_PASSWORD

- Use a strong password (12+ characters)
- Mix uppercase, lowercase, numbers, symbols
- Don't use common words or patterns
- Consider using a password manager

### 📝 Best Practices

- Never commit `.env` to version control
- Keep `.env` files only on the server
- Use different secrets for dev/staging/production
- Restrict file permissions: `chmod 600 .env`

## Files Overview

| File              | Purpose             | Committed to Git?      |
| ----------------- | ------------------- | ---------------------- |
| `.env`            | Development config  | ❌ No (in .gitignore)  |
| `.env.production` | Production template | ✅ Yes (template only) |
| `example.env`     | Documentation       | ✅ Yes (examples)      |

## Update System Usage

The update system uses these variables to:

1. **GITHUB_OWNER & GITHUB_REPO**
   - Check for new releases
   - Download updates
   - Compare versions

2. **CONTAINER_NAME**
   - Restart container after updates
   - Execute: `docker restart prometheus`

3. **JWT_SECRET**
   - Verify admin authentication
   - Protect update endpoints

## Troubleshooting

### "Failed to check for updates"

- ✅ Check `GITHUB_OWNER` and `GITHUB_REPO` are correct
- ✅ Ensure repository is public or token is provided
- ✅ Verify internet connectivity

### "Failed to restart container"

- ✅ Check `CONTAINER_NAME` matches actual container name
- ✅ Run: `docker ps` to see container names
- ✅ Ensure Docker socket is mounted (docker.sock)

### "Unauthorized" when accessing admin panel

- ✅ Check `ADMIN_USERNAME` and `ADMIN_PASSWORD` are set
- ✅ Verify `JWT_SECRET` is configured
- ✅ Clear browser cookies and try again

## Migration from Old Setup

If you previously had:

```bash
APP_VERSION=v1.0.0  # ❌ No longer needed!
```

**Remove it!** Version is now automatically detected from:

- Git tags (if available)
- Git commit count and hash
- package.json as fallback

## Docker Compose Example

```yaml
version: "3.8"
services:
  prometheus:
    container_name: prometheus # Must match CONTAINER_NAME
    build: .
    env_file:
      - .env.production
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock # Required for auto-restart
    ports:
      - "3000:3000"
```

## Environment Variable Validation

On startup, the application will:

- ✅ Use defaults if GitHub variables are missing
- ⚠️ Log warnings for missing optional variables
- ❌ Fail if critical variables (JWT_SECRET) are missing

Default values:

```javascript
GITHUB_OWNER = "ItsAshn";
GITHUB_REPO = "Prometheus";
CONTAINER_NAME = "prometheus";
JWT_SECRET = "your-super-secret-jwt-key"; // ⚠️ Change this!
```

## Quick Setup Checklist

For new deployment:

- [ ] Copy `.env.production` to `.env`
- [ ] Set `ADMIN_USERNAME` and `ADMIN_PASSWORD`
- [ ] Generate and set secure `JWT_SECRET`
- [ ] Set `GITHUB_OWNER` (default: ItsAshn)
- [ ] Set `GITHUB_REPO` (default: Prometheus)
- [ ] Set `CONTAINER_NAME` (default: prometheus)
- [ ] Set `NODE_ENV=production`
- [ ] Test admin login
- [ ] Test update check functionality
