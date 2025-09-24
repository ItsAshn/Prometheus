# Prometheus - Self-Hosted Video Platform

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
| 🎨 **Customizable**  | Make it truly yours                     |

## 🚀 Quick Start

### Docker (Recommended)

```bash
git clone https://github.com/ItsAshn/Prometheus.git
cd Prometheus/qwik-app
cp example.env .env
# Edit .env with your credentials
docker-compose up -d
```

**→ Access at:** http://localhost:3000

### Manual Setup

```bash
git clone https://github.com/ItsAshn/Prometheus.git
cd Prometheus/qwik-app
pnpm install
cp example.env .env
# Edit .env with your credentials
pnpm dev
```

**→ Access at:** http://localhost:5173

### Configuration

```env
ADMIN_USERNAME=your-username
ADMIN_PASSWORD=your-secure-password
JWT_SECRET=your-random-secret
```

> **⚠️ Security:** Use strong, unique passwords in production!

## 📖 Usage

### Get Started

1. Go to `/admin` → Login with your credentials
2. Navigate to "Manage Videos" → Upload content
3. Share `/videos` with your audience

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
- 🎨 Custom Themes
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
