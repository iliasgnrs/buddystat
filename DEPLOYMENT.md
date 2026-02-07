# Hetzner VPS Deployment Guide

This guide explains how to deploy BuddyStat (Rybbit fork) to your Hetzner VPS while maintaining custom configurations and white labeling.

## Git Workflow

### Repository Structure
- **Origin**: `https://github.com/iliasgnrs/buddystat.git` (your fork with customizations)
- **Upstream**: `https://github.com/rybbit-io/rybbit.git` (original Rybbit repository)

### Fetching Upstream Updates

1. Fetch the latest changes from upstream:
```bash
git fetch upstream
```

2. Create a new branch for the merge (recommended):
```bash
git checkout -b merge-upstream-$(date +%Y%m%d)
```

3. Merge upstream changes:
```bash
git merge upstream/master
```

4. Resolve any conflicts, prioritizing your custom settings:
   - Keep your custom branding in client files
   - Preserve environment variables in `.env` files
   - Maintain custom theme/styling configurations

5. Test locally before pushing:
```bash
docker-compose up --build
```

6. Once verified, push to origin:
```bash
git checkout master
git merge merge-upstream-$(date +%Y%m%d)
git push origin master
```

## Hetzner VPS Setup

### Prerequisites on VPS
- Docker and Docker Compose installed
- Git installed
- SSH access configured
- Domain name pointed to VPS IP
- Ports 80, 443 open in firewall

### Initial Deployment

1. SSH into your Hetzner VPS:
```bash
ssh user@your-vps-ip
```

2. Clone your repository:
```bash
cd /opt
sudo git clone https://github.com/iliasgnrs/buddystat.git
cd buddystat
```

3. Copy and configure environment variables:
```bash
sudo cp .env.example .env
sudo nano .env
```

Configure these essential variables:
```env
# Database
POSTGRES_DB=buddystat
POSTGRES_USER=your_db_user
POSTGRES_PASSWORD=your_secure_password

# Application
APP_URL=https://your-domain.com
JWT_SECRET=your_jwt_secret

# White Label Settings
BRAND_NAME=BuddyStat
BRAND_LOGO_URL=https://your-domain.com/logo.png
BRAND_PRIMARY_COLOR=#your_color
```

4. Build and start services:
```bash
sudo docker-compose -f docker-compose.cloud.yml up -d --build
```

5. Check logs:
```bash
sudo docker-compose -f docker-compose.cloud.yml logs -f
```

### Update Deployment from Local

Use the deployment script to push updates to VPS:
```bash
./deploy-to-hetzner.sh
```

## Custom Configuration Management

### Files to Preserve During Upstream Merges

Create a `.gitattributes` file to help with merge strategies:

```
# Environment files - always keep ours
.env merge=ours
.env.local merge=ours
.env.production merge=ours

# Custom branding
client/public/logo.* merge=ours
client/src/app/globals.css merge=union
```

### White Label Configuration

Your white label settings should be stored in:
- Environment variables (`.env`)
- Custom theme files
- Logo/asset files in `client/public/`

### Backup Strategy

Before any major update:
```bash
# On VPS
cd /opt/buddystat
sudo docker-compose -f docker-compose.cloud.yml down
sudo tar -czf backup-$(date +%Y%m%d-%H%M%S).tar.gz .
sudo docker-compose -f docker-compose.cloud.yml up -d
```

## Monitoring and Maintenance

### View Logs
```bash
# All services
sudo docker-compose -f docker-compose.cloud.yml logs -f

# Specific service
sudo docker-compose -f docker-compose.cloud.yml logs -f server
sudo docker-compose -f docker-compose.cloud.yml logs -f client
```

### Restart Services
```bash
sudo docker-compose -f docker-compose.cloud.yml restart
```

### Update After Upstream Merge
```bash
# On VPS
cd /opt/buddystat
sudo git pull origin master
sudo docker-compose -f docker-compose.cloud.yml up -d --build
```

## Troubleshooting

### Port Conflicts
If ports 80/443 are in use:
```bash
sudo lsof -i :80
sudo lsof -i :443
```

### Database Issues
```bash
# Connect to database
sudo docker-compose -f docker-compose.cloud.yml exec postgres psql -U your_db_user -d buddystat

# Reset database (WARNING: destroys data)
sudo docker-compose -f docker-compose.cloud.yml down -v
sudo docker-compose -f docker-compose.cloud.yml up -d
```

### SSL/Certificate Issues
Check Caddy configuration in `Caddyfile` and ensure domain DNS is properly configured.

## Security Checklist

- [ ] Change all default passwords
- [ ] Configure firewall (UFW or Hetzner Firewall)
- [ ] Enable automatic security updates
- [ ] Set up SSL certificates (Caddy handles this automatically)
- [ ] Configure backup strategy
- [ ] Set up monitoring/alerting
- [ ] Review and restrict database access
- [ ] Enable Docker logging limits

## Quick Commands Reference

```bash
# Deploy latest changes
./deploy-to-hetzner.sh

# Update from upstream
./update-from-upstream.sh

# View all containers
sudo docker ps

# Rebuild specific service
sudo docker-compose -f docker-compose.cloud.yml up -d --build server

# Database backup
sudo docker-compose -f docker-compose.cloud.yml exec postgres pg_dump -U your_db_user buddystat > backup.sql

# Restore database
cat backup.sql | sudo docker-compose -f docker-compose.cloud.yml exec -T postgres psql -U your_db_user buddystat
```
