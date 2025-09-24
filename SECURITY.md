# Security Best Practices for Environment Variables

## 🚨 CRITICAL SECURITY INFORMATION

**NEVER commit actual secrets to your Git repository!** Even if the repository is private, it's bad practice and creates security risks.

## Secure Deployment Process

### 1. Template Files (Safe to commit)

- `example.env` - Template with placeholder values
- `.env.example` - Another template (if you have one)

### 2. Production Files (NEVER commit these)

- `.env` - Your actual production secrets
- `.env.production` - Actual production secrets
- `.env.local` - Local development secrets

## Setting Up Production Environment Variables

### Option A: Create .env file on the server (Recommended)

1. **On your production server**, create your `.env` file:

```bash
# Copy the template
cp example.env .env

# Edit with your actual secrets
nano .env  # or vim, code, etc.
```

2. **Generate secure values**:

```bash
# Generate a secure JWT secret (32+ characters)
openssl rand -base64 32

# Or use Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Or use PowerShell
[System.Web.Security.Membership]::GeneratePassword(32, 8)
```

### Option B: Use Docker Secrets (Most Secure)

Update your `docker-compose.yml` to use Docker secrets:

```yaml
version: "3.8"

services:
  qwik-app:
    # ... other config
    secrets:
      - admin_password
      - jwt_secret
    environment:
      - ADMIN_USERNAME=${ADMIN_USERNAME:-admin}
      - ADMIN_PASSWORD_FILE=/run/secrets/admin_password
      - JWT_SECRET_FILE=/run/secrets/jwt_secret

secrets:
  admin_password:
    file: ./secrets/admin_password.txt
  jwt_secret:
    file: ./secrets/jwt_secret.txt
```

### Option C: Environment-only (No files)

Pass environment variables directly to Docker Compose:

```bash
# Set environment variables in your shell
export ADMIN_USERNAME="your-admin"
export ADMIN_PASSWORD="your-secure-password"
export JWT_SECRET="your-32-character-jwt-secret"

# Then run docker-compose
docker-compose up -d
```

## Production Security Checklist

### ✅ Essential Security Steps

1. **Change ALL default credentials**
   - Default admin username/password
   - Default JWT secret
   - Any API keys or tokens

2. **Use strong passwords**
   - Minimum 16 characters
   - Mix of letters, numbers, symbols
   - Use a password manager

3. **Generate cryptographically secure JWT secret**
   - Minimum 32 characters
   - Use proper random generation tools

4. **Verify .gitignore**
   - Ensure all `.env*` files are ignored
   - Check that secrets aren't accidentally committed

5. **Set proper file permissions**
   ```bash
   # On Linux/macOS
   chmod 600 .env
   chown root:root .env
   ```

### 🔐 Additional Security Measures

1. **Cloudflare Access Control**
   - Use Cloudflare Zero Trust
   - Restrict admin panel access by IP/country
   - Enable 2FA for Cloudflare account

2. **Container Security**
   - Run containers as non-root user (already configured)
   - Keep Docker images updated
   - Use minimal base images

3. **Monitoring**
   - Monitor failed login attempts
   - Set up log aggregation
   - Alert on suspicious activity

4. **Backup Security**
   - Encrypt backups
   - Store securely (separate from main server)
   - Test restore procedures

## What's Safe to Share

### ✅ Safe to commit to Git:

- `example.env` with placeholder values
- `Dockerfile`
- `docker-compose.yml` (without real secrets)
- Documentation and README files

### ❌ NEVER commit to Git:

- `.env` with real credentials
- Any file with actual passwords, API keys, or secrets
- Database connection strings with credentials
- SSL certificates or private keys

## Emergency Response

If you accidentally commit secrets:

1. **Immediately change all compromised credentials**
2. **Remove from Git history**:

   ```bash
   # Remove file from Git history
   git filter-branch --force --index-filter 'git rm --cached --ignore-unmatch .env' --prune-empty --tag-name-filter cat -- --all

   # Force push to remote
   git push --force --all
   ```

3. **Rotate all affected secrets**
4. **Audit access logs for suspicious activity**

## Testing Your Security

Before going live:

1. **Verify secrets aren't in Git**: `git log --all -p | grep -i password`
2. **Check Docker image**: `docker run -it your-image sh` and look for env files
3. **Test with non-admin user**: Ensure proper access controls
4. **Verify HTTPS**: All traffic should be encrypted via Cloudflare

Remember: **Security is not optional** - take the time to do it right!
