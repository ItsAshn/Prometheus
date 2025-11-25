# Prometheus - Self-Hosted Video Platform

🎥 **Your Own Video Channel, Your Own Rules**

A self-hosted video platform that gives you complete control over your content. Host your own video channel with professional HLS streaming, zero configuration setup, and automatic credential management.

## 🚀 Quick Start - Zero Configuration!

**The easiest way to run Prometheus - no setup files needed:**

```bash
# Create a network (if you don't have one)
docker network create --subnet=172.18.0.0/16 cloudflareTunnel

# Run the container with proper network and static IP
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

**That's it!** 🎉

- **Access at:** http://localhost:3000
- **First-time setup:** Visit `/admin` to create your admin account
- **Auto-generated security:** JWT secrets are automatically generated securely

---

## 📋 Full Docker Compose Setup

For a production-ready deployment with persistent storage:

**1. Create `docker-compose.yml`:**

```yaml
version: "3.8"

services:
  prometheus:
    image: itsashn/prometheus:latest
    container_name: prometheus
    restart: unless-stopped
    ports:
      - "3000:3000"
    volumes:
      - prometheus-videos:/app/public/videos
      - prometheus-temp:/app/temp
      - prometheus-data:/app/data
    environment:
      - NODE_ENV=production
      - DOCKER_CONTAINER=true
    networks:
      - prometheus-net
    healthcheck:
      test:
        [
          "CMD",
          "wget",
          "--no-verbose",
          "--tries=1",
          "--spider",
          "http://localhost:3000/api/health",
        ]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

volumes:
  prometheus-videos:
  prometheus-temp:
  prometheus-data:

networks:
  prometheus-net:
    driver: bridge
```

**2. Start the container:**

```bash
docker-compose up -d
```

**3. Access and Setup:**

- Open http://localhost:3000
- Go to `/admin` to create your admin account
- Start uploading videos!

---

## 🔧 Optional: Pre-configure Credentials

If you prefer to set credentials before starting:

```bash
docker run -d \
  --name prometheus \
  -p 3000:3000 \
  -e ADMIN_USERNAME=yourusername \
  -e ADMIN_PASSWORD=your-secure-password \
  -v prometheus-videos:/app/public/videos \
  -v prometheus-temp:/app/temp \
  -v prometheus-data:/app/data \
  --restart unless-stopped \
  itsashn/prometheus:latest
```

> **Note:** JWT secrets are still auto-generated securely - you don't need to set them!

---

## 🎯 Key Features

| Feature              | Description                             |
| -------------------- | --------------------------------------- |
| 📤 **Easy Upload**   | Drag & drop videos up to 5GB            |
| 🎥 **HLS Streaming** | Professional adaptive quality streaming |
| 🔐 **Auto Security** | JWT & credentials auto-generated        |
| 📱 **Universal**     | Works on all devices and browsers       |
| 🎨 **Themeable**     | 3 built-in themes + custom CSS          |
| 🔄 **Zero Config**   | No setup files required                 |

---

## 📊 Environment Variables

All environment variables are **optional** with secure defaults:

| Variable         | Default          | Description                              |
| ---------------- | ---------------- | ---------------------------------------- |
| `ADMIN_USERNAME` | `admin`          | Admin username (customizable via web UI) |
| `ADMIN_PASSWORD` | `changeme123`    | Initial password (change on first login) |
| `JWT_SECRET`     | _auto-generated_ | JWT secret (automatically created)       |
| `NODE_ENV`       | `production`     | Node environment                         |
| `PORT`           | `3000`           | Internal port (don't change)             |

> **🔒 Security:** Credentials set via environment variables are used only for initial setup. After first login, change them through the web interface!

---

## 💾 Volumes Explained

| Volume               | Purpose                         | Important?                       |
| -------------------- | ------------------------------- | -------------------------------- |
| `/app/public/videos` | Uploaded videos & HLS streams   | ⭐ **Critical** - Your content!  |
| `/app/temp`          | Processing temporary files      | ⚠️ Recommended                   |
| `/app/data`          | App configuration & credentials | ⭐ **Critical** - Your settings! |

**⚠️ Important:** Always use named volumes or bind mounts for persistent data!

---

## 🌐 Network Configuration

### Basic Setup (Bridge Network)

```bash
docker run -d \
  --name prometheus \
  -p 3000:3000 \
  -v prometheus-videos:/app/public/videos \
  -v prometheus-temp:/app/temp \
  -v prometheus-data:/app/data \
  --restart unless-stopped \
  itsashn/prometheus:latest
