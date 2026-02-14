# Quick SSH Reference for BuddyStat on Hetzner

## Initial Setup (One Time)
```bash
./setup-ssh-hetzner.sh
```

## Connect to Server
```bash
ssh buddystat
# or
ssh buddystat-hetzner
```

## Common Operations

### Deploy Application
```bash
./deploy-to-hetzner.sh
```

### Check Container Status
```bash
ssh buddystat "cd /opt/buddystat && docker-compose ps"
```

### View Logs
```bash
# All containers
ssh buddystat "cd /opt/buddystat && docker-compose logs -f"

# Specific container
ssh buddystat "cd /opt/buddystat && docker-compose logs -f server"
```

### Restart Services
```bash
# All services
ssh buddystat "cd /opt/buddystat && docker-compose restart"

# Specific service
ssh buddystat "cd /opt/buddystat && docker-compose restart server"
```

### Update and Rebuild
```bash
ssh buddystat "cd /opt/buddystat && git pull && docker-compose up -d --build"
```

### Copy Files To Server
```bash
scp file.txt buddystat:/opt/buddystat/
scp -r directory/ buddystat:/opt/buddystat/
```

### Copy Files From Server
```bash
scp buddystat:/opt/buddystat/file.txt ./
scp -r buddystat:/opt/buddystat/logs ./
```

### Execute Commands Remotely
```bash
# Single command
ssh buddystat "docker ps"

# Multiple commands
ssh buddystat << 'EOF'
cd /opt/buddystat
docker-compose ps
docker system df
EOF
```

### Server Management

#### Check Disk Space
```bash
ssh buddystat "df -h"
```

#### Check Memory Usage
```bash
ssh buddystat "free -h"
```

#### Check System Load
```bash
ssh buddystat "htop"
```

#### Clean Docker Resources
```bash
ssh buddystat "docker system prune -a --volumes -f"
```

### Database Operations

#### Backup Database
```bash
ssh buddystat "cd /opt/buddystat && docker-compose exec -T db pg_dump -U postgres buddystat > backup-$(date +%Y%m%d).sql"
```

#### Download Backup
```bash
scp buddystat:/opt/buddystat/backup-*.sql ./backups/
```

### Environment Variables

#### Edit .env File
```bash
ssh buddystat "nano /opt/buddystat/.env"
```

#### View .env (careful with secrets!)
```bash
ssh buddystat "cat /opt/buddystat/.env"
```

### SSL Certificates

#### Renew Certificates
```bash
ssh buddystat "docker-compose exec caddy caddy reload"
```

### Troubleshooting

#### Check Container Logs for Errors
```bash
ssh buddystat "cd /opt/buddystat && docker-compose logs --tail=100 server"
```

#### Check Network Connectivity
```bash
ssh buddystat "docker network ls"
ssh buddystat "docker network inspect buddystat_default"
```

#### Restart Everything
```bash
ssh buddystat "cd /opt/buddystat && docker-compose down && docker-compose up -d"
```

### Keep Connection Alive

If you're doing long-running operations, use screen or tmux:

```bash
# Start screen session
ssh buddystat
screen -S deployment

# Detach: Ctrl+A then D
# Reattach later:
ssh buddystat
screen -r deployment
```

## SSH Config Location
Your SSH configuration is stored in:
```
~/.ssh/config
```

To edit:
```bash
nano ~/.ssh/config
```

## Your SSH Key
Public key location:
```
~/.ssh/id_ed25519.pub
```

To view:
```bash
cat ~/.ssh/id_ed25519.pub
```

## Security Notes

- Never share your private key (`~/.ssh/id_ed25519`)
- Your public key is safe to share
- Keep backups of your SSH keys
- Consider using ssh-agent for key management:
  ```bash
  eval "$(ssh-agent -s)"
  ssh-add ~/.ssh/id_ed25519
  ```

## Need Help?

See full documentation:
- [SSH_SETUP.md](./SSH_SETUP.md) - Detailed SSH setup guide
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Deployment procedures
- [README.md](./README.md) - Project overview

---

**Your Server**: 
- Alias: `buddystat` or `buddystat-hetzner`
- Email: info@buddystat.com
- SSH Key: id_ed25519
