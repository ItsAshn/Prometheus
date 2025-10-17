# 🚀 Admin Setup Guide - Quick & Easy

This guide shows you the **easiest** way to set up Prometheus for hosting.

## 📝 Three Easy Setup Methods

### Method 1: Zero Configuration (Easiest!) ⭐⭐⭐

**The absolute easiest way** - just build and run! JWT secrets are **auto-generated** during build.

```bash
npm run build
npm run serve
```

Or with Docker:

```bash
docker-compose up -d
```

**That's it!** The system will:

- ✅ Auto-create `.env` file if missing
- ✅ Auto-generate secure JWT secret
- ✅ Use default admin credentials (change them after first login!)
- ✅ Save everything automatically

**Default login:** Username: `admin`, Password: `changeme123`  
⚠️ **Change these immediately after first login!**

### Method 2: Interactive Setup (Recommended) ⭐⭐

Want to set your own credentials from the start? Run the interactive setup:

```bash
npm run setup
```

Or with pnpm:

```bash
pnpm setup
```

This interactive script will:

- ✅ Ask you for an admin username and password
- ✅ **Auto-generate** a secure JWT secret (no manual generation needed!)
- ✅ Configure your container name
- ✅ Create your `.env` file automatically

### Method 3: Manual Setup ⭐

If you prefer to do it manually:

1. **Copy the example file:**

   ```bash
   cp example.env .env
   ```

2. **Edit the `.env` file and change these values:**

   ```env
   # Change these to your desired admin credentials
   ADMIN_USERNAME=admin
   ADMIN_PASSWORD=YourSecurePassword123!

   # JWT secret auto-generates on build - leave as-is or run: npm run setup
   JWT_SECRET=auto-generated-on-first-run

   # Change if your Docker container has a different name
   CONTAINER_NAME=prometheus

   # Set to production for deployment
   NODE_ENV=production
   ```

3. **Build and run:**
   ```bash
   npm run build
   npm run serve
   ```

The JWT secret will auto-generate during build if not already set!

## 🎯 What You Need to Know

### Required Settings (Simple!)

1. **ADMIN_USERNAME** - Your admin login name
   - Example: `admin`, `john`, `administrator`
2. **ADMIN_PASSWORD** - Your admin password
   - Use a strong password with letters, numbers, and symbols
   - Example: `MyStr0ng!Pass2024`

3. **JWT_SECRET** - ⚡ **AUTO-GENERATED FOR YOU!**
   - You don't need to understand this
   - System generates it automatically if missing
   - Just leave it alone after it's generated

### Optional Settings

4. **CONTAINER_NAME** (Optional)
   - Default: `prometheus`
   - Only change if your Docker container has a different name
   - Check with: `docker ps`

5. **NODE_ENV** (Optional)
   - Use `production` for deployment
   - Use `development` for testing

## 🔐 Security Best Practices (Easy Version)

✅ **DO:**

- Use a strong admin password (12+ characters, mix of letters/numbers/symbols)
- Keep your `.env` file secret (never share it)
- Run the interactive setup for automatic security

❌ **DON'T:**

- Don't use simple passwords like "admin123" or "password"
- Don't commit your `.env` file to GitHub
- Don't share your admin credentials

## 🚢 Quick Deployment Steps

**Absolute easiest (zero configuration):**

```bash
git clone https://github.com/ItsAshn/Prometheus.git
cd Prometheus/qwik-app
docker-compose up -d
```

Access at `http://your-server:3000/admin` with default credentials (admin/changeme123)

**With custom setup:**

1. **Run the interactive setup:**

   ```bash
   npm run setup
   ```

2. **Build the application:**

   ```bash
   npm run build
   ```

3. **Start with Docker:**

   ```bash
   docker-compose up -d
   ```

4. **Access your admin panel:**
   - Navigate to: `http://your-server:3000/admin`
   - Login with your admin credentials

## 🆘 Troubleshooting

### "No JWT_SECRET found" warning?

**This is completely normal!** The system auto-generates one during build/startup. You'll see:

- 🔑 "Auto-generated a secure JWT secret..."
- ✅ "Generated and saved secure JWT_SECRET to .env file!"

Just continue - it's working as intended!

### No .env file?

**Don't worry!** Run `npm run build` or `npm run dev` and one will be created automatically with secure defaults.

### "Auto-generated password" message?

If you run `npm run setup` and don't enter a password, the script generates a random secure one for you. **Copy and save this password!** You'll need it to login.

### Can't login to admin panel?

1. Check your username and password in the `.env` file
2. Make sure the `.env` file is in the root directory
3. Try clearing your browser cookies
4. Restart the application

### Docker container not restarting after updates?

1. Run `docker ps` to see your container name
2. Update `CONTAINER_NAME` in `.env` to match
3. Make sure Docker socket is mounted in docker-compose.yml

## 📚 Additional Resources

- **Full Documentation**: See `ENV_VARIABLES.md` for advanced configuration
- **Deployment Guide**: See `DEPLOYMENT.md` for production setup
- **Docker Setup**: See `DOCKER_DEPLOYMENT.md` for Docker specifics

## 💡 Pro Tips

1. **First time setup?** Just run `npm run setup` - it's the easiest way!
2. **Don't understand JWT?** You don't need to! The system handles it automatically.
3. **Forgot your password?** Just run `npm run setup` again to set a new one.
4. **Want more control?** Check the advanced docs in `ENV_VARIABLES.md`

## ✅ Quick Checklist

After setup, verify these work:

- [ ] Can access the website at `http://your-server:3000`
- [ ] Can login to admin panel at `http://your-server:3000/admin`
- [ ] Can upload videos (if logged in as admin)
- [ ] Can check for updates in the admin panel
- [ ] No security warnings in the console

---

**Need help?** Check the full documentation or open an issue on GitHub.
