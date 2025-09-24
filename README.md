# Prometheus - Self-Hosted Video Platform

🎥 **Your Own Video Channel, Your Own Rules**

Prometheus is a self-hosted video platform that gives you complete control over your content. A fun alternative to big platforms, letting you host your own video channel on your hardware with full creative freedom.

## Why Choose Prometheus?

- 🚫 **No Ads**: Your viewers enjoy uninterrupted content
- 🔒 **Full Control**: You own your content and data completely
- 💰 **Zero Fees**: No revenue sharing or subscription costs
- 🎯 **Direct Connection**: Your content reaches viewers without algorithmic filtering
- 🏠 **Self-Hosted**: Runs entirely on your own hardware
- 🌐 **Open Source**: Transparent, customizable, and community-driven

## Key Features

### For Content Creators

- 📤 **Easy Upload**: Drag and drop video files up to 5GB
- � **Professional Streaming**: Automatic HLS conversion for adaptive quality
- 📊 **Complete Control**: Manage your entire video library
- 🔧 **Custom Branding**: Make it truly yours

### For Viewers

- 📱 **Universal Playback**: Works on all devices and browsers
- ⚡ **Fast Streaming**: Optimized HLS delivery with adaptive quality
- � **Ad-Free Experience**: Pure content consumption
- 📺 **Clean Interface**: Focus on your content, not distractions

### Technical Excellence

- 🐳 **Docker Ready**: One-command deployment
- 🔐 **Secure by Design**: JWT authentication with encrypted cookies
- 🎥 **Format Support**: MP4, AVI, MOV, MKV, WebM and more
- 📱 **Mobile Optimized**: Perfect experience on all screen sizes

## Quick Start

### 1. Prerequisites

- Node.js 18+ or Docker
- At least 4GB free disk space
- Basic understanding of self-hosting

### 2. Installation

#### Option A: Docker (Recommended)

```bash
git clone https://github.com/ItsAshn/Prometheus.git
cd Prometheus/qwik-app
cp example.env .env
# Edit .env with your admin credentials (see configuration below)
docker-compose up -d
```

Your video platform will be available at http://localhost:3000

#### Option B: Manual Setup

```bash
git clone https://github.com/ItsAshn/Prometheus.git
cd Prometheus/qwik-app
pnpm install
cp example.env .env
# Edit .env with your admin credentials
pnpm dev
```

Visit http://localhost:5173 to access your platform

### 3. Configuration

Edit your `.env` file with secure credentials:

```env
ADMIN_USERNAME=your-channel-admin
ADMIN_PASSWORD=your-super-secure-password
JWT_SECRET=your-random-secret-key-here
NODE_ENV=production
```

**⚠️ Security Notice**: Always use strong, unique passwords and secrets in production!

## How to Use Your Video Platform

### Creating Your Channel

1. **Access Admin Panel**: Go to `/admin` and log in with your credentials
2. **Upload Videos**: Navigate to "Manage Videos" and start uploading content
3. **Automatic Processing**: Videos are automatically converted to HLS format for optimal streaming
4. **Go Live**: Share your channel URL with viewers

### Managing Content

- **Upload**: Supports videos up to 5GB in multiple formats
- **Organize**: Manage your video library with easy-to-use tools
- **Delete**: Remove unwanted content anytime
- **Monitor**: Track your content and platform health

### Sharing Your Channel

- **Public Access**: Share `/videos` URL for your video library
- **Direct Links**: Each video gets its own shareable URL
- **Embed Ready**: Videos can be embedded on other websites
- **Mobile Friendly**: Perfect viewing experience on all devices

## Technical Specifications

### Supported Video Formats

- MP4, AVI, MOV, MKV, WebM
- Maximum file size: 5GB per upload
- Automatic HLS conversion for streaming optimization

### System Requirements

#### Minimum

- 2GB RAM
- 2 CPU cores
- 50GB storage space
- 10 Mbps upload bandwidth

#### Recommended

- 4GB+ RAM
- 4+ CPU cores
- 500GB+ storage space
- 50+ Mbps upload bandwidth

### Browser Compatibility

- **All Modern Browsers**: Chrome, Firefox, Safari, Edge
- **Mobile Devices**: iOS Safari, Android Chrome
- **Smart TVs**: Any browser-enabled TV device

## Security & Privacy

Your content, your rules. Prometheus is built with security at its core:

- 🔐 **Encrypted Authentication**: Bcrypt password hashing + JWT tokens
- 🍪 **Secure Cookies**: HTTP-only cookies with CSRF protection
- 🏠 **Private by Default**: No external tracking or data collection
- 🔒 **Admin-Only Uploads**: Only you control what gets published
- 🛡️ **Input Validation**: Protection against malicious file uploads

## Environment Configuration

| Variable         | Description              | Default       | Required |
| ---------------- | ------------------------ | ------------- | -------- |
| `ADMIN_USERNAME` | Your admin username      | `admin`       | ✅       |
| `ADMIN_PASSWORD` | Your admin password      | `changeme123` | ✅       |
| `JWT_SECRET`     | JWT token signing secret | Random        | ✅       |
| `NODE_ENV`       | Environment mode         | `development` | ❌       |

## Self-Hosting Benefits

### Content Freedom

- Upload whatever you want (within legal boundaries)
- No content restrictions beyond your own standards
- Your videos stay online as long as you want them to

### Performance Control

- Clean, ad-free viewing experience
- Direct connection between you and your audience
- Customize streaming quality and bandwidth usage

### Community Building

- Build a dedicated audience who comes directly to you
- No competing recommendations or distractions
- Foster genuine engagement with your community

## Roadmap

### Planned Features

- 📊 **Analytics Dashboard**: Track views and engagement
- 🎨 **Custom Themes**: Personalize your channel's appearance
- 💬 **Comment System**: Let viewers engage with your content
- 📱 **Mobile App**: Native apps for iOS and Android
- 🔴 **Live Streaming**: Real-time broadcasting capabilities
- 🎵 **Audio-Only Content**: Podcast and music support

## Contributing

Prometheus is open source and welcomes contributions! Whether you're fixing bugs, adding features, or improving documentation, your help makes this platform better for everyone.

## Support

- 📖 **Documentation**: Check out our comprehensive guides
- 🐛 **Bug Reports**: Open an issue on GitHub
- 💡 **Feature Requests**: Share your ideas with the community
- 🤝 **Community**: Join discussions and help others

## License

This project is licensed under the GNU Affero General Public License v3.0 (AGPL-3.0).

**What this means:**

- ✅ **Free to use** for personal, educational, and non-commercial purposes
- ✅ **Modify and improve** the code as you see fit
- ✅ **Share with others** under the same license terms
- ⚠️ **Commercial use** requires sharing any modifications back to the community
- ⚠️ **Web services** using this code must make their source code available

This license ensures the project remains open and prevents simple commercial reselling while encouraging genuine innovation and community contributions.

For commercial licensing or questions about usage rights, please contact the project maintainers.

---

**Ready to take control of your content?** Star ⭐ this project and start building your independent video platform today!

## Express Server

This app has a minimal [Express server](https://expressjs.com/) implementation. After running a full build, you can preview the build using the command:

```
pnpm serve
```

Then visit [http://localhost:8080/](http://localhost:8080/)
