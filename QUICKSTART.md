# Quick Start Guide - BuddyStat on Hetzner VPS

Get your customized BuddyStat (Rybbit fork) running on Hetzner VPS in minutes.

## Prerequisites

- A Hetzner VPS (minimum 2GB RAM, 2 vCPU recommended)
- A domain name pointed to your VPS IP address
- SSH access to your VPS

## Step 1: Prepare Your VPS

SSH into your Hetzner VPS and run the setup script:

```bash
# SSH into VPS
ssh root@your-vps-ip

# Download and run setup script
curl -fsSL https://raw.githubusercontent.com/iliasgnrs/buddystat/master/setup-vps.sh -o setup-vps.sh
chmod +x setup-vps.sh
sudo ./setup-vps.sh
```

This script will:
- ✅ Update system packages
- ✅ Install Docker and Docker Compose
- ✅ Configure firewall (ports 22, 80, 443)
- ✅ Create application directory
- ✅ Enable automatic security updates

## Step 2: Clone Your Repository

```bash
cd /opt/buddystat
git clone https://github.com/iliasgnrs/buddystat.git .
```

## Step 3: Configure Environment

```bash
# Copy the white label template
cp .env.whitelabel.template .env

# Edit with your settings
nano .env
```

**Essential settings to change:**
```env
# Database password
POSTGRES_PASSWORD=your_secure_password

# JWT secret (generate with: openssl rand -base64 32)
JWT_SECRET=your_jwt_secret_min_32_chars

# Your domain
NEXT_PUBLIC_APP_URL=https://your-domain.com
APP_URL=https://your-domain.com

# Brand name
NEXT_PUBLIC_BRAND_NAME=YourBrand

# Support email
NEXT_PUBLIC_SUPPORT_EMAIL=support@your-domain.com
```

## Step 4: Configure Domain (Caddy)

Edit the `Caddyfile`:

```bash
nano Caddyfile
```

Update with your domain:

```
your-domain.com {
    reverse_proxy client:3000
}

# Optional: API subdomain
api.your-domain.com {
    reverse_proxy server:3001
}
```

## Step 5: Start the Application

```bash
# Build and start all services
docker-compose -f docker-compose.cloud.yml up -d --build

# Watch the logs
docker-compose -f docker-compose.cloud.yml logs -f
```

Wait for all containers to start (usually 2-5 minutes).

## Step 6: Verify Installation

1. **Check container status:**
   ```bash
   docker-compose -f docker-compose.cloud.yml ps
   ```
   All services should show "Up"

2. **Access your application:**
   Open https://your-domain.com in your browser

3. **Create first admin account:**
   Follow the signup process in the browser

## Step 7: Configure From Local Machine

On your local development machine:

```bash
# Clone the repository
git clone https://github.com/iliasgnrs/buddystat.git
cd buddystat

# Configure deployment script
export VPS_HOST="your-vps-ip"
export VPS_USER="root"
export VPS_PATH="/opt/buddystat"

# Or edit deploy-to-hetzner.sh with your settings
nano deploy-to-hetzner.sh
```

## Daily Usage

### Make Changes Locally

```bash
# Edit files locally
# Test with docker-compose up

# Commit changes
git add .
git commit -m "Description of changes"
git push origin master
```

### Deploy to Production

```bash
# One command deployment
./deploy-to-hetzner.sh
```

### Update from Upstream

When Rybbit releases updates:

```bash
# Merge upstream changes
./update-from-upstream.sh

# Test locally
docker-compose up --build

# Deploy to production
./deploy-to-hetzner.sh
```

## Maintenance Commands

### View Logs
```bash
ssh root@your-vps-ip
cd /opt/buddystat
docker-compose -f docker-compose.cloud.yml logs -f [service-name]
```

### Restart Services
```bash
docker-compose -f docker-compose.cloud.yml restart
```

### Backup Database
```bash
docker-compose -f docker-compose.cloud.yml exec postgres \
  pg_dump -U buddystat_user buddystat > backup-$(date +%Y%m%d).sql
```

### Update Application
```bash
cd /opt/buddystat
git pull origin master
docker-compose -f docker-compose.cloud.yml up -d --build
```

### Check Disk Space
```bash
df -h
docker system df
```

### Clean Up Old Images
```bash
docker image prune -a -f
```

## Troubleshooting

### Containers Won't Start

```bash
# Check logs
docker-compose -f docker-compose.cloud.yml logs

# Check if ports are in use
sudo lsof -i :80
sudo lsof -i :443

# Restart Docker
sudo systemctl restart docker
```

### SSL Certificate Issues

```bash
# Caddy handles SSL automatically
# Ensure domain DNS points to VPS IP
# Check Caddy logs
docker-compose -f docker-compose.cloud.yml logs caddy
```

### Database Connection Errors

```bash
# Check database is running
docker-compose -f docker-compose.cloud.yml ps postgres

# Connect to database manually
docker-compose -f docker-compose.cloud.yml exec postgres \
  psql -U buddystat_user -d buddystat
```

### Out of Memory

```bash
# Check memory usage
free -h
docker stats

# Consider upgrading VPS or adding swap
```

## Security Checklist

After deployment, ensure:

- [ ] Changed all default passwords
- [ ] Generated strong JWT_SECRET
- [ ] Configured firewall (UFW)
- [ ] SSL certificate working (https://)
- [ ] Automatic updates enabled
- [ ] Regular backups scheduled
- [ ] Rate limiting configured
- [ ] Admin account created with strong password
- [ ] Removed or disabled development features
- [ ] Reviewed all environment variables

## Next Steps

- 📖 Review [WHITE_LABEL.md](./WHITE_LABEL.md) for branding customization
- 📖 Read [WORKFLOW.md](./WORKFLOW.md) for complete workflow guide
- 📖 See [DEPLOYMENT.md](./DEPLOYMENT.md) for advanced deployment options
- 🎨 Customize your logo, colors, and theme
- 📊 Install tracking script on your websites
- 🔔 Set up monitoring and alerting

## Get Help

- 📚 Documentation: All *.md files in this repository
- 🐛 Issues: Check logs first, then review documentation
- 🔄 Upstream: https://github.com/rybbit-io/rybbit for original Rybbit issues

## Performance Tips

1. **Use a CDN** for static assets
2. **Enable Redis** for caching (configure REDIS_URL in .env)
3. **Use ClickHouse** for large-scale analytics (see DEPLOYMENT.md)
4. **Regular database maintenance**:
   ```bash
   docker-compose -f docker-compose.cloud.yml exec postgres \
     psql -U buddystat_user -d buddystat -c "VACUUM ANALYZE;"
   ```

## Backup Strategy

**Daily automatic backups:**

Create a cron job on VPS:
```bash
crontab -e
```

Add:
```
0 2 * * * cd /opt/buddystat && docker-compose -f docker-compose.cloud.yml exec -T postgres pg_dump -U buddystat_user buddystat > /backup/buddystat-$(date +\%Y\%m\%d).sql
0 3 * * * find /backup -name "buddystat-*.sql" -mtime +7 -delete
```

## Cost Estimate

**Hetzner VPS:**
- CPX11 (2 vCPU, 2GB RAM): ~€4/month
- CPX21 (3 vCPU, 4GB RAM): ~€8/month *(recommended)*
- CPX31 (4 vCPU, 8GB RAM): ~€15/month *(for high traffic)*

**Domain:** ~$10-15/year

**Total:** As low as €4-8/month (~$5-10/month)

---

**🎉 You're all set! Enjoy your self-hosted, white-labeled analytics platform!**
