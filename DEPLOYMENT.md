# Deployment Guide

Complete guide for deploying, updating, and maintaining your Prometheus video platform.

---

## 📋 Table of Contents

- [Initial Deployment](#initial-deployment)
- [Updating Prometheus](#updating-prometheus)
- [Backup & Restore](#backup--restore)
- [Auto-Updates with Watchtower](#auto-updates-with-watchtower)
- [Rollback Instructions](#rollback-instructions)
- [Version Checking](#version-checking)
- [Troubleshooting](#troubleshooting)

---

## 🚀 Initial Deployment

### Prerequisites

- **Docker** 20.10+ and **Docker Compose** 1.29+
- **2GB+ RAM** (4GB+ recommended)
- **50GB+ storage** (more for video content)
- **Linux, macOS, or Windows** with WSL2

### Quick Start Options

#### Option 1: Docker Hub (Easiest)

No git required! Pull and run directly:

```bash
# Create Docker network (first time only)
docker network create --subnet=172.18.0.0/16 cloudflareTunnel

# Run Prometheus
docker run -d \
  --name prometheus \
  --network cloudflareTunnel \
  --ip 172.18.0.7 \
  -p 3000:3000 \
  -v prometheus-videos:/app/public/videos \
  -v prometheus-temp:/app/temp \
  -v prometheus-data:/app/data \
  --restart unless-stopped \
  itsashn/prometheus:latest
```

**Access:** http://localhost:3000  
**First-time setup:** Visit `/admin` to create your admin account

#### Option 2: Docker Compose (Recommended)

Clone and run with Docker Compose:

```bash
git clone https://github.com/ItsAshn/Prometheus.git
cd Prometheus
docker-compose up -d
```

**Access:** http://localhost:3000  
**First-time setup:** Visit `/admin` to create your admin account

#### Option 3: Development Setup

For local development:

```bash
git clone https://github.com/ItsAshn/Prometheus.git
cd Prometheus
pnpm install
pnpm dev
```

**Access:** http://localhost:5173

---

## 🔄 Updating Prometheus

Keep your Prometheus installation up to date with the latest features and security patches.

### Method 1: One-Command Update (Recommended) ⭐

Use the built-in update script for the easiest update experience:

```bash
# From the Prometheus root directory
bash scripts/update.sh
```

**What it does:**
- ✅ Pulls the latest Docker image
- ✅ Stops and recreates the container
- ✅ Verifies the update was successful
- ✅ Provides rollback instructions if needed

**Expected output:**
```
🔄 Prometheus Update Script
==========================

📥 Pulling latest image...
🔄 Updating container...
⏳ Waiting for service to be healthy...
✅ Update successful!
🌐 Prometheus is running at http://localhost:3000
```

### Method 2: Docker Compose Manual Update

Update using standard Docker Compose commands:

```bash
# Pull latest images
docker-compose pull

# Recreate containers with new image
docker-compose up -d --force-recreate

# Check status
docker-compose ps
docker-compose logs -f prometheus
```

### Method 3: NPM Script

If you have Node.js installed:

```bash
npm run docker:update
```

### Method 4: Auto-Updates with Watchtower

See [Auto-Updates with Watchtower](#auto-updates-with-watchtower) section below.

---

## 💾 Backup & Restore

### Creating Backups

#### Backup Before Update (Recommended)

```bash
# Create timestamped backup
docker-compose exec prometheus tar czf /app/data/backup-$(date +%Y%m%d-%H%M%S).tar.gz /app/public/videos /app/data

# Or use the npm script
npm run docker:update-with-backup
```

#### Manual Volume Backup

```bash
# Stop the container
docker-compose stop prometheus

# Backup volumes to host
docker run --rm \
  -v prometheus-videos:/videos \
  -v prometheus-data:/data \
  -v $(pwd)/backups:/backup \
  alpine tar czf /backup/prometheus-backup-$(date +%Y%m%d).tar.gz /videos /data

# Restart container
docker-compose start prometheus
```

### Restoring from Backup

```bash
# Stop the container
docker-compose down

# Restore volumes from backup
docker run --rm \
  -v prometheus-videos:/videos \
  -v prometheus-data:/data \
  -v $(pwd)/backups:/backup \
  alpine tar xzf /backup/prometheus-backup-YYYYMMDD.tar.gz -C /

# Start container
docker-compose up -d
```

---

## 🤖 Auto-Updates with Watchtower

Watchtower automatically checks for and applies Docker image updates.

### Enabling Auto-Updates

The Watchtower service is included but disabled by default. Enable it using Docker Compose profiles:

```bash
# Start Prometheus with auto-updates enabled
docker-compose --profile auto-update up -d

# Check Watchtower logs
docker-compose logs -f watchtower
```

### Watchtower Configuration

**Default settings:**
- ✅ Checks for updates every 24 hours
- ✅ Automatically removes old images after update
- ✅ Only monitors the `prometheus` container
- ✅ Includes automatic rollback on failure

### Disabling Auto-Updates

```bash
# Stop Watchtower service
docker-compose --profile auto-update down watchtower

# Or restart without the profile
docker-compose up -d
```

### Customizing Update Interval

Edit `docker-compose.yml` and modify the Watchtower environment:

```yaml
environment:
  - WATCHTOWER_POLL_INTERVAL=43200  # Check every 12 hours
  # Or
  - WATCHTOWER_POLL_INTERVAL=604800  # Check weekly
```

### Watchtower Notifications (Optional)

You can configure Watchtower to send notifications on updates. Add to the watchtower service environment:

```yaml
environment:
  # ... existing vars ...
  - WATCHTOWER_NOTIFICATIONS=email
  - WATCHTOWER_NOTIFICATION_EMAIL_FROM=watchtower@example.com
  - WATCHTOWER_NOTIFICATION_EMAIL_TO=admin@example.com
  - WATCHTOWER_NOTIFICATION_EMAIL_SERVER=smtp.example.com
  - WATCHTOWER_NOTIFICATION_EMAIL_SERVER_PORT=587
```

See [Watchtower documentation](https://containrrr.dev/watchtower/) for more notification options.

---

## ⏮️ Rollback Instructions

If an update causes issues, you can rollback to a previous version.

### Quick Rollback to Previous Version

```bash
# Stop current container
docker-compose down

# Edit docker-compose.yml and change the image tag to a specific version
# For example: image: itsashn/prometheus:1.0.0

# Start with the older version
docker-compose up -d

# Verify rollback
docker-compose ps
docker-compose logs -f prometheus
```

### Rollback Using Docker Tag

```bash
# List available tags on Docker Hub
curl -s https://registry.hub.docker.com/v2/repositories/itsashn/prometheus/tags/ | grep name

# Or visit: https://hub.docker.com/r/itsashn/prometheus/tags

# Pull specific version
docker pull itsashn/prometheus:1.0.0

# Stop current container
docker-compose stop prometheus

# Run specific version
docker run -d \
  --name prometheus \
  --network cloudflareTunnel \
  --ip 172.18.0.7 \
  -p 3000:3000 \
  -v prometheus-videos:/app/public/videos \
  -v prometheus-temp:/app/temp \
  -v prometheus-data:/app/data \
  --restart unless-stopped \
  itsashn/prometheus:1.0.0
```

### Rollback from Backup

If you created a backup before updating:

```bash
# Follow the "Restoring from Backup" instructions above
```

---

## 🔍 Version Checking

### Check Current Version

#### Via Web Interface

Visit: http://localhost:3000/api/version

**Example response:**
```json
{
  "version": "1.0.0",
  "buildDate": "2024-01-15",
  "commit": "abc123"
}
```

#### Via Docker

```bash
# Check running container version
docker inspect prometheus | grep -i version

# Check container labels
docker inspect prometheus --format='{{.Config.Labels}}'
```

#### Via Script

```bash
bash scripts/check-version.sh
```

### Check Available Updates

```bash
# Pull latest image info (doesn't download)
docker pull --dry-run itsashn/prometheus:latest

# Or check Docker Hub
curl -s https://registry.hub.docker.com/v2/repositories/itsashn/prometheus/tags/latest | jq
```

---

## 🔧 Troubleshooting

### Update Script Issues

#### Issue: "docker-compose.yml not found"

**Solution:** Run the script from the Prometheus root directory:
```bash
cd /path/to/Prometheus
bash scripts/update.sh
```

#### Issue: "Failed to pull image"

**Possible causes:**
- No internet connection
- Docker Hub is down
- Image tag doesn't exist

**Solution:**
```bash
# Check internet connectivity
ping google.com

# Try pulling manually
docker pull itsashn/prometheus:latest

# Check Docker Hub status
curl https://status.docker.com/
```

#### Issue: "Container won't start after update"

**Solution:**
```bash
# Check logs
docker-compose logs prometheus

# Common issues:
# 1. Port already in use
sudo lsof -i :3000

# 2. Volume permissions
docker-compose exec prometheus ls -la /app/data

# 3. Insufficient resources
docker stats prometheus
```

### Watchtower Issues

#### Issue: Watchtower not starting

**Solution:**
```bash
# Verify profile is enabled
docker-compose --profile auto-update config

# Check Watchtower logs
docker-compose logs watchtower

# Ensure Docker socket is accessible
ls -la /var/run/docker.sock
```

#### Issue: Updates not being applied

**Solution:**
```bash
# Check Watchtower is monitoring correct container
docker-compose exec watchtower watchtower --run-once --debug

# Verify image has updates available
docker pull itsashn/prometheus:latest
docker images | grep prometheus
```

### General Issues

#### Issue: Container keeps restarting

**Solution:**
```bash
# Check logs for errors
docker-compose logs --tail=100 prometheus

# Check health status
docker inspect prometheus --format='{{.State.Health.Status}}'

# Verify resources
docker stats prometheus

# Check configuration
docker-compose config
```

#### Issue: Lost admin credentials

**Solution:**
```bash
# Stop container
docker-compose stop prometheus

# Set new credentials via environment
echo "ADMIN_USERNAME=newadmin" >> .env
echo "ADMIN_PASSWORD=newpassword" >> .env

# Restart
docker-compose up -d
```

#### Issue: Network errors

**Solution:**
```bash
# Check network exists
docker network ls | grep cloudflareTunnel

# Recreate network if needed
docker network create --subnet=172.18.0.0/16 cloudflareTunnel

# Restart container
docker-compose up -d
```

---

## 📞 Getting Help

- **GitHub Issues:** [Report bugs](https://github.com/ItsAshn/Prometheus/issues)
- **Discussions:** [Ask questions](https://github.com/ItsAshn/Prometheus/discussions)
- **Documentation:** [README.md](README.md)
- **Docker Hub:** [Container info](https://hub.docker.com/r/itsashn/prometheus)

---

## 🔐 Security Best Practices

1. **Always backup before updates**
2. **Use strong passwords** for admin accounts
3. **Keep Docker updated** to the latest version
4. **Monitor logs** for suspicious activity
5. **Use HTTPS** in production (e.g., via Cloudflare Tunnel)
6. **Review updates** before applying in production
7. **Test in staging** environment first if possible

---

## 📊 Maintenance Schedule

**Recommended maintenance routine:**

- **Daily:** Auto-updates via Watchtower (if enabled)
- **Weekly:** Check logs for errors
- **Monthly:** Manual backup of all data
- **Quarterly:** Review and update configurations

---

**Need more help?** Check the [README.md](README.md) or open a [GitHub Discussion](https://github.com/ItsAshn/Prometheus/discussions).
