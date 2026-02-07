# BuddyStat - Complete Guide

Your customized fork of Rybbit with white labeling and deployment automation.

## 📚 Quick Links

- [Deploy to VPS](#-deployment-to-hetzner-vps) - Get started in 15 minutes
- [Update from Upstream](#-updating-from-upstream) - Sync with Rybbit updates
- [White Label Customization](#-white-label-customization) - Branding & styling
- [Daily Workflow](#-daily-workflow) - Making changes and deploying

---

## 🚀 Deployment to Hetzner VPS

### Prerequisites
- Hetzner VPS (2GB RAM minimum)
- Domain pointed to VPS IP (or use IP temporarily)
- SSH access

### Step 1: Setup VPS (5 min)

SSH into your VPS and run:
```bash
ssh root@YOUR_VPS_IP
curl -fsSL https://raw.githubusercontent.com/iliasgnrs/buddystat/master/setup-vps.sh -o setup-vps.sh
chmod +x setup-vps.sh
sudo ./setup-vps.sh
```

### Step 2: Clone & Configure (5 min)

```bash
cd /opt/buddystat
git clone https://github.com/iliasgnrs/buddystat.git .
cp .env.whitelabel.template .env
nano .env
```

**Essential settings in `.env`:**
```env
POSTGRES_PASSWORD=your_strong_password_here
JWT_SECRET=$(openssl rand -base64 32)  # Generate on VPS
NEXT_PUBLIC_APP_URL=https://your-domain.com
NEXT_PUBLIC_BRAND_NAME=BuddyStat
NEXT_PUBLIC_SUPPORT_EMAIL=support@your-domain.com
```

### Step 3: Configure Domain (2 min)

Edit Caddyfile:
```bash
nano Caddyfile
```

```
your-domain.com {
    reverse_proxy client:3000
}
```

### Step 4: Start Application (5 min)

```bash
docker-compose -f docker-compose.cloud.yml up -d --build
docker-compose -f docker-compose.cloud.yml logs -f
```

Visit `https://your-domain.com` and create your admin account!

---

## 🔄 Updating from Upstream

When the original Rybbit repo has updates:

### Merge upstream changes:
```bash
./update-from-upstream.sh
```

This script will:
1. Fetch changes from `github.com/rybbit-io/rybbit`
2. Create a merge branch
3. Preserve your custom settings (via `.gitattributes`)
4. Alert you to any conflicts

### Test locally:
```bash
docker-compose up --build
```

### Deploy to production:
```bash
./deploy-to-hetzner.sh
```

### Protected files (never overwritten):
- `.env*` - Your configuration
- `client/public/logo.*` - Your logos
- `client/public/favicon.*` - Your favicons
- Custom deployment scripts

---

## 🎨 White Label Customization

### Your Current Branding
- **Brand:** BuddyStat
- **Logo:** Orange text logo
- **Icon:** Triangle icon
- **Colors:** Orange theme

### Update Branding

**1. Environment Variables** (`.env`):
```env
NEXT_PUBLIC_BRAND_NAME=YourBrand
NEXT_PUBLIC_BRAND_TAGLINE=Your tagline
NEXT_PUBLIC_PRIMARY_COLOR=blue
NEXT_PUBLIC_SUPPORT_EMAIL=support@domain.com
```

**2. Logo Files** (`client/public/`):
- `logo.png` - Main logo
- `favicon.png` - Browser favicon
- `buddystat-text.png` - Text logo
- `buddystat-icon.png` - Icon

**3. Theme Colors** (`client/tailwind.config.ts`):
```typescript
colors: {
  brand: {
    primary: '#your-color',
  }
}
```

**4. Global Styles** (`client/src/app/globals.css`):
```css
:root {
  --brand-primary: #your-color;
}
```

---

## 💼 Daily Workflow

### Make Changes Locally

```bash
# Edit files
# Test locally
docker-compose up --build

# Commit changes
git add .
git commit -m "feat: description"
git push origin master
```

### Deploy to Production

```bash
# One command deployment
./deploy-to-hetzner.sh
```

### Check Production Status

```bash
# SSH to VPS
ssh root@YOUR_VPS_IP

# View logs
cd /opt/buddystat
docker-compose -f docker-compose.cloud.yml logs -f

# Restart services
docker-compose -f docker-compose.cloud.yml restart
```

---

## 🛠️ Maintenance Commands

### On VPS:

```bash
# View all logs
docker-compose -f docker-compose.cloud.yml logs -f

# View specific service
docker-compose -f docker-compose.cloud.yml logs -f server

# Restart services
docker-compose -f docker-compose.cloud.yml restart

# Rebuild after changes
docker-compose -f docker-compose.cloud.yml up -d --build

# Check container status
docker-compose -f docker-compose.cloud.yml ps

# Backup database
docker-compose -f docker-compose.cloud.yml exec postgres \
  pg_dump -U buddystat_user buddystat > backup-$(date +%Y%m%d).sql
```

### Clean Up:

```bash
# Remove old Docker images
docker image prune -a -f

# Check disk space
df -h
docker system df
```

---

## 🔒 Security Checklist

- [ ] Changed database password from default
- [ ] Set strong JWT_SECRET (32+ characters)
- [ ] Firewall enabled (ports 22, 80, 443)
- [ ] SSL certificate working (https)
- [ ] Admin account with strong password
- [ ] Regular backups configured
- [ ] Automatic updates enabled

---

## 🆘 Troubleshooting

### Containers won't start:
```bash
docker-compose -f docker-compose.cloud.yml logs
sudo systemctl restart docker
```

### Can't access website:
```bash
# Check firewall
sudo ufw status

# Check Caddy
docker-compose -f docker-compose.cloud.yml logs caddy

# Verify DNS points to VPS IP
dig your-domain.com
```

### Database errors:
```bash
# Check database is running
docker-compose -f docker-compose.cloud.yml ps postgres

# Connect to database
docker-compose -f docker-compose.cloud.yml exec postgres \
  psql -U buddystat_user -d buddystat
```

### Out of memory:
```bash
free -h
docker stats
# Consider upgrading VPS plan
```

---

## 📊 Repository Structure

- **Origin:** `github.com/iliasgnrs/buddystat` (your fork)
- **Upstream:** `github.com/rybbit-io/rybbit` (original)

### Key Files:
- `.env.whitelabel.template` - Configuration template
- `.gitattributes` - Merge strategies
- `deploy-to-hetzner.sh` - Deploy to production
- `update-from-upstream.sh` - Sync with upstream
- `setup-vps.sh` - Initial VPS setup

---

## 🎯 Quick Commands

```bash
# Update from upstream
./update-from-upstream.sh

# Deploy to production
./deploy-to-hetzner.sh

# View production logs
ssh root@vps "cd /opt/buddystat && docker-compose -f docker-compose.cloud.yml logs -f"

# Restart production
ssh root@vps "cd /opt/buddystat && docker-compose -f docker-compose.cloud.yml restart"
```

---

## 📈 Cost Estimate

**Hetzner VPS:**
- CPX11 (2 vCPU, 2GB): €4/month
- CPX21 (3 vCPU, 4GB): €8/month *(recommended)*

**Domain:** ~$10-15/year

**Total:** ~€5-10/month (~$6-12/month)

---

## 🔗 Additional Resources

- Original Rybbit: https://github.com/rybbit-io/rybbit
- Rybbit Docs: https://rybbit.com/docs
- Docker Docs: https://docs.docker.com
- Caddy Docs: https://caddyserver.com/docs

---

**🎉 You're all set! Happy tracking with BuddyStat!**
