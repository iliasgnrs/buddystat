# BuddyStat - Workflow Guide

Complete workflow for maintaining your custom fork while staying updated with upstream changes.

## Quick Start

### First-Time Setup
```bash
# Clone your repository
git clone https://github.com/iliasgnrs/buddystat.git
cd buddystat

# Upstream is already configured
git remote -v
# Should show:
#   origin: github.com/iliasgnrs/buddystat
#   upstream: github.com/rybbit-io/rybbit
```

### Configure Deployment
Edit `deploy-to-hetzner.sh` and set your VPS details, or use environment variables:
```bash
export VPS_HOST="your-vps-ip"
export VPS_USER="root"
export VPS_PATH="/opt/buddystat"
```

## Daily Workflow

### 1. Local Development
```bash
# Make your changes
# Create/edit files
# Test locally
docker-compose up --build

# Commit changes
git add .
git commit -m "feat: your feature description"

# Push to your fork
git push origin master
```

### 2. Deploy to Hetzner
```bash
# Deploy latest changes to production
./deploy-to-hetzner.sh
```

## Weekly/Monthly: Update from Upstream

### Check for Updates
```bash
git fetch upstream
git log HEAD..upstream/master --oneline
```

### Merge Upstream Changes
```bash
# Use the automated script
./update-from-upstream.sh
```

The script will:
1. Fetch upstream changes
2. Create a merge branch
3. Attempt automatic merge
4. Preserve your custom configurations (via `.gitattributes`)

### If Merge is Successful
```bash
# Test locally
docker-compose up --build

# Merge to master if tests pass
git checkout master
git merge merge-upstream-YYYYMMDD-HHMMSS
git push origin master

# Deploy to production
./deploy-to-hetzner.sh
```

### If There are Conflicts

The script will notify you of conflicts. Resolve them manually:

```bash
# View conflicted files
git status

# Edit each conflicted file
# Git marks conflicts with:
#   <<<<<<< HEAD (your changes)
#   =======
#   >>>>>>> upstream/master (their changes)

# For branding/config files: keep your version
# For core features: carefully merge both

# Mark resolved
git add <resolved-file>

# Complete merge
git commit

# Test and deploy
docker-compose up --build
git checkout master
git merge merge-upstream-YYYYMMDD-HHMMSS
git push origin master
./deploy-to-hetzner.sh
```

## File Categories and Merge Strategy

### Always Keep Yours (via .gitattributes)
- `.env*` - Environment variables
- `deploy-to-hetzner.sh` - Deployment script
- `update-from-upstream.sh` - Update script
- `client/public/logo.*` - Logo files
- `client/public/favicon.*` - Favicon files
- Custom brand assets

### Merge Both (Union Strategy)
- `.env.example` - Example environment (add new vars, keep yours)
- `docker-compose.cloud.yml` - Cloud deployment config
- `client/src/app/globals.css` - Global styles (merge carefully)
- Documentation files

### Review Carefully
- Core application code
- Database migrations
- API endpoints
- Component files

## Common Scenarios

### Scenario 1: Upstream adds new environment variable
```bash
# After merge, check .env.example for new variables
git diff HEAD~1 .env.example

# Add new required variables to your .env
nano .env

# Deploy with new configuration
./deploy-to-hetzner.sh
```

### Scenario 2: Upstream updates Docker configuration
```bash
# Review changes to docker files
git diff HEAD~1 docker-compose.cloud.yml

# Ensure your custom configs are preserved
# If needed, manually merge changes

# Test locally
docker-compose -f docker-compose.cloud.yml up --build

# Deploy
./deploy-to-hetzner.sh
```

### Scenario 3: Upstream adds new feature
```bash
# New feature code is merged automatically
# May need to update environment variables
# May need to add new white label settings

# Test thoroughly
docker-compose up --build

# Check if white labeling still works
# Verify your custom branding
# Test the new feature

# Deploy when satisfied
./deploy-to-hetzner.sh
```

### Scenario 4: Database migration conflict
```bash
# Upstream might add new migrations
# Your fork might have custom migrations

# Check migrations directory
ls -la server/src/db/migrations/

# Ensure migration numbering doesn't conflict
# Renumber your migrations if needed
# Test migrations locally

# Apply migrations on VPS
ssh user@your-vps "cd /opt/buddystat && docker-compose -f docker-compose.cloud.yml exec server npm run migrate"
```

## Branching Strategy

### Main Branches
- `master` - Production-ready code
- `merge-upstream-*` - Temporary branches for upstream merges

