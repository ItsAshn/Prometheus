# Prometheus - Self-Hosted Video Platform

[![Docker Hub](https://img.shields.io/docker/pulls/itsashn/prometheus?style=flat-square&logo=docker&label=Docker%20Hub)](https://hub.docker.com/r/itsashn/prometheus)
[![Docker Image Version](https://img.shields.io/docker/v/itsashn/prometheus?style=flat-square&logo=docker&label=Latest)](https://hub.docker.com/r/itsashn/prometheus)
[![License](https://img.shields.io/github/license/ItsAshn/Prometheus?style=flat-square)](LICENSE)

> [!WARNING]
> **🚧 Active Development Notice**
>
> This repository is in **active development** and experiences **breaking changes** with every new version.
> **Do not rely on this for production use yet!**
>
> Feel free to tinker and experiment, but expect things to break. 🔧

---

🎥 **Your Own Video Channel, Your Own Rules**

A self-hosted video platform that gives you complete control over your content. Host your own video channel on your hardware with full creative freedom.

## ✨ Why Choose Prometheus?

🚫 **No Ads** • 🔒 **Full Control** • 💰 **Zero Fees** • **Self-Hosted** • 🌐 **Open Source**

## 🚀 Quick Features

| Feature              | Description                             |
| -------------------- | --------------------------------------- |
| 📤 **Easy Upload**   | Drag & drop videos up to 5GB            |
| 🎥 **HLS Streaming** | Professional adaptive quality streaming |
| 🐳 **Docker Ready**  | One-command deployment                  |
| 🔐 **Secure**        | JWT authentication + encrypted cookies  |
| 📱 **Universal**     | Works on all devices and browsers       |
| 🎨 **Themeable**     | 3 built-in themes + custom CSS support  |

## 🚀 Quick Start

> 📖 **For complete deployment instructions with easy updates, see [DEPLOYMENT.md](DEPLOYMENT.md)**  
> 🐳 **Docker Hub users:** See [DOCKER_HUB.md](DOCKER_HUB.md) for standalone deployment without cloning  
> 🎯 **First-time setup is now easier than ever!** Just run the app and set up your admin credentials through the web interface.

---

### 🐳 Docker Hub (Easiest - No Git Required!)

Pull and run directly from Docker Hub:

```bash
# Create the network (first time only)
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

**→ Access at:** http://localhost:3000  
**👤 First-time setup:** Visit `/admin` to create your admin account

> 📦 **Docker Hub:** https://hub.docker.com/r/itsashn/prometheus

#### ☁️ Cloudflare Tunnel Setup (Optional but Recommended)

To expose Prometheus securely to the internet without port forwarding, you can use **Cloudflare Tunnels**:

1. **Create a Cloudflare account** at [dash.cloudflare.com](https://dash.cloudflare.com)
2. **Add your domain** to Cloudflare (or use a free `.cfargotunnel.com` subdomain)
3. **Create a tunnel** in the Cloudflare Zero Trust dashboard:
   - Go to **Zero Trust** → **Networks** → **Tunnels**
   - Click **Create a tunnel** → Choose **Cloudflared**
   - Name your tunnel and save the **tunnel token**
4. **Run the Cloudflare connector** on the same Docker network:

```bash
docker run -d \
  --name cloudflared \
  --network cloudflareTunnel \
  --restart unless-stopped \
  cloudflare/cloudflared:latest \
  tunnel --no-autoupdate run --token YOUR_TUNNEL_TOKEN
```

5. **Configure the tunnel** in Cloudflare dashboard:
   - Add a **Public Hostname** (e.g., `videos.yourdomain.com`)
   - Set **Service** to `http://172.18.0.7:3000` (Prometheus's static IP)

> **Why Cloudflare Tunnels?**
>
> - 🔒 No need to open ports on your router/firewall
> - 🌐 Automatic HTTPS with valid SSL certificates
> - 🛡️ DDoS protection and Web Application Firewall
> - 🚀 Cloudflare's global CDN for faster video delivery

---

### Docker Compose (Recommended for Self-Hosting)

```bash
git clone https://github.com/ItsAshn/Prometheus.git
cd Prometheus/qwik-app
docker-compose up -d
```

**That's it!**

**→ Access at:** http://localhost:3000  
**👤 First-time setup:** Visit `/admin` and create your admin account through the web interface  
**🔄 Updates:** Use the built-in admin panel to update from GitHub releases - no Git required!

### With Custom Configuration (Optional)

You can still pre-configure credentials if you prefer:

```bash
git clone https://github.com/ItsAshn/Prometheus.git
cd Prometheus/qwik-app

# Interactive setup (asks for username/password, auto-generates JWT)
npm run setup

# Build and run
docker-compose up -d
```

### Manual Setup

```bash
git clone https://github.com/ItsAshn/Prometheus.git
cd Prometheus/qwik-app
pnpm install

# Option 1: Zero config - just run and setup via web!
pnpm dev  # JWT auto-generates, visit /admin to setup

# Option 2: Interactive setup (pre-configure)
pnpm setup

# Option 3: Manual .env configuration
cp example.env .env
# Edit .env with your credentials
pnpm dev
```

**→ Access at:** http://localhost:5173

### Configuration Made Easy

**New! Web-based First-Time Setup:**

- No configuration files needed
- Just run the app and visit `/admin`
- Create your admin account through a secure web form
- Credentials are securely stored and persisted

**Still prefer the old way?** You can still use:

- Interactive setup: `npm run setup`
- Manual `.env` configuration

```env
ADMIN_USERNAME=your-username
ADMIN_PASSWORD=your-secure-password
JWT_SECRET=auto-generated-during-build  # Automatically handled!
```

> **⚠️ Security:** Use strong, unique passwords in production!  
> **💡 How it works:** JWT secrets auto-generate before every build/dev/serve command!

## 📖 Usage

### Get Started

1. Go to `/admin` → Login with your credentials
2. Navigate to "Manage Videos" → Upload content
3. Customize your look in "Site Configuration"
4. Share `/videos` with your audience

### 🎨 Themes & Customization

Prometheus includes **3 beautiful pre-built themes** and supports **custom CSS**:

- **Retro Theme** - Bold, pixelated gaming aesthetic (default)
- **Modern Theme** - Sleek, minimalist design with smooth gradients
- **Cyberpunk Theme** - Futuristic neon-lit style with glowing effects

**Custom CSS**: Add your own styles through the admin panel to create a unique look.

📚 **Full Guide**: See [THEMES.md](THEMES.md) for complete customization documentation

### Supported Formats

**Video:** MP4, AVI, MOV, MKV, WebM (up to 5GB)  
**Processing:** Automatic HLS conversion for streaming

### System Requirements

| Component     | Minimum | Recommended |
| ------------- | ------- | ----------- |
| **RAM**       | 2GB     | 4GB+        |
| **CPU**       | 2 cores | 4+ cores    |
| **Storage**   | 50GB    | 500GB+      |
| **Bandwidth** | 10 Mbps | 50+ Mbps    |

## 🔐 Security Features

✅ **Bcrypt + JWT Authentication** • ✅ **HTTP-only Cookies** • ✅ **CSRF Protection** • ✅ **Input Validation**

## 🛠️ Development Roadmap

- 📊 Analytics Dashboard
- ✅ ~~Custom Themes~~ (3 themes + custom CSS)
- 💬 Comment System
- 📱 Mobile Apps
- 🔴 Live Streaming
- 🎵 Audio Content Support

## 🤝 Contributing & Support

**Contributing:** PRs welcome! Fix bugs, add features, improve docs.  
**Issues:** Found a bug? [Open an issue](https://github.com/ItsAshn/Prometheus/issues)  
**Discussions:** Share ideas and get help in [Discussions](https://github.com/ItsAshn/Prometheus/discussions)

## 📄 License

**AGPL-3.0** - Free for personal/educational use. Commercial use requires sharing modifications.

---

**Ready to take control of your content?** ⭐ Star this project and start building your independent video platform today!

## 🔧 Development

Preview production build:

```bash
pnpm build && pnpm serve
```

Then visit http://localhost:8080
