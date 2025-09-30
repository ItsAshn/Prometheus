# Prometheus Video Platform - Easy Deployment Guide

This guide explains how to deploy and update the Prometheus video platform using Docker and GitHub releases - no Git knowledge required!

## 📦 Quick Deployment

### Prerequisites

- Docker and Docker Compose installed
- Basic command line knowledge

### Step 1: Download and Setup

1. **Download the latest release**

   ```bash
   # Download from GitHub releases
   wget https://github.com/ItsAshn/Prometheus/archive/refs/heads/master.zip
   unzip master.zip
   cd Prometheus-master
   ```

2. **Configure your deployment**

   ```bash
   # Copy the example environment file
   cp example.env .env

   # Edit the configuration (use nano, vim, or any text editor)
   nano .env
   ```

3. **Important: Update these settings in `.env`**

   ```env
   # Change these for security!
   ADMIN_USERNAME=your_admin_username
   ADMIN_PASSWORD=your_secure_password
   JWT_SECRET=your-very-long-random-secret-key

   # GitHub settings for updates (usually don't need to change)
   GITHUB_OWNER=ItsAshn
   GITHUB_REPO=Prometheus
   APP_VERSION=v1.0.0
   ```

### Step 2: Launch the Platform

```bash
# Build and start the platform
docker-compose up -d

# Check if it's running
docker-compose ps
```

Your platform will be available at `http://localhost:3000`

## 🔄 Easy Updates (No Git Required!)

The platform includes a built-in update system that downloads new versions directly from GitHub.

### Using the Admin Panel (Recommended)

1. **Access the admin panel**
   - Go to `http://your-domain:3000/admin`
   - Login with your admin credentials

2. **Check for updates**
   - Navigate to "System Updates"
   - Click "🔄 Refresh Status" to check for new versions
   - If updates are available, you'll see the new version and release notes

3. **Apply updates**
   - Click "🚀 Update & Restart" to download and apply updates
   - The container will automatically restart with the new version
   - Wait about 30-60 seconds for the restart to complete

### Manual Update (Alternative Method)

If you prefer command line updates:

```bash
# Stop the current container
docker-compose down

# Download the latest version
wget https://github.com/ItsAshn/Prometheus/archive/refs/heads/master.zip -O update.zip
unzip -o update.zip
cp -r Prometheus-master/* .
rm -rf Prometheus-master update.zip

# Rebuild and restart
docker-compose up -d --build
```

## 🛠️ Configuration Options

### Environment Variables

| Variable         | Description                    | Default                     |
| ---------------- | ------------------------------ | --------------------------- |
| `ADMIN_USERNAME` | Admin panel username           | `admin`                     |
| `ADMIN_PASSWORD` | Admin panel password           | `test`                      |
| `JWT_SECRET`     | Security key for sessions      | `your-super-secret-jwt-key` |
| `GITHUB_OWNER`   | GitHub repository owner        | `ItsAshn`                   |
| `GITHUB_REPO`    | GitHub repository name         | `Prometheus`                |
| `APP_VERSION`    | Current version (auto-updated) | `v1.0.0`                    |
| `NODE_ENV`       | Environment mode               | `production`                |

### Port Configuration

By default, the platform runs on port 3000. To change this, edit `docker-compose.yml`:

```yaml
services:
  prometheus:
    ports:
      - "8080:3000" # Change 8080 to your preferred port
```

### Volume Configuration

Your videos and data are stored in Docker volumes:

- `prometheus_videos` - Video files and HLS segments
- `prometheus_data` - Configuration and metadata

To backup your data:

```bash
# Backup videos
docker run --rm -v prometheus_videos:/data -v $(pwd):/backup alpine tar czf /backup/videos-backup.tar.gz /data

# Backup configuration
docker run --rm -v prometheus_data:/data -v $(pwd):/backup alpine tar czf /backup/data-backup.tar.gz /data
```

## 🔧 Troubleshooting

### Container Won't Start

```bash
# Check container logs
docker-compose logs prometheus

# Check if ports are available
netstat -tulpn | grep 3000
```

### Update Issues

- **"Updates not available"**: Make sure you have internet connection and GitHub is accessible
- **"Update failed"**: Check the logs and try the manual update method
- **"Container won't restart"**: Wait 1-2 minutes, then check `docker-compose ps`

### Permission Issues

```bash
# Fix file permissions
sudo chown -R $(whoami):$(whoami) .
chmod +x scripts/*.sh
```

## 📊 Monitoring

### Check System Status

- Admin Panel: `http://your-domain:3000/admin/system-update`
- Container status: `docker-compose ps`
- Logs: `docker-compose logs -f prometheus`

### Health Check

The platform includes automatic health checks. If the container becomes unhealthy:

```bash
# Restart the service
docker-compose restart prometheus
```

## 🚀 Advanced Configuration

### Custom Domain Setup

1. Point your domain to your server
2. Use a reverse proxy like nginx:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### HTTPS Setup

Use Let's Encrypt with nginx or Cloudflare Tunnel for easy HTTPS.

### Multiple Instances

To run multiple instances, create separate directories and change ports:

```bash
# Instance 1 (port 3001)
mkdir prometheus-instance-1
cd prometheus-instance-1
# ... setup with port 3001

# Instance 2 (port 3002)
mkdir prometheus-instance-2
cd prometheus-instance-2
# ... setup with port 3002
```

## 📞 Support

- **Documentation**: Check this file and the README.md
- **Issues**: Report bugs on the GitHub repository
- **Updates**: New versions are automatically detected in the admin panel

## 🔐 Security Recommendations

1. **Change default credentials immediately**
2. **Use a strong JWT secret** (at least 32 random characters)
3. **Keep the platform updated** (check weekly for updates)
4. **Use HTTPS in production**
5. **Restrict admin panel access** (firewall, VPN, etc.)
6. **Regular backups** of your video content and configuration

---

🎉 **You're all set!** Your Prometheus video platform is ready to use with easy, Git-free updates!
