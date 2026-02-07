# 🚀 Deploy BuddyStat to Your Hetzner VPS - Step by Step

## What You'll Need

1. **Your Hetzner VPS IP address** (let's call it `YOUR_VPS_IP`)
2. **SSH access** to your VPS
3. **A domain name** pointed to your VPS IP (optional but recommended)

## 🔒 Credentials You'll Configure (Not Shared With Anyone)

You'll set these **directly on your VPS** - no need to share them:
- Database password
- JWT secret (for authentication)
- Your domain name
- Email SMTP settings (if sending emails)

---

## Step 1: Prepare Your VPS (5 minutes)

### SSH into your VPS:
```bash
ssh root@YOUR_VPS_IP
```

### Download and run the setup script:
```bash
curl -fsSL https://raw.githubusercontent.com/iliasgnrs/buddystat/master/setup-vps.sh -o setup-vps.sh
chmod +x setup-vps.sh
sudo ./setup-vps.sh
```

This installs Docker, Docker Compose, configures firewall, etc.

---

## Step 2: Clone and Configure (5 minutes)

### Clone your repository:
```bash
cd /opt/buddystat
git clone https://github.com/iliasgnrs/buddystat.git .
```

### Create your environment file:
```bash
cp .env.whitelabel.template .env
nano .env
```

### **Minimum Required Settings:**

```env
# Database (choose a strong password)
POSTGRES_PASSWORD=your_strong_password_here_123

# JWT Secret (generate with: openssl rand -base64 32)
JWT_SECRET=your_jwt_secret_min_32_characters

# Your domain (or use IP for testing)
NEXT_PUBLIC_APP_URL=https://your-domain.com
APP_URL=https://your-domain.com

# Brand name (already set!)
NEXT_PUBLIC_BRAND_NAME=BuddyStat

# Support email
NEXT_PUBLIC_SUPPORT_EMAIL=support@your-domain.com
```

**To generate a secure JWT_SECRET on your VPS:**
```bash
openssl rand -base64 32
```

Copy the output and paste it as your JWT_SECRET.

---

## Step 3: Configure Domain (2 minutes)

Edit the Caddyfile:
```bash
nano Caddyfile
```

**If you have a domain:**
```
your-domain.com {
    reverse_proxy client:3000
}
```

**If testing with IP (temporary):**
```
http://YOUR_VPS_IP {
    reverse_proxy client:3000
}
```

Save and exit (Ctrl+X, then Y, then Enter).

---

## Step 4: Start BuddyStat (3 minutes)

```bash
# Build and start all containers
docker-compose -f docker-compose.cloud.yml up -d --build

# Watch the logs (wait 2-5 minutes for everything to start)
docker-compose -f docker-compose.cloud.yml logs -f
```

Press `Ctrl+C` to stop watching logs (containers keep running).

---

## Step 5: Verify It's Working ✅

### Check containers are running:
```bash
docker-compose -f docker-compose.cloud.yml ps
```

You should see all services "Up".

### Access your application:
- With domain: `https://your-domain.com`
- With IP (temporary): `http://YOUR_VPS_IP`

### Create your admin account:
Go to the signup page and create your first account!

---

## 🔄 Future Updates (From Your Local Machine)

### First-time setup on local machine:

```bash
# Configure your VPS details
nano deploy-to-hetzner.sh
```

Update these lines:
```bash
VPS_HOST="YOUR_VPS_IP"
VPS_USER="root"
VPS_PATH="/opt/buddystat"
```

Or use environment variables:
```bash
export VPS_HOST="YOUR_VPS_IP"
export VPS_USER="root"
```

### Deploy changes:
```bash
# Make changes locally, commit them
git add .
git commit -m "Your changes"
git push origin master

# Deploy to production
./deploy-to-hetzner.sh
```

---

## 🆘 Common Issues

### Containers won't start:
```bash
# Check logs
docker-compose -f docker-compose.cloud.yml logs

# Restart Docker
sudo systemctl restart docker
docker-compose -f docker-compose.cloud.yml up -d
```

### Can't access website:
1. Check firewall: `sudo ufw status`
2. Ensure ports 80 and 443 are open
3. Verify domain DNS points to VPS IP
4. Check Caddy logs: `docker-compose -f docker-compose.cloud.yml logs caddy`

### Database connection errors:
- Check your POSTGRES_PASSWORD in .env
- Ensure DATABASE_URL matches your settings
- Restart containers: `docker-compose -f docker-compose.cloud.yml restart`

### Out of memory:
- Check: `free -h`
- Upgrade to larger VPS or add swap space

---

## 🎨 Customization

Your BuddyStat branding is already configured with:
- ✅ Orange BuddyStat logo
- ✅ Triangle icon favicon
- ✅ Brand name: BuddyStat

To customize further, see [WHITE_LABEL.md](./WHITE_LABEL.md).

---

## 📊 After Deployment

1. **Add your first website** to track
2. **Install tracking script** on your website
3. **Set up backups** (see DEPLOYMENT.md)
4. **Configure email** for notifications (optional)

---

## 🔐 Security Checklist

After deployment:
- [ ] Changed database password from default
- [ ] Set strong JWT_SECRET
- [ ] Firewall configured (ports 80, 443, 22)
- [ ] SSL working (https://)
- [ ] Created admin account with strong password
- [ ] Backups configured

---

## 📞 Need Help?

1. **Check logs first:** `docker-compose -f docker-compose.cloud.yml logs -f`
2. **Review documentation:** DEPLOYMENT.md, QUICKSTART.md
3. **VPS access issues:** Contact Hetzner support
4. **App issues:** Check [GitHub Issues](https://github.com/iliasgnrs/buddystat/issues)

---

## 💡 Quick Commands

```bash
# View logs
docker-compose -f docker-compose.cloud.yml logs -f

# Restart all services
docker-compose -f docker-compose.cloud.yml restart

# Stop everything
docker-compose -f docker-compose.cloud.yml down

# Start everything
docker-compose -f docker-compose.cloud.yml up -d

# Rebuild after code changes
docker-compose -f docker-compose.cloud.yml up -d --build
```

---

**🎉 That's it! You're ready to deploy BuddyStat!**

Total time: ~15-20 minutes
