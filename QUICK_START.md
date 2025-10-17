# 🚀 Quick Start Card - Prometheus Setup

## For Admins Who Want It Simple

### Option 1: Absolute Easiest (Recommended for most)

```bash
git clone https://github.com/ItsAshn/Prometheus.git
cd Prometheus/qwik-app
docker-compose up -d
```

**Done!** 🎉

- Default login: `admin` / `changeme123`
- Access: http://localhost:3000/admin
- JWT secret: Auto-generated ✅

### Option 2: Custom Credentials

```bash
git clone https://github.com/ItsAshn/Prometheus.git
cd Prometheus/qwik-app
npm run setup  # Answer a few questions
docker-compose up -d
```

**Done!** 🎉

### Option 3: Manual Control

```bash
git clone https://github.com/ItsAshn/Prometheus.git
cd Prometheus/qwik-app
cp example.env .env
# Edit .env with your favorite editor
docker-compose up -d
```

**Done!** 🎉

---

## What You Need to Know

### Required (Choose One Option Above)

- Option 1: Nothing! Just run the commands
- Option 2: Your preferred username/password
- Option 3: Edit 2 lines in .env (username/password)

### Not Required

- ❌ Understanding JWT tokens
- ❌ Generating random strings
- ❌ Running crypto commands
- ❌ Technical knowledge

---

## First Time Access

1. Open: `http://your-server:3000`
2. Go to: `/admin`
3. Login with your credentials
4. **Change password immediately if using defaults!**

---

## Common Questions

**Q: What's a JWT secret?**  
A: Don't worry about it! It auto-generates.

**Q: Do I need to generate something?**  
A: Nope! Everything auto-generates.

**Q: What if I mess up?**  
A: Just run `npm run setup` again!

**Q: Is it secure?**  
A: Yes! Auto-generated secrets are cryptographically secure.

**Q: Can I see the JWT secret?**  
A: Yes, it's in the `.env` file if you're curious.

---

## Three Commands to Remember

```bash
npm run setup    # Interactive configuration
npm run build    # Build for production
npm run serve    # Start the server
```

Or just use Docker:

```bash
docker-compose up -d  # Does everything!
```

---

## Troubleshooting

| Problem                  | Solution                                      |
| ------------------------ | --------------------------------------------- |
| Can't login              | Check username/password in `.env`             |
| "No JWT secret" message  | This is normal! It auto-generates. Just wait. |
| Forgot password          | Run `npm run setup` to set a new one          |
| Changed .env not working | Restart: `docker-compose restart`             |

---

## Next Steps After Setup

1. ✅ Login to admin panel
2. ✅ Change default password (if you used defaults)
3. ✅ Upload your first video
4. ✅ Customize site config
5. ✅ Share your video site!

---

**Need more help?** See `ADMIN_SETUP_GUIDE.md` for detailed instructions.

**Want to understand the tech?** See `JWT_AUTO_GENERATION.md` for technical details.