### Feature Development
```bash
# Create feature branch
git checkout -b feature/your-feature

# Develop and test
# Commit changes

# Merge to master
git checkout master
git merge feature/your-feature
git push origin master

# Deploy
./deploy-to-hetzner.sh

# Clean up
git branch -d feature/your-feature
```

## Backup Strategy

### Before Major Updates
```bash
# On VPS - create backup
ssh user@your-vps << 'EOF'
  cd /opt/buddystat
  docker-compose -f docker-compose.cloud.yml exec postgres pg_dump -U user dbname > backup-$(date +%Y%m%d).sql
  tar -czf backup-full-$(date +%Y%m%d).tar.gz .
EOF
```

### After Issues
```bash
# Restore from backup if needed
ssh user@your-vps << 'EOF'
  cd /opt/buddystat
  cat backup-YYYYMMDD.sql | docker-compose -f docker-compose.cloud.yml exec -T postgres psql -U user dbname
EOF
```

## Monitoring Production

### Health Checks
```bash
# Check container status
ssh user@your-vps "docker ps"

# View logs
ssh user@your-vps "cd /opt/buddystat && docker-compose -f docker-compose.cloud.yml logs -f"

# Check specific service
ssh user@your-vps "cd /opt/buddystat && docker-compose -f docker-compose.cloud.yml logs -f server"
```

### Performance Monitoring
- Set up monitoring tools (Prometheus, Grafana)
- Configure alerts for downtime
- Monitor database performance
- Track error rates

## Git Best Practices

### Commit Messages
Use conventional commits:
```bash
feat: add new analytics feature
fix: resolve login issue
docs: update deployment guide
style: improve dashboard layout
refactor: optimize database queries
chore: update dependencies
```

### Before Pushing
```bash
# Review changes
git diff

# Check status
git status

# Test locally
docker-compose up --build
```

## Troubleshooting

### "Merge conflict in .env"
```bash
# .gitattributes should prevent this, but if it happens:
git checkout --ours .env
git add .env
git commit
```

### "Cannot deploy - working directory not clean"
```bash
# Commit or stash changes
git stash
# or
git add . && git commit -m "WIP: save progress"
```

### "VPS deployment failed"
```bash
# Check SSH connection
ssh user@your-vps "echo 'Connection OK'"

# Check VPS disk space
ssh user@your-vps "df -h"

# Check Docker status
ssh user@your-vps "docker ps"

# View VPS logs
ssh user@your-vps "cd /opt/buddystat && docker-compose -f docker-compose.cloud.yml logs --tail=100"
```

## Security Considerations

1. **Never commit secrets** to git
   - Use `.env` files (not tracked)
   - Keep `.env.example` with dummy values only

2. **Keep dependencies updated**
   ```bash
   # Check for updates
   npm outdated
   
   # Update carefully
   npm update
   ```

3. **Regular backups**
   - Automated daily backups
   - Test restore process
   - Off-site backup storage

4. **Monitor logs** for suspicious activity

5. **Use strong passwords** and JWT secrets

## Getting Help

### Documentation
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Deployment guide
- [WHITE_LABEL.md](./WHITE_LABEL.md) - Customization guide
- [CONTRIBUTE.md](./CONTRIBUTE.md) - Contributing guide
- Upstream docs: https://github.com/rybbit-io/rybbit

### Common Issues
1. Check logs first
2. Review recent changes
3. Test locally
4. Check upstream issues
5. Restore from backup if needed

## Quick Reference

```bash
# Update from upstream
./update-from-upstream.sh

# Deploy to production
./deploy-to-hetzner.sh

# View production logs
ssh user@vps "cd /opt/buddystat && docker-compose -f docker-compose.cloud.yml logs -f"

# Restart production
ssh user@vps "cd /opt/buddystat && docker-compose -f docker-compose.cloud.yml restart"

# Backup production database
ssh user@vps "cd /opt/buddystat && docker-compose -f docker-compose.cloud.yml exec postgres pg_dump -U user db > backup.sql"
```

## Checklist: After Each Upstream Merge

- [ ] Merged upstream changes
- [ ] Resolved any conflicts
- [ ] Updated environment variables if needed
- [ ] Tested locally with docker-compose
- [ ] Verified white labeling still works
- [ ] Checked all custom features
- [ ] Ran database migrations
- [ ] Updated documentation if needed
- [ ] Backed up production database
- [ ] Deployed to production
- [ ] Verified production is working
- [ ] Monitored logs for errors
