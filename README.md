# Prometheus 🎥

[![Docker Hub](https://img.shields.io/docker/pulls/itsashn/prometheus?style=flat-square&logo=docker&label=Docker%20Hub)](https://hub.docker.com/r/itsashn/prometheus)
[![Docker Image Version](https://img.shields.io/docker/v/itsashn/prometheus?style=flat-square&logo=docker&label=Latest)](https://hub.docker.com/r/itsashn/prometheus)
[![License](https://img.shields.io/github/license/ItsAshn/Prometheus?style=flat-square)](LICENSE)

> [!WARNING]
> **🚧 Active Development Notice**
>
> This project is in **active development** with frequent updates and potential **breaking changes**.
> Not recommended for production use yet. Great for experimentation and personal projects!

---

## 📖 Table of Contents

- [What is Prometheus?](#what-is-prometheus)
- [Key Features](#key-features)
- [Quick Start](#quick-start)
  - [Method 1: Docker Hub (Easiest)](#method-1-docker-hub-easiest)
  - [Method 2: Docker Compose (Recommended)](#method-2-docker-compose-recommended)
  - [Method 3: Manual Development Setup](#method-3-manual-development-setup)
- [System Requirements](#system-requirements)
- [Configuration](#configuration)
- [Using Prometheus](#using-prometheus)
- [Advanced Setup](#advanced-setup)
- [Development](#development)
- [Contributing](#contributing)
- [License](#license)

---

## What is Prometheus?

**Prometheus** is a **self-hosted video streaming platform** built with [Qwik](https://qwik.builder.io/) that gives you complete control over your content. Think of it as your own personal YouTube - host videos on your own hardware, customize the appearance, and share with your audience without ads, algorithms, or platform restrictions.

### Perfect For:

- 📹 **Content Creators** - Own your content without platform censorship
- 🎓 **Educators** - Host course materials and lectures privately
- 👨‍👩‍👧‍👦 **Families** - Share home videos securely with relatives
- 🏢 **Businesses** - Internal training videos and presentations
- 🎮 **Hobbyists** - Gaming clips, tutorials, and personal projects

---

## Key Features

### 🚀 Core Features

| Feature              | Description                                             |
| -------------------- | ------------------------------------------------------- |
| 📤 **Easy Upload**   | Drag & drop videos up to 5GB with automatic processing  |
| 🎥 **HLS Streaming** | Professional adaptive bitrate streaming (like Netflix)  |
| 🐳 **Docker Ready**  | Deploy with a single command - no complex setup         |
| 🔐 **Secure**        | JWT authentication, bcrypt passwords, HTTP-only cookies |
| 📱 **Responsive**    | Works perfectly on phones, tablets, and desktops        |
| 🎨 **Themeable**     | 3 built-in themes + custom CSS support                  |

### ✨ What Makes It Special

- **🚫 No Ads** - Your content, your rules. Zero tracking or monetization pressure
- **🔒 Full Control** - Self-hosted on your hardware. No cloud dependencies
- **💰 Zero Fees** - No subscription costs or hidden charges
- **🌐 Open Source** - Transparent, auditable, and community-driven
- **⚡ Web-Based Setup** - No command line needed for initial configuration
- **🔄 Easy Updates** - Built-in admin panel for one-click updates

---

## Quick Start

Choose the method that works best for you:

### Method 1: Docker Hub (Easiest)

**Best for:** Quick testing or if you don't want to clone the repository.

#### Step 1: Create Docker Network (First Time Only)

```bash
docker network create --subnet=172.18.0.0/16 cloudflareTunnel
```

#### Step 2: Run Prometheus

```bash
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

#### Step 3: Access and Setup

1. Open your browser to **http://localhost:3000**
2. Visit **http://localhost:3000/admin** to create your admin account
3. Start uploading videos!

> 📦 **Docker Hub:** https://hub.docker.com/r/itsashn/prometheus

---

### Method 2: Docker Compose (Recommended)

**Best for:** Self-hosting with easy configuration and management.

#### Step 1: Clone Repository

```bash
git clone https://github.com/ItsAshn/Prometheus.git
cd Prometheus/qwik-app
```

#### Step 2: Run with Docker Compose

```bash
docker-compose up -d
```

That's it! The container will:

- ✅ Auto-generate JWT secrets
- ✅ Set up persistent storage
- ✅ Create default admin credentials

#### Step 3: Access and Setup

1. Open your browser to **http://localhost:3000**
2. Visit **http://localhost:3000/admin** to create your admin account
3. Customize your channel in Site Configuration

#### Optional: Pre-Configure Credentials

If you prefer to set credentials before first run:

```bash
# Interactive setup (recommended)
npm run setup

# Or manually edit .env file
cp example.env .env
# Edit .env with your credentials
```

Then start the container:

```bash
docker-compose up -d
```

---

### Method 3: Manual Development Setup

**Best for:** Development, customization, or contributing to the project.

#### Prerequisites

- **Node.js** 18.17+ or 20.3+ or 21+
- **pnpm** (or npm/yarn)

#### Step 1: Clone and Install

```bash
git clone https://github.com/ItsAshn/Prometheus.git
cd Prometheus/qwik-app
pnpm install
```

#### Step 2: Choose Your Setup Method

**Option A: Zero Config (Easiest)**

```bash
pnpm dev
```

Then visit http://localhost:5173/admin to create your account.

**Option B: Interactive Setup**

```bash
pnpm setup  # Asks for username/password, auto-generates JWT
pnpm dev
```

**Option C: Manual Configuration**

```bash
cp example.env .env
# Edit .env with your credentials
pnpm dev
```

#### Step 3: Access Development Server

Open **http://localhost:5173** in your browser.

---

## System Requirements

### Minimum Requirements

| Component     | Specification |
| ------------- | ------------- |
| **CPU**       | 2 cores       |
| **RAM**       | 2GB           |
| **Storage**   | 50GB          |
| **Bandwidth** | 10 Mbps       |

### Recommended for Better Performance

| Component     | Specification |
| ------------- | ------------- |
| **CPU**       | 4+ cores      |
| **RAM**       | 4GB+          |
| **Storage**   | 500GB+ SSD    |
| **Bandwidth** | 50+ Mbps      |

### Supported Formats

**Video:** MP4, AVI, MOV, MKV, WebM (up to 5GB per file)  
**Processing:** Automatic conversion to HLS for adaptive streaming

---

## Configuration

### Environment Variables

Prometheus uses environment variables for configuration. Here's what you can customize:

```env
# Admin Credentials (optional - can be set via web interface)
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-secure-password

# JWT Secret (auto-generated if not set)
JWT_SECRET=auto-generated-on-startup-if-needed

# Server Configuration
PORT=3000
NODE_ENV=production

# Docker Configuration
IMAGE_NAME=itsashn/prometheus
IMAGE_TAG=latest
```

### Setup Methods

1. **Web-Based Setup** (Recommended)
   - Run the app without configuration
   - Visit `/admin` to create your account
   - Credentials are securely stored and persisted

2. **Interactive CLI Setup**

   ```bash
   npm run setup
   ```

3. **Manual .env File**
   ```bash
   cp example.env .env
   # Edit .env with your settings
   ```

> ⚠️ **Security Best Practice:** Always use strong, unique passwords for production deployments!

---

## Using Prometheus

### For Administrators

#### 1. Initial Setup

After running the app for the first time:

1. Navigate to **http://localhost:3000/admin**
2. Create your admin account through the web interface
3. Log in with your credentials

#### 2. Uploading Videos

1. Go to **Admin Dashboard** → **Manage Videos**
2. Click **Upload Video** or drag & drop files
3. Add title, description, and tags
4. Click **Upload** - processing happens automatically

#### 3. Customizing Your Channel

Go to **Admin Dashboard** → **Site Configuration**:

- **Channel Name:** Your channel/site name
- **Description:** Explain what your channel is about
- **Banner Image:** Upload a custom banner
- **Avatar:** Upload a profile picture
- **Theme:** Choose from 3 pre-built themes or create custom CSS

#### 4. Managing Content

- **Edit Videos:** Click on any video to edit metadata or delete
- **View Analytics:** See video views and statistics (coming soon)
- **Update System:** Check for updates in the admin panel

### For Viewers

1. Visit **http://localhost:3000** (or your domain)
2. Browse videos on the homepage or **Videos** page
3. Click any video to watch with adaptive quality streaming
4. Use the search bar to find specific content
5. Share video links with friends and family

### Themes

Prometheus includes **3 beautiful pre-built themes**:

- **🎮 Retro Theme** - Bold, pixelated gaming aesthetic (default)
- **✨ Modern Theme** - Sleek, minimalist design with smooth gradients
- **🌆 Cyberpunk Theme** - Futuristic neon-lit style with glowing effects

**Custom CSS:** Add your own styles in the admin panel for complete control.

📚 **Full customization guide:** See [THEMES.md](THEMES.md)

---

## Advanced Setup

### Cloudflare Tunnel (Secure Public Access)

Want to share your videos with the world without opening ports? Use Cloudflare Tunnels for secure, free HTTPS access.

#### Why Cloudflare Tunnels?

- 🔒 No port forwarding required
- 🌐 Automatic HTTPS with valid SSL certificates
- 🛡️ DDoS protection and Web Application Firewall
- 🚀 Cloudflare's global CDN for faster video delivery

#### Setup Steps

1. **Create a Cloudflare account** at [dash.cloudflare.com](https://dash.cloudflare.com)

2. **Add your domain** (or use a free `.cfargotunnel.com` subdomain)

3. **Create a tunnel** in Cloudflare Zero Trust:
   - Navigate to **Zero Trust** → **Networks** → **Tunnels**
   - Click **Create a tunnel** → Choose **Cloudflared**
   - Name your tunnel and copy the **tunnel token**

4. **Run the Cloudflare connector:**

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
   - Set **Service** to `http://172.18.0.7:3000`
   - Save and access your site at your custom domain!

### Updating Prometheus

#### Docker Compose

```bash
docker-compose pull
docker-compose up -d
```

#### Docker Run

```bash
docker stop prometheus
docker rm prometheus
docker pull itsashn/prometheus:latest
# Run the docker run command again from Quick Start
```

#### Web-Based Updates

Use the built-in update manager in the admin panel (recommended).

---

## Development

### Project Structure

```
qwik-app/
├── src/
│   ├── components/     # Reusable UI components
│   ├── routes/         # Page routes and API endpoints
│   ├── lib/            # Utility functions and helpers
│   └── global.css      # Global styles
├── public/             # Static assets
│   └── videos/         # Uploaded video storage
├── temp/               # Temporary files and configs
├── scripts/            # Build and setup scripts
└── server/             # Server-side rendering
```

### Available Scripts

```bash
# Development
pnpm dev              # Start dev server (http://localhost:5173)
pnpm dev.debug        # Start with Node.js debugger

# Building
pnpm build            # Build for production
pnpm build.client     # Build client-side only
pnpm build.server     # Build server adapter

# Production
pnpm serve            # Serve production build (http://localhost:8080)

# Setup & Maintenance
pnpm setup            # Interactive environment setup
pnpm cleanup          # Clean up old videos

# Docker
pnpm docker:build     # Build Docker image
pnpm docker:up        # Start with Docker Compose
pnpm docker:down      # Stop containers
pnpm docker:logs      # View container logs

# Code Quality
pnpm lint             # Run ESLint
pnpm fmt              # Format code with Prettier
```

### Building for Production

```bash
# Build the application
pnpm build

# Serve locally to test
pnpm serve

# Or build Docker image
pnpm docker:build
```

### Contributing to Development

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes and test thoroughly
4. Commit with clear messages: `git commit -m "Add feature"`
5. Push to your fork: `git push origin feature-name`
6. Open a Pull Request

---

## Contributing

We welcome contributions! Here's how you can help:

### Ways to Contribute

- 🐛 **Bug Reports:** [Open an issue](https://github.com/ItsAshn/Prometheus/issues) with details
- ✨ **Feature Requests:** Share your ideas in [Discussions](https://github.com/ItsAshn/Prometheus/discussions)
- 💻 **Code Contributions:** Submit PRs for bug fixes or new features
- 📖 **Documentation:** Improve guides, fix typos, add examples
- 🎨 **Themes:** Create and share custom themes

### Development Roadmap

Future features in development:

- [ ] 📊 Analytics Dashboard
- [x] 🎨 Custom Themes (3 themes + custom CSS)
- [ ] 💬 Comment System
- [ ] 📱 Mobile Apps (iOS/Android)
- [ ] 🔴 Live Streaming Support
- [ ] 🎵 Audio/Podcast Support
- [ ] 👥 Multi-user Support
- [ ] 🔍 Enhanced Search with Filters

### Getting Help

- **Issues:** Bug reports and technical problems
- **Discussions:** Questions, ideas, and general chat
- **Discord:** Coming soon!

---

## License

**AGPL-3.0 License**

- ✅ Free for personal, educational, and non-commercial use
- ✅ Modify and distribute freely
- ⚠️ Commercial use requires sharing modifications under AGPL-3.0
- ⚠️ No warranty provided

See [LICENSE](LICENSE) file for full terms.

---

## Security Features

Prometheus takes security seriously:

- ✅ **Bcrypt Password Hashing** - Industry-standard password encryption
- ✅ **JWT Authentication** - Secure token-based auth
- ✅ **HTTP-only Cookies** - Protected from XSS attacks
- ✅ **CSRF Protection** - Cross-site request forgery prevention
- ✅ **Input Validation** - Sanitized user inputs
- ✅ **Rate Limiting** - Prevents brute-force attacks

> 🔒 **Security Tip:** Always use strong passwords and keep your system updated!

---

## Support the Project

If you find Prometheus useful:

- ⭐ **Star this repository** to show your support
- 🐦 **Share it** with others who might benefit
- 💬 **Provide feedback** to help improve the project
- 🤝 **Contribute** code, documentation, or ideas

---

**Ready to take control of your content?** 🚀

Start building your independent video platform today!