```

### With Cloudflare Tunnel (Recommended)

If you have an existing Cloudflare Tunnel network, connect Prometheus to it with a static IP:

```bash
# First, ensure your Cloudflare tunnel network exists
docker network create --subnet=172.18.0.0/16 cloudflareTunnel

# Run Prometheus with the tunnel network and static IP
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

> **⚠️ Important:** When using `docker run` instead of `docker-compose`, you must manually specify `--network` and `--ip` to connect to your existing network. The `docker-compose.yml` settings don't apply to standalone `docker run` commands.

### With Reverse Proxy (Alternative)

```bash
# Assuming you have a reverse proxy network
docker run -d \
  --name prometheus \
  --network proxy-network \
  -v prometheus-videos:/app/public/videos \
  -v prometheus-temp:/app/temp \
  -v prometheus-data:/app/data \
  --restart unless-stopped \
  itsashn/prometheus:latest
```

Then configure your reverse proxy (nginx, Traefik, Caddy) to forward to `prometheus:3000`

---

## 🔄 Updates

### Update to Latest Version

```bash
# Pull latest image
docker pull itsashn/prometheus:latest

# Recreate container
docker-compose up -d
```

### Check Current Version

```bash
# Via API
curl http://localhost:3000/api/version

# Via Docker labels
docker inspect itsashn/prometheus:latest | grep -A 5 Labels
```

---

## 🏥 Health Check

The container includes a built-in health check:

```bash
# Check container health
docker ps

# View health logs
docker inspect prometheus | grep -A 10 Health
```

Health endpoint: `http://localhost:3000/api/health`

---

## 📋 System Requirements

| Component     | Minimum | Recommended |
| ------------- | ------- | ----------- |
| **RAM**       | 2GB     | 4GB+        |
| **CPU**       | 2 cores | 4+ cores    |
| **Storage**   | 50GB    | 500GB+      |
| **Bandwidth** | 10 Mbps | 50+ Mbps    |

---

## 🎨 Customization

1. Login to `/admin`
2. Navigate to "Site Configuration"
3. Choose from 3 built-in themes:
   - **Retro** - Bold pixelated gaming aesthetic
   - **Modern** - Sleek minimalist design
   - **Cyberpunk** - Futuristic neon style
4. Add custom CSS for unique branding

---

## 🐛 Troubleshooting

### Container won't start

```bash
# Check logs
docker logs prometheus

# Check health
docker inspect prometheus | grep -A 10 Health
```

### Can't access admin panel

- Ensure port 3000 is not blocked by firewall
- Check if container is running: `docker ps`
- Verify network configuration

### Video upload fails

- Check available storage: `docker system df`
- Verify volume permissions
- Check container logs: `docker logs prometheus`

### FFmpeg errors

- The image includes FFmpeg - no additional setup needed
- Verify sufficient CPU/RAM for video processing

---

## 🔗 Useful Commands

```bash
# View logs
docker logs -f prometheus

# Execute commands in container
docker exec -it prometheus sh

# Check FFmpeg version
docker exec prometheus ffmpeg -version

# Backup volumes
docker run --rm -v prometheus-data:/data -v $(pwd):/backup alpine tar czf /backup/prometheus-backup.tar.gz /data

# Restore volumes
docker run --rm -v prometheus-data:/data -v $(pwd):/backup alpine tar xzf /backup/prometheus-backup.tar.gz -C /
```

---

## 📚 Additional Resources

- **GitHub Repository:** https://github.com/ItsAshn/Prometheus
- **Documentation:** https://github.com/ItsAshn/Prometheus/blob/master/README.md
- **Issues & Support:** https://github.com/ItsAshn/Prometheus/issues
- **Discussions:** https://github.com/ItsAshn/Prometheus/discussions

---

## 🤝 Support & Contributing

- ⭐ Star the project on GitHub
- 🐛 Report bugs via GitHub Issues
- 💡 Suggest features in Discussions
- 🔧 Submit PRs to improve the platform

---

## 📄 License

**AGPL-3.0** - Free for personal/educational use. Commercial use requires sharing modifications.

---

## 🎉 Ready to Start?

```bash
docker run -d \
  --name prometheus \
  -p 3000:3000 \
  -v prometheus-videos:/app/public/videos \
  -v prometheus-temp:/app/temp \
  -v prometheus-data:/app/data \
  --restart unless-stopped \
  itsashn/prometheus:latest
```

**Then visit:** http://localhost:3000 and create your admin account! 🚀
