# Self-Hosted Web Application

A secure self-hosted web application built with Qwik, featuring a public site and protected admin area.

## Features

- 🌐 **Public Site**: Accessible to everyone without authentication
- 🔒 **Admin Area**: Secure admin panel accessible at `/admin`
- 🐳 **Docker Ready**: Easy deployment with Docker Compose
- 🔐 **Secure Authentication**: JWT tokens with HTTP-only cookies
- ⚙️ **Environment Configuration**: Admin credentials via environment variables

## Quick Start

### 1. Clone and Setup

```bash
git clone <your-repo>
cd qwik-app
pnpm install
```

### 2. Configure Environment

Copy the example environment file:

```bash
cp example.env .env
```

Edit `.env` and set your admin credentials:

```env
ADMIN_USERNAME=your-admin-username
ADMIN_PASSWORD=your-secure-password
JWT_SECRET=your-random-jwt-secret-key
```

### 3. Development

```bash
pnpm dev
```

Visit:

- Public site: http://localhost:5173
- Admin area: http://localhost:5173/admin

### 4. Production Deployment

#### Using Docker Compose

```bash
# Make sure .env file is configured
docker-compose up -d
```

The application will be available at http://localhost:3000

#### Manual Production Build

```bash
pnpm build
pnpm preview
```

## Security Features

### Admin Authentication

- Admin credentials are configured via environment variables
- Passwords are hashed with bcrypt (12 rounds)
- JWT tokens with 24-hour expiration
- Secure HTTP-only cookies
- CSRF protection via SameSite cookies

### Environment Variables

| Variable         | Description        | Default       |
| ---------------- | ------------------ | ------------- |
| `ADMIN_USERNAME` | Admin username     | `admin`       |
| `ADMIN_PASSWORD` | Admin password     | `changeme123` |
| `JWT_SECRET`     | JWT signing secret | Random string |
| `NODE_ENV`       | Environment mode   | `development` |

**⚠️ Important**: Change the default admin password and JWT secret in production!
