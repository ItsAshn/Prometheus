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

## Update System Variables

### Docker Container

```bash
CONTAINER_NAME=prometheus
```

- **Optional** - Name of your Docker container
- Used by the update system to restart the container after updates
- Default: `prometheus`
- Only needed if your container has a different name

### GitHub Repository (Hardcoded)

The update system automatically pulls from the official repository:

- **Owner:** `ItsAshn`
- **Repo:** `Prometheus`

**No environment variables needed!** All installations pull updates from the same source repository, regardless of where they're hosted.

## Complete Example (.env.production)

```bash
# Admin Configuration
ADMIN_USERNAME=admin
ADMIN_PASSWORD=SuperSecurePassword123!

# JWT Secret (generate a random string)
JWT_SECRET=a8f2c9e7b4d1f6a3e8c2b5d9f7a4e1c6b3d8f5a2e9c7b4d1f6a3e8c2b5d9f7a4

# Docker Container Configuration (optional)
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

# Docker Container Configuration (optional)
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

The update system uses these variables and settings:

1. **GitHub Repository (Hardcoded)**
   - Automatically checks: `ItsAshn/Prometheus`
   - No configuration needed
   - All users get updates from official source

2. **CONTAINER_NAME**
   - Restart container after updates
   - Execute: `docker restart prometheus`
   - Optional: defaults to "prometheus"

3. **JWT_SECRET**
   - Verify admin authentication
   - Protect update endpoints
   - Required for security

## Troubleshooting

### "Failed to check for updates"

- ✅ Verify internet connectivity to GitHub
- ✅ Check that ItsAshn/Prometheus repository is accessible
- ✅ Ensure GitHub API is not rate-limited

### "Failed to restart container"

- ✅ Check `CONTAINER_NAME` matches actual container name
- ✅ Run: `docker ps` to see container names
- ✅ Ensure Docker socket is mounted (docker.sock)

### "Unauthorized" when accessing admin panel

- ✅ Check `ADMIN_USERNAME` and `ADMIN_PASSWORD` are set
- ✅ Verify `JWT_SECRET` is configured
- ✅ Clear browser cookies and try again

## Update System Behavior

The update system is **hardcoded** to check the official repository:

- **Repository:** `https://github.com/ItsAshn/Prometheus`
- **Why?** All users get updates from the same official source
- **Result:** No configuration needed - just works!

This means:

- ✅ Users don't need GitHub credentials
- ✅ No environment variables for repo info
- ✅ Everyone gets the same updates
- ✅ Simplified setup

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

- ✅ Use hardcoded GitHub repo (ItsAshn/Prometheus)
- ✅ Use default container name if not specified
- ⚠️ Log warnings for missing optional variables
- ❌ Fail if critical variables (JWT_SECRET) are missing

Default values:

```javascript
CONTAINER_NAME = "prometheus";
JWT_SECRET = "your-super-secret-jwt-key"; // ⚠️ Change this!
```

**Update source is hardcoded:** All installations pull from `ItsAshn/Prometheus`

## Quick Setup Checklist

For new deployment:

- [ ] Copy `.env.production` to `.env`
- [ ] Set `ADMIN_USERNAME` and `ADMIN_PASSWORD`
- [ ] Generate and set secure `JWT_SECRET`
- [ ] Set `CONTAINER_NAME` (optional, defaults to "prometheus")
- [ ] Set `NODE_ENV=production`
- [ ] Test admin login
- [ ] Test update check functionality

**No GitHub configuration needed!** Updates automatically pull from the official ItsAshn/Prometheus repository.
